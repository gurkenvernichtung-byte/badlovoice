import React, { useMemo, useState } from 'react';
import {
  FEATURED_PROFILE_IDS,
  VOICE_PROFILES,
} from '../lib/voiceProfiles';
import Recorder from './Recorder';

function LevelBar({ label, value, tone = 'signal' }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const fill = tone === 'out' ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--mic)]';
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center justify-between text-xs text-[color:var(--muted)]">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="level-track">
        <div className={`level-fill ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VoiceChip({ profile, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      aria-pressed={selected}
      className={`voice-chip ${selected ? 'voice-chip-on' : ''}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="voice-chip-name block text-[15px] font-semibold tracking-tight">
          {profile.name}
        </span>
        {selected ? (
          <span
            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-bold text-[#1f120c]"
            aria-hidden="true"
          >
            ✓
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-xs text-[color:var(--muted)]">{profile.blurb}</span>
    </button>
  );
}

function pitchLabel(pitch) {
  if (pitch === 0) return 'Natürlich 0';
  if (pitch > 0) return `Höher +${pitch.toFixed(1)}`;
  return `Tiefer ${pitch.toFixed(1)}`;
}

export default function SimpleHome({
  devices,
  pipeline,
  voice,
  onVoiceChange,
  activePresetId,
  onSelectProfile,
}) {
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showDevices, setShowDevices] = useState(false);

  const featured = useMemo(
    () =>
      FEATURED_PROFILE_IDS.map((id) => VOICE_PROFILES.find((p) => p.id === id)).filter(
        Boolean
      ),
    []
  );
  const moreProfiles = useMemo(
    () => VOICE_PROFILES.filter((p) => !FEATURED_PROFILE_IDS.includes(p.id)),
    []
  );

  const tip = (() => {
    if (devices.permissionState === 'denied') {
      return 'Mikrofonzugriff erlauben, dann Start tippen';
    }
    if (pipeline.isRunning) {
      return 'Jetzt sprechen — Kopfhörer helfen';
    }
    return 'Kopfhörer auf, dann Start';
  })();

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      await devices.refresh?.();
      await pipeline.start(selectedInput || undefined, selectedOutput || undefined);
    } catch (err) {
      setError(err.message || 'Start nicht möglich. Mikrofon erlauben und erneut versuchen.');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    setError(null);
    pipeline.stop();
  };

  const pitch = Number(voice.pitch) || 0;

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      <div>
        <div
          className={`status-pill ${
            pipeline.isRunning ? 'status-pill-live' : 'status-pill-off'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              pipeline.isRunning
                ? 'bg-[color:var(--accent)] rec-blink'
                : 'bg-[color:var(--ink-text)]/25'
            }`}
          />
          {pipeline.isRunning ? 'Live' : 'Aus'}
        </div>
        <p className="mt-2 text-sm text-[color:var(--muted)]" aria-live="polite">
          {tip}
        </p>
      </div>

      {!pipeline.isRunning ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="btn-primary text-lg"
        >
          {starting ? 'Startet…' : 'Start'}
        </button>
      ) : (
        <button type="button" onClick={handleStop} className="btn-stop text-lg">
          Stopp
        </button>
      )}

      {error && (
        <div
          className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 p-3"
          role="alert"
        >
          <p className="text-sm text-[color:var(--danger-soft)]">{error}</p>
        </div>
      )}
      {devices.error && !error && (
        <div
          className="rounded-2xl border border-amber-700/25 bg-amber-500/10 p-3"
          role="status"
        >
          <p className="text-sm text-amber-950">{devices.error}</p>
        </div>
      )}

      <div className="panel flex gap-4 p-4">
        <LevelBar label="Mikro" value={pipeline.inputLevel} />
        <LevelBar label="Stimme" value={pipeline.outputLevel} tone="out" />
      </div>

      <section>
        <h2 className="font-display text-lg font-bold tracking-tight">Stimme wählen</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Tippen, dann sprechen</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {featured.map((profile) => (
            <VoiceChip
              key={profile.id}
              profile={profile}
              selected={activePresetId === profile.id}
              onSelect={onSelectProfile}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="mt-3 min-h-11 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-sm font-medium text-[color:var(--muted)] transition hover:border-[color:var(--ink-text)]/20 hover:text-[color:var(--ink-text)]"
        >
          {showMore ? 'Weniger Stimmen' : 'Mehr Stimmen'}
        </button>

        {showMore && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {moreProfiles.map((profile) => (
              <VoiceChip
                key={profile.id}
                profile={profile}
                selected={activePresetId === profile.id}
                onSelect={onSelectProfile}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="simple-pitch" className="text-sm font-semibold">
            Tonhöhe
          </label>
          <span className="text-xs font-medium tabular-nums text-[color:var(--accent-soft)]">
            {pitchLabel(pitch)}
          </span>
        </div>
        <input
          id="simple-pitch"
          type="range"
          min={-16}
          max={16}
          step={0.5}
          value={pitch}
          onChange={(e) => onVoiceChange({ pitch: Number(e.target.value) })}
          className="touch-slider mt-2 w-full"
          aria-valuetext={pitchLabel(pitch)}
        />
        <div className="mt-1 flex justify-between text-xs text-[color:var(--muted)]">
          <span>Tiefer</span>
          <span>Höher</span>
        </div>
      </section>

      <Recorder
        compact
        pipeline={pipeline}
        onEnsureStarted={async () => {
          if (pipeline.isRunning) return;
          await devices.refresh?.();
          await pipeline.start(selectedInput || undefined, selectedOutput || undefined);
        }}
      />

      <div className="panel overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDevices((v) => !v)}
          aria-expanded={showDevices}
          className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-medium text-[color:var(--ink-text)]"
        >
          <span>Mikrofon & Lautsprecher</span>
          <span className="text-[color:var(--muted)]">{showDevices ? 'Ausblenden' : 'Einblenden'}</span>
        </button>
        {showDevices && (
          <div className="space-y-3 border-t border-[color:var(--line)] px-4 pb-4 pt-3">
            <div>
              <label className="block text-xs text-[color:var(--muted)]" htmlFor="simple-mic">
                Mikrofon
              </label>
              <select
                id="simple-mic"
                value={selectedInput}
                onChange={(e) => setSelectedInput(e.target.value)}
                disabled={pipeline.isRunning}
                className="native-select-safe mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-sm outline-none focus-visible:border-[color:var(--accent)]/50 disabled:opacity-50"
              >
                <option value="">Standard-Mikrofon</option>
                {devices.inputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Mikrofon (${device.deviceId.slice(0, 8)}…)`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[color:var(--muted)]" htmlFor="simple-speaker">
                Lautsprecher
              </label>
              <select
                id="simple-speaker"
                value={selectedOutput}
                onChange={(e) => setSelectedOutput(e.target.value)}
                disabled={pipeline.isRunning}
                className="native-select-safe mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-sm outline-none focus-visible:border-[color:var(--accent)]/50 disabled:opacity-50"
              >
                <option value="">Standard-Lautsprecher</option>
                {devices.outputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Lautsprecher (${device.deviceId.slice(0, 8)}…)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
