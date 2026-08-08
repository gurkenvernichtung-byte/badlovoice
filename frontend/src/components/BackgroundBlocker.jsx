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
          <p className="panel-kicker">Step 1 · Clean input</p>
          <h2 className="panel-title">Block background voice</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Mutes the mic when you stop talking. Cuts room noise and other people in the background
            before pitch / FX run.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ enabled: !enabled })}
          className={`rounded px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
            enabled
              ? 'border border-[#6ee7b7]/50 bg-[#6ee7b7] text-[#071416]'
              : 'border border-white/15 bg-white/[0.04] text-zinc-400'
          }`}
        >
          {enabled ? 'Blocking on' : 'Blocking off'}
        </button>
      </div>

      <div className={`mt-4 ${enabled ? '' : 'opacity-40'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Sensitivity
          </span>
          <span className="font-mono text-xs text-[#6ee7b7]">
            {thresholdDb} dB · {enabled ? (gateOpen ? 'OPEN — your voice' : 'CLOSED — background muted') : 'bypassed'}
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
        <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
          <span>More blocking</span>
          <span>Easier open</span>
        </div>

        <div className="relative mt-4 h-3 overflow-hidden rounded-sm bg-black/40">
          <div
            className="absolute inset-y-0 left-0 bg-[#3dd6e0]/35 transition-[width] duration-75"
            style={{ width: `${levelPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-[#c4783a]"
            style={{ left: `${threshPct}%` }}
            title="Gate threshold"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Copper line = threshold. Status must say OPEN while you talk. If it stays CLOSED on your
          voice, drag toward Easier open (right). Only tighten if background still leaks.
        </p>
      </div>
    </section>
  );
}
