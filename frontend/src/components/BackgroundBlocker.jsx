import React from 'react';

/**
 * First-class control: mute mic when you are not talking so background
 * voices / room noise do not enter the voice changer.
 */
export default function BackgroundBlocker({
  enabled,
  thresholdDb,
  gateOpen,
  levelDb,
  onChange,
  disabled,
}) {
  const levelPct = Math.max(0, Math.min(100, ((levelDb ?? -80) + 80) * (100 / 70)));
  const threshPct = Math.max(0, Math.min(100, (thresholdDb + 80) * (100 / 70)));

  return (
    <section className="panel border-[#c4783a]/35 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="panel-kicker">Schritt 1 · Eingang säubern</p>
          <h2 className="panel-title">Hintergrundstimmen blockieren</h2>
          <p className="mt-1 max-w-xl text-sm text-[color:var(--muted)]">
            Stummt das Mikrofon, wenn du nicht sprichst. Entfernt Raumgeräusche und andere Stimmen im Hintergrund,
            bevor Tonhöhe und Effekte laufen.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ enabled: !enabled })}
          className={`rounded px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
            enabled
              ? 'border border-[#6ee7b7]/50 bg-[#6ee7b7] text-[#071416]'
              : 'border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--muted)]'
          }`}
        >
          {enabled ? 'Blockierung an' : 'Blockierung aus'}
        </button>
      </div>

      <div className={`mt-4 ${enabled ? '' : 'opacity-40'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Empfindlichkeit
          </span>
          <span className="font-mono text-xs text-[#6ee7b7]">
            {thresholdDb} dB · {enabled ? (gateOpen ? 'OFFEN — deine Stimme' : 'GESCHLOSSEN — Hintergrund stumm') : 'umgangen'}
          </span>
        </div>
        <input
          type="range"
          min={-75}
          max={-25}
          step={1}
          value={thresholdDb}
          disabled={!enabled || disabled}
          onChange={(e) => onChange({ thresholdDb: Number(e.target.value) })}
          className="mt-2 w-full"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[color:var(--muted)]">
          <span>Mehr Blockierung</span>
          <span>Leichter öffnen</span>
        </div>

        <div className="relative mt-4 h-3 overflow-hidden rounded-sm bg-[color:var(--surface-2)]">
          <div
            className="absolute inset-y-0 left-0 bg-[#3dd6e0]/35 transition-[width] duration-75"
            style={{ width: `${levelPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-[#c4783a]"
            style={{ left: `${threshPct}%` }}
            title="Gate-Schwelle"
          />
        </div>
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Kupferne Linie = Schwelle. Der Status muss beim Sprechen OFFEN zeigen. Bleibt er bei deiner Stimme
          GESCHLOSSEN, nach rechts (Leichter öffnen) ziehen. Nur verschärfen, wenn Hintergrund noch durchkommt.
        </p>
      </div>
    </section>
  );
}
