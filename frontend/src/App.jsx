import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from './components/Layout';
import StatusIndicator from './components/StatusIndicator';
import AudioControls from './components/AudioControls';
import GlobalSettings from './components/GlobalSettings';
import ModelManager from './components/ModelManager';
import MonitorDisplay from './components/MonitorDisplay';
import Visualizer from './components/Visualizer';
import VoiceLab from './components/VoiceLab';
import EffectsRack from './components/EffectsRack';
import PresetBar from './components/PresetBar';
import Recorder from './components/Recorder';
import FileConverter from './components/FileConverter';
import SlotBay from './components/SlotBay';
import StreamExtras from './components/StreamExtras';
import BackgroundBlocker from './components/BackgroundBlocker';
import VoiceProfiles from './components/VoiceProfiles';
import EngineModes from './components/EngineModes';
import SimpleHome from './components/SimpleHome';
import useWebSocket from './hooks/useWebSocket';
import useAudioPipeline from './hooks/useAudioPipeline';
import useAudioDevices from './hooks/useAudioDevices';
import { getActiveModel, fetchConfig } from './lib/api';
import { applyConfig } from './lib/constants';
import { defaultEffects, effectsFromPreset } from './lib/effects';
import { profileToEffects, profileToVoicePartial } from './lib/voiceProfiles';

const GLOBAL_SETTINGS_STORAGE_KEY = 'shiftbooth_global_settings';
const VOICE_STORAGE_KEY = 'shiftbooth_voice_v11';
const EFFECTS_STORAGE_KEY = 'shiftbooth_effects_v10';
const EXTRAS_STORAGE_KEY = 'shiftbooth_extras_v10';
const UI_MODE_STORAGE_KEY = 'shiftbooth_ui_mode';

const DEFAULT_VOICE = {
  pitch: 7,
  formant: 3.5,
  f0Method: 'pm',
  // 0 = faster realtime RVC on CPU (index search is too slow live).
  indexRate: 0,
  rmsMixRate: 0.25,
  protect: 0.33,
};

const DEFAULT_RUNTIME_INFO = {
  onnx: {
    available: false,
    activeProvider: null,
    availableProviders: [],
    gpuEnabled: false,
  },
  torch: {
    available: false,
    device: 'unavailable',
    gpuName: null,
    cudaAvailable: false,
    cudaVersion: null,
  },
};
const DEFAULT_RUNTIME_CONFIG = {
  sampleRate: 40000,
  chunkSize: 4096,
  runtime: DEFAULT_RUNTIME_INFO,
};

function normalizePositiveInt(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : fallback;
}

function readStored(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}

function mergeRuntimeConfig(config, stored = null) {
  const baseSampleRate = normalizePositiveInt(
    config?.sample_rate ?? config?.sampleRate,
    DEFAULT_RUNTIME_CONFIG.sampleRate
  );
  const baseChunkSize = normalizePositiveInt(
    config?.chunk_size ?? config?.chunkSize,
    DEFAULT_RUNTIME_CONFIG.chunkSize
  );

  return {
    sampleRate: normalizePositiveInt(stored?.sampleRate, baseSampleRate),
    chunkSize: normalizePositiveInt(stored?.chunkSize, baseChunkSize),
    runtime: {
      onnx: {
        ...DEFAULT_RUNTIME_INFO.onnx,
        available: Boolean(config?.runtime?.onnx?.available ?? config?.onnx_available),
        activeProvider: config?.runtime?.onnx?.activeProvider ?? DEFAULT_RUNTIME_INFO.onnx.activeProvider,
        selectedProviders: Array.isArray(config?.runtime?.onnx?.selectedProviders)
          ? config.runtime.onnx.selectedProviders
          : [],
        availableProviders: Array.isArray(config?.runtime?.onnx?.availableProviders)
          ? config.runtime.onnx.availableProviders
          : DEFAULT_RUNTIME_INFO.onnx.availableProviders,
        gpuEnabled: Boolean(config?.runtime?.onnx?.gpuEnabled),
      },
      torch: {
        ...DEFAULT_RUNTIME_INFO.torch,
        available: Boolean(config?.runtime?.torch?.available ?? config?.torch_available),
        device: config?.runtime?.torch?.device ?? DEFAULT_RUNTIME_INFO.torch.device,
        gpuName: config?.runtime?.torch?.gpuName ?? DEFAULT_RUNTIME_INFO.torch.gpuName,
        cudaAvailable: Boolean(config?.runtime?.torch?.cudaAvailable),
        cudaVersion: config?.runtime?.torch?.cudaVersion ?? DEFAULT_RUNTIME_INFO.torch.cudaVersion,
      },
    },
  };
}

