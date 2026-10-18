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
      setError(err.message || 'Start nicht möglich. Mikrofon erlauben und erneut versuchen.');
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
          <h2 className="panel-title">Mikro, Lautsprecher & Start</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[color:var(--line)] bg-[color:var(--surface)] px-2 py-1 text-xs text-[color:var(--muted)]">
            {activeModel ? 'KI-Modell' : 'Nur Tonhöhe'}
          </span>
          <button
            type="button"
            onClick={() => devices.refresh?.().catch(() => {})}
            disabled={pipeline.isRunning || devices.isRefreshing}
            className="chip-button min-h-10"
          >
            {devices.isRefreshing ? 'Aktualisiert…' : 'Aktualisieren'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Mikrofon</label>
          <select
            value={selectedInput}
            onChange={(event) => setSelectedInput(event.target.value)}
            disabled={pipeline.isRunning}
            className="native-select-safe mt-2 min-h-11 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/70 px-3 py-2.5 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Standard-Mikrofon</option>
            {devices.inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Mikrofon (${device.deviceId.slice(0, 8)}...)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-[color:var(--muted)]">Lautsprecher</label>
          <select
            value={selectedOutput}
            onChange={(event) => setSelectedOutput(event.target.value)}
            disabled={pipeline.isRunning}
            className="native-select-safe mt-2 min-h-11 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/70 px-3 py-2.5 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Standard-Lautsprecher</option>
            {devices.outputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Lautsprecher (${device.deviceId.slice(0, 8)}...)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!devices.hasLabels && (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Mikrofonzugriff erlauben, um Gerätenamen zu sehen.
        </p>
      )}
      {devices.permissionState === 'denied' && (
        <p className="mt-2 text-xs text-[color:var(--danger)]">
          Mikrofonzugriff ist blockiert. Erlauben, dann Start tippen.
        </p>
      )}

      <p className="mt-4 rounded border border-[#6ee7b7]/25 bg-[#6ee7b7]/5 px-3 py-2 text-sm text-[#c5d5d8]">
        {pipeline.isRunning
          ? 'Live — Kopfhörer benutzen, damit du die veränderte Stimme hörst, nicht dein Raumecho.'
          : '1) Kopfhörer aufsetzen  2) Start tippen  3) Sprechen'}
      </p>

      <div className="mt-5">
        {!pipeline.isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart || starting}
            className="btn-primary"
          >
            {starting ? 'Startet…' : 'Start'}
          </button>
        ) : (
          <button type="button" onClick={handleStop} className="btn-stop">
            Stopp
          </button>
        )}
      </div>

      {!pipeline.isRunning && wsStatus !== 'connected' && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Server offline — Tonhöhe funktioniert nach Start trotzdem. Für KI-Modelle verbinden.
        </p>
      )}
      {!pipeline.isRunning && wsStatus === 'connected' && !activeModel && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Kein KI-Modell geladen — Start nutzt Tonhöhen-Presets. Unter Modelle eines aktivieren.
        </p>
      )}
      {pipeline.isRunning && !activeModel && (
        <p className="mt-3 text-xs text-[#6ee7b7]">
          Tonhöhe läuft. Für KI-Stimme: Modelle → Aktivieren → erneut Start.
        </p>
      )}
      {pipeline.isRunning && activeModel && (
        <p className="mt-3 text-xs text-[#e09a55]">
          KI-Modell: <span className="font-mono text-[#6ee7b7]">{activeModel}</span>
          {' '}— weitersprechen; die CPU kann einige Sekunden hinterherhinken.
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
