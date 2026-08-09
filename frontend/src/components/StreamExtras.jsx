import React, { useEffect, useState } from 'react';
import { deleteProfile, fetchLatencyModes, fetchProfiles, saveProfile } from '../lib/api';

/** Latency modes (echidna) + VAD (Vonovox) + profiles + VAC guide */
export default function StreamExtras({
  vadEnabled,
  vadThresholdDb,
  latencyMode,
  crossfadeMs,
  extraBufferChunks,
  onChange,
  onApplyLatencyMode,
  getSnapshot,
  disabled,
}) {
  const [modes, setModes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchLatencyModes()
      .then((m) => setModes(m || []))
      .catch(() => setModes([]));
    fetchProfiles()
      .then((p) => setProfiles(p || []))
      .catch(() => setProfiles([]));
  }, []);

  const persistProfile = async () => {
    if (!profileName.trim()) return;
    try {
      await saveProfile(profileName.trim(), getSnapshot());
      setProfiles(await fetchProfiles());
      setProfileName('');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeProfile = async (id) => {
    try {
      await deleteProfile(id);
      setProfiles(await fetchProfiles());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel space-y-4 p-4">
      <div>
        <p className="panel-kicker">Merged controls</p>
        <h2 className="panel-title">Stream extras</h2>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Latency mode · echidna
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onApplyLatencyMode(mode)}
              className={`rounded border px-3 py-2 text-left transition ${
                latencyMode === mode.id
                  ? 'border-[#6ee7b7] bg-[#6ee7b7]/10'
                  : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60 hover:border-[color:var(--ink-text)]/25'
              }`}
            >
              <span className="block text-sm font-semibold text-[color:var(--ink-text)]">{mode.label}</span>
              <span className="mt-1 block font-mono text-[10px] text-[color:var(--muted)]">
                chunk {mode.chunk_size} · xf {mode.crossfade_ms}ms
              </span>
              <span className="mt-1 block text-xs text-[color:var(--muted)]">{mode.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Crossfade ms · w-okada SOLA
          </span>
          <input
            type="range"
            min={0}
            max={64}
            value={crossfadeMs}
            disabled={disabled}
            onChange={(e) => onChange({ crossfadeMs: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <span className="font-mono text-xs text-[#6ee7b7]">{crossfadeMs} ms</span>
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Extra buffer chunks
          </span>
          <input
            type="range"
            min={0}
            max={8}
            value={extraBufferChunks}
            disabled={disabled}
            onChange={(e) => onChange({ extraBufferChunks: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <span className="font-mono text-xs text-[#6ee7b7]">{extraBufferChunks}</span>
        </label>
      </div>

      <div className="rounded border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              VAD / noise gate · Vonovox
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Mute silence so the model stays quiet between words.</p>
          </div>
          <button
            type="button"
            className={`chip-button ${vadEnabled ? '!border-[#6ee7b7] !text-[#6ee7b7]' : ''}`}
            onClick={() => onChange({ vadEnabled: !vadEnabled })}
          >
            {vadEnabled ? 'VAD on' : 'VAD off'}
          </button>
        </div>
        <label className="mt-3 block">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--muted)]">Threshold dB</span>
          <input
            type="range"
            min={-80}
            max={-10}
            step={1}
            value={vadThresholdDb}
            disabled={!vadEnabled}
            onChange={(e) => onChange({ vadThresholdDb: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <span className="font-mono text-xs text-[#6ee7b7]">{vadThresholdDb} dB</span>
        </label>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Profiles · echidna
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Profile name"
            className="min-w-[10rem] flex-1 rounded border border-[color:var(--line)] bg-black/30 px-2 py-1.5 text-sm"
          />
          <button type="button" className="chip-button" onClick={persistProfile}>
            Save profile
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-1 rounded border border-[color:var(--line)] px-2 py-1 text-xs">
              <button
                type="button"
                className="text-[color:var(--ink-text)] hover:text-[#6ee7b7]"
                onClick={() => onChange({ applyProfile: p.settings })}
              >
                {p.name}
              </button>
              <button type="button" className="text-[color:var(--muted)] hover:text-red-300" onClick={() => removeProfile(p.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button type="button" className="chip-button" onClick={() => setShowGuide((v) => !v)}>
          {showGuide ? 'Hide' : 'Show'} VAC routing guide · Vonovox
        </button>
        {showGuide ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[color:var(--muted)]">
            <li>Install VAC (Virtual Audio Cable) — prefer VAC over VB-Cable for fewer glitches.</li>
            <li>Set mic + virtual line to 48000 Hz, 1 ch, 16-bit when possible.</li>
            <li>BadloVoice input = your real mic. Output = Line 1 (VAC).</li>
            <li>In Windows Sound → Recording → Line 1 → Listen to this device (for monitoring).</li>
            <li>In Discord/games, pick Line 1 as the microphone.</li>
            <li>For remote GPU box (w-okada style), run the backend on the GPU PC and open this UI over the network.</li>
          </ol>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