function loadInitialVoice() {
  const stored = readStored(VOICE_STORAGE_KEY);
  return stored ? { ...DEFAULT_VOICE, ...stored } : { ...DEFAULT_VOICE };
}

function loadInitialEffects() {
  const stored = readStored(EFFECTS_STORAGE_KEY);
  if (stored) return effectsFromPreset(stored);
  const fx = defaultEffects();
  fx.robot = { enabled: false, freq: 90 };
  fx.gate = { enabled: false, threshold: -56 };
  fx.eq = { enabled: true, low: -1, high: 3 };
  return fx;
}

export default function App() {
  const wsHook = useWebSocket();
  const pipeline = useAudioPipeline(wsHook);
  const devices = useAudioDevices();

  // Deep links: ?tab=models|converter selects a tab, ?settings opens the modal.
  const [uiMode, setUiMode] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('tab');
    if (param === 'models' || param === 'converter') return 'pro';
    const stored = readStored(UI_MODE_STORAGE_KEY);
    if (stored === 'pro' || stored === 'simple') return stored;
    return 'simple';
  });
  const [tab, setTab] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('tab');
    return ['studio', 'models', 'converter'].includes(param) ? param : 'studio';
  });
  const [activeModel, setActiveModel] = useState(null);
  const [runtimeConfig, setRuntimeConfig] = useState(DEFAULT_RUNTIME_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    () => new URLSearchParams(window.location.search).has('settings')
  );
  const [voice, setVoice] = useState(loadInitialVoice);
  const [effects, setEffects] = useState(loadInitialEffects);
  const [activePresetId, setActivePresetId] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [extras, setExtras] = useState(() => {
    const stored = readStored(EXTRAS_STORAGE_KEY) || {};
    return {
      latencyMode: 'balanced',
      crossfadeMs: 8,
      extraBufferChunks: 1,
      ...stored,
      // Gate OFF by default — it was muting mics and sounded like "nothing works".
      blockBackground: stored.blockBackground ?? false,
      vadEnabled: stored.vadEnabled ?? false,
      vadThresholdDb: stored.vadThresholdDb ?? -56,
    };
  });

  const {
    status: wsStatus,
    latency,
    serverMs,
    serverStats,
    connect,
    disconnect,
    sendSettings,
    setOnSettingsResponse,
    setOnOpen,
  } = wsHook;

  // --- Settings payload sync -------------------------------------------------

  const settingsPayloadRef = useRef(null);
  const effectsWithGate = {
    ...effects,
    gate: {
      enabled: Boolean(extras.blockBackground),
      threshold: Number(extras.vadThresholdDb) || -56,
    },
  };

  // With an RVC/ONNX module, let the model own the voice — don't stack DSP pitch/formant.
  const modelActive = Boolean(activeModel);
  settingsPayloadRef.current = {
    pitch_shift: modelActive ? 0 : voice.pitch,
    formant_shift: modelActive ? 0 : voice.formant,
    f0_method: voice.f0Method,
    index_rate: voice.indexRate,
    rms_mix_rate: voice.rmsMixRate,
    protect: voice.protect,
    effects: effectsWithGate,
    vad_enabled: Boolean(extras.blockBackground),
    vad_threshold_db: extras.vadThresholdDb,
    latency_mode: extras.latencyMode,
    crossfade_ms: extras.crossfadeMs,
    extra_buffer_chunks: extras.extraBufferChunks,
  };

  const settingsDebounceRef = useRef(null);
  useEffect(() => {
    writeStored(VOICE_STORAGE_KEY, voice);
    writeStored(EFFECTS_STORAGE_KEY, effects);
    writeStored(EXTRAS_STORAGE_KEY, extras);

    // DSP: loud local pitch. RVC: duck local so you can hear the model return.
    pipeline.setListenMode?.(modelActive ? 'rvc' : 'local');
    pipeline.setMonitorParams?.({
      pitch: modelActive ? 0 : (Number(voice.pitch) || 7),
      // Keep robot mild — high wet made recordings unintelligible.
      robot: !modelActive && effects?.robot?.enabled ? 0.4 : 0,
      robotFreq: Number(effects?.robot?.freq) || 90,
      enabled: !modelActive,
    });
    pipeline.setGateParams?.({
      enabled: Boolean(extras.blockBackground),
      thresholdDb: Number(extras.vadThresholdDb) || -56,
      holdMs: 280,
    });

    if (wsStatus !== 'connected') return undefined;
    if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
    settingsDebounceRef.current = setTimeout(() => {
      sendSettings(settingsPayloadRef.current);
    }, 140);
    return () => {
      if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, effects, extras, wsStatus, sendSettings, modelActive]);

  // Push the full current settings as soon as a connection opens.
  useEffect(() => {
    setOnOpen(() => sendSettings(settingsPayloadRef.current));
  }, [setOnOpen, sendSettings]);

  // --- Bootstrap -------------------------------------------------------------

  useEffect(() => {
    const storedConfig = readStored(GLOBAL_SETTINGS_STORAGE_KEY);

    fetchConfig()
      .then((cfg) => {
        const nextRuntimeConfig = mergeRuntimeConfig(cfg, storedConfig);
        applyConfig({
          sample_rate: nextRuntimeConfig.sampleRate,
          chunk_size: nextRuntimeConfig.chunkSize,
        });
        setRuntimeConfig(nextRuntimeConfig);
      })
      .catch(() => {
        const nextRuntimeConfig = mergeRuntimeConfig({}, storedConfig);
        applyConfig({
          sample_rate: nextRuntimeConfig.sampleRate,
          chunk_size: nextRuntimeConfig.chunkSize,
        });
        setRuntimeConfig(nextRuntimeConfig);
      })
      .finally(() => connect());
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SPA-safe anchor scrolling (e.g. /#effects) once the page has rendered.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkActiveModel = async () => {
      try {
        const active = await getActiveModel();
        setActiveModel(active?.name || active?.model || null);
      } catch {
        // Server may not be ready yet.
      }
    };

    checkActiveModel();
    const interval = setInterval(checkActiveModel, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setOnSettingsResponse?.((msg) => {
      if (msg.type === 'model_change') {
        setActiveModel(msg.model || null);
      }
      if (msg.type === 'status' && msg.active_model !== undefined) {
        setActiveModel(msg.active_model);
      }
    });
  }, [setOnSettingsResponse]);

  // Rolling round-trip latency history for the sparkline.
  useEffect(() => {
    if (latency <= 0) return;
    setLatencyHistory((prev) => {
      const next = [...prev, latency];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, [latency]);

  useEffect(() => {
    if (!pipeline.isRunning) setLatencyHistory([]);
  }, [pipeline.isRunning]);

  // --- Handlers --------------------------------------------------------------

  const handleVoiceChange = useCallback((partial) => {
    setActivePresetId(null);
    setVoice((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleEffectsChange = useCallback((nextEffects) => {
    setActivePresetId(null);
    setEffects(nextEffects);
  }, []);

  const applyPreset = useCallback((preset) => {
    const settings = preset?.settings || {};
    setVoice((prev) => ({
      ...prev,
      pitch: Number(settings.pitch_shift ?? 0),
      formant: Number(settings.formant_shift ?? 0),
    }));
    setEffects(effectsFromPreset(settings.effects));
    setActivePresetId(preset.id);
  }, []);

  const applyVoiceProfile = useCallback((profile) => {
    setVoice((prev) => ({ ...prev, ...profileToVoicePartial(profile) }));
    setEffects((prev) => profileToEffects(profile, prev));
    setActivePresetId(profile.id);
  }, []);

  const getCurrentSettings = useCallback(() => ({
    pitch_shift: voice.pitch,
    formant_shift: voice.formant,
    effects,
  }), [voice, effects]);

  const getProfileSnapshot = useCallback(() => ({
    pitch_shift: voice.pitch,
    formant_shift: voice.formant,
    f0_method: voice.f0Method,
    index_rate: voice.indexRate,
    rms_mix_rate: voice.rmsMixRate,
    protect: voice.protect,
    effects,
    extras,
    sample_rate: runtimeConfig.sampleRate,
    chunk_size: runtimeConfig.chunkSize,
  }), [voice, effects, extras, runtimeConfig]);

  const handleExtrasChange = useCallback((partial) => {
    if (partial.applyProfile) {
      const s = partial.applyProfile;
      if (s.pitch_shift != null || s.formant_shift != null) {
        setVoice((prev) => ({
          ...prev,
          pitch: Number(s.pitch_shift ?? prev.pitch),
          formant: Number(s.formant_shift ?? prev.formant),
          f0Method: s.f0_method ?? prev.f0Method,
          indexRate: s.index_rate ?? prev.indexRate,
          rmsMixRate: s.rms_mix_rate ?? prev.rmsMixRate,
          protect: s.protect ?? prev.protect,
        }));
      }
      if (s.effects) setEffects(effectsFromPreset(s.effects));
      if (s.extras) setExtras((prev) => ({ ...prev, ...s.extras }));
      setActivePresetId(null);
      return;
    }
    setExtras((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleGlobalSettingsChange = useCallback(
    (partialConfig) => {
      setRuntimeConfig((currentConfig) => {
        const nextRuntimeConfig = {
          ...currentConfig,
          sampleRate: normalizePositiveInt(partialConfig.sampleRate, currentConfig.sampleRate),
          chunkSize: normalizePositiveInt(partialConfig.chunkSize, currentConfig.chunkSize),
        };

        writeStored(GLOBAL_SETTINGS_STORAGE_KEY, {
          sampleRate: nextRuntimeConfig.sampleRate,
          chunkSize: nextRuntimeConfig.chunkSize,
        });
        applyConfig({
          sample_rate: nextRuntimeConfig.sampleRate,
          chunk_size: nextRuntimeConfig.chunkSize,
        });

        if (!pipeline.isRunning && wsStatus === 'connected') {
          sendSettings({
            sample_rate: nextRuntimeConfig.sampleRate,
            chunk_size: nextRuntimeConfig.chunkSize,
          });
        }

        return nextRuntimeConfig;
      });
    },
    [pipeline.isRunning, sendSettings, wsStatus]
  );

  const handleApplyLatencyMode = useCallback(
    (mode) => {
      setExtras((prev) => ({
        ...prev,
        latencyMode: mode.id,
        crossfadeMs: mode.crossfade_ms,
        extraBufferChunks: mode.extra_buffer_chunks,
      }));
      handleGlobalSettingsChange({
        sampleRate: runtimeConfig.sampleRate,
        chunkSize: mode.chunk_size,
      });
    },
    [handleGlobalSettingsChange, runtimeConfig.sampleRate]
  );

  useEffect(() => {
    if (!isSettingsOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  // --- Render ----------------------------------------------------------------

  const handleUiModeChange = useCallback((mode) => {
    const next = mode === 'pro' ? 'pro' : 'simple';
    setUiMode(next);
    writeStored(UI_MODE_STORAGE_KEY, next);
    if (next === 'simple') setTab('studio');
  }, []);

  const headerActions = (
    <button
      onClick={() => setIsSettingsOpen(true)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[color:var(--muted)] transition hover:border-white/20 hover:text-[color:var(--ink-text)]"
      title="Session settings"
      aria-label="Open settings"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    </button>
  );

  const isSimple = uiMode !== 'pro';

  return (
    <Layout
      tab={tab}
      onTabChange={setTab}
      uiMode={isSimple ? 'simple' : 'pro'}
      onUiModeChange={handleUiModeChange}
      statusSlot={<StatusIndicator wsStatus={wsStatus} activeModel={activeModel} mode={serverStats.mode} />}
      headerActions={headerActions}
    >
      {isSimple && (
        <SimpleHome
          devices={devices}
          pipeline={pipeline}
          voice={voice}
          onVoiceChange={handleVoiceChange}
          activePresetId={activePresetId}
          onSelectProfile={applyVoiceProfile}
        />
      )}

      {!isSimple && tab === 'studio' && (
        <div className="space-y-5 animate-fade-in-up">
          <EngineModes
            hasModel={Boolean(activeModel)}
            torchOk={Boolean(runtimeConfig.runtime?.torch?.available)}
            onnxOk={Boolean(runtimeConfig.runtime?.onnx?.available)}
          />

          <BackgroundBlocker
            enabled={Boolean(extras.blockBackground)}
            thresholdDb={Number(extras.vadThresholdDb) || -56}
            gateOpen={pipeline.gateOpen}
            levelDb={pipeline.gateLevelDb}
            onChange={(partial) => {
              setExtras((prev) => ({
                ...prev,
                blockBackground: partial.enabled ?? prev.blockBackground,
                vadThresholdDb: partial.thresholdDb ?? prev.vadThresholdDb,
                vadEnabled: partial.enabled ?? prev.blockBackground,
              }));
            }}
          />

          <VoiceProfiles
            activeId={activePresetId}
            onSelect={applyVoiceProfile}
            hasModel={Boolean(activeModel)}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <Visualizer getAnalysers={pipeline.getAnalysers} isRunning={pipeline.isRunning} />
              <AudioControls
                devices={devices}
                pipeline={pipeline}
                wsStatus={wsStatus}
                activeModel={activeModel}
              />
              <Recorder
                pipeline={pipeline}
                onEnsureStarted={async () => {
                  if (pipeline.isRunning) return;
                  await devices.refresh?.();
                  await pipeline.start();
                }}
              />
            </div>

            <div className="space-y-5">
              <MonitorDisplay
                inputLevel={pipeline.inputLevel}
                outputLevel={pipeline.outputLevel}
                latency={latency}
                latencyHistory={latencyHistory}
                serverMs={serverMs}
                serverStats={serverStats}
              />
              <VoiceLab
                voice={voice}
                onChange={handleVoiceChange}
                hasModel={Boolean(activeModel)}
                isRunning={pipeline.isRunning}
              />
            </div>
          </div>

          <StreamExtras
            vadEnabled={extras.vadEnabled}
            vadThresholdDb={extras.vadThresholdDb}
            latencyMode={extras.latencyMode}
            crossfadeMs={extras.crossfadeMs}
            extraBufferChunks={extras.extraBufferChunks}
            onChange={handleExtrasChange}
            onApplyLatencyMode={handleApplyLatencyMode}
            getSnapshot={getProfileSnapshot}
            disabled={pipeline.isRunning}
          />

          <PresetBar
            activePresetId={activePresetId}
            onApplyPreset={applyPreset}
            getCurrentSettings={getCurrentSettings}
          />

          <EffectsRack
            effects={effectsWithGate}
            formantShift={voice.formant}
            onEffectsChange={handleEffectsChange}
          />
        </div>
      )}

      {!isSimple && tab === 'models' && (
        <div className="mx-auto max-w-4xl space-y-5 animate-fade-in-up">
          <SlotBay activeModel={activeModel} onActiveModelChange={setActiveModel} />
          <ModelManager
            activeModel={activeModel}
            onActiveModelChange={setActiveModel}
            runtime={runtimeConfig.runtime}
          />
        </div>
      )}

      {!isSimple && tab === 'converter' && (
        <div className="mx-auto max-w-3xl animate-fade-in-up">
          <FileConverter
            voice={voice}
            effects={effects}
            activeModel={activeModel}
          />
        </div>
      )}

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            className="absolute inset-0 bg-black/72 backdrop-blur-md"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close settings modal"
          />
          <div className="relative max-h-[calc(100svh-2.5rem)] w-full max-w-5xl overflow-y-auto">
            <GlobalSettings
              config={runtimeConfig}
              onChange={handleGlobalSettingsChange}
              disabled={pipeline.isRunning}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
