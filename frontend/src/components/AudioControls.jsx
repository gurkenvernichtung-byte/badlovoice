import React, { useState } from 'react';

export default function AudioControls({ devices, pipeline, wsStatus, activeModel }) {
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // Pitch monitor works offline (Android APK). Server optional for RVC.
  const canStart = !pipeline.isRunning;

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      await devices.refresh?.();
      await pipeline.start(selectedInput || undefined, selectedOutput || undefined);
    } catch (err) {
      setError(err.message || 'Could not start. Allow the mic, then try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    setError(null);
    pipeline.stop();
  };

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-kicker">Audio</p>
          <h2 className="panel-title">Mic, speaker & Start</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[color:var(--line)] bg-[color:var(--surface)] px-2 py-1 text-xs text-[color:var(--muted)]">
            {activeModel ? 'AI model' : 'Pitch only'}
          </span>
          <button
            type="button"
            onClick={() => devices.refresh?.().catch(() => {})}
            disabled={pipeline.isRunning || devices.isRefreshing}
            className="chip-button min-h-10"
          >
            {devices.isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Microphone</label>
          <select
            value={selectedInput}
            onChange={(event) => setSelectedInput(event.target.value)}
            disabled={pipeline.isRunning}
            className="native-select-safe mt-2 min-h-11 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/70 px-3 py-2.5 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Default microphone</option>
            {devices.inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone (${device.deviceId.slice(0, 8)}...)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-[color:var(--muted)]">Speaker</label>
          <select
            value={selectedOutput}
            onChange={(event) => setSelectedOutput(event.target.value)}
            disabled={pipeline.isRunning}
            className="native-select-safe mt-2 min-h-11 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/70 px-3 py-2.5 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Default speaker</option>
            {devices.outputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker (${device.deviceId.slice(0, 8)}...)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!devices.hasLabels && (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Allow microphone access to see device names.
        </p>
      )}
      {devices.permissionState === 'denied' && (
        <p className="mt-2 text-xs text-[color:var(--danger)]">
          Microphone permission is blocked. Allow it, then tap Start.
        </p>
      )}

      <p className="mt-4 rounded border border-[#6ee7b7]/25 bg-[#6ee7b7]/5 px-3 py-2 text-sm text-[#c5d5d8]">
        {pipeline.isRunning
          ? 'Live — use headphones so you hear the changed voice, not your room echo.'
          : '1) Wear headphones  2) Tap Start  3) Talk'}
      </p>

      <div className="mt-5">
        {!pipeline.isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart || starting}
            className="btn-primary"
          >
            {starting ? 'Starting…' : 'Start'}
          </button>
        ) : (
          <button type="button" onClick={handleStop} className="btn-stop">
            Stop
          </button>
        )}
      </div>

      {!pipeline.isRunning && wsStatus !== 'connected' && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Server offline — pitch still works after Start. Connect for AI models.
        </p>
      )}
      {!pipeline.isRunning && wsStatus === 'connected' && !activeModel && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          No AI model loaded — Start uses pitch presets. Open Models to activate one.
        </p>
      )}
      {pipeline.isRunning && !activeModel && (
        <p className="mt-3 text-xs text-[#6ee7b7]">
          Pitch live. For AI voice: Models → Activate → Start again.
        </p>
      )}
      {pipeline.isRunning && activeModel && (
        <p className="mt-3 text-xs text-[#e09a55]">
          AI model: <span className="font-mono text-[#6ee7b7]">{activeModel}</span>
          {' '}— keep talking; CPU may lag a few seconds.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 p-3">
          <p className="text-sm text-[color:var(--danger-soft)]">{error}</p>
        </div>
      )}
      {devices.error && !error && (
        <div className="mt-3 rounded-md border border-amber-300/25 bg-amber-400/10 p-3">
          <p className="text-sm text-amber-100">{devices.error}</p>
        </div>
      )}
    </section>
  );
}
