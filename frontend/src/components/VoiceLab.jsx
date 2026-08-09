import React, { useState } from 'react';

const F0_METHODS = [
  { value: 'pm', label: 'PM', description: 'Lowest latency' },
  { value: 'harvest', label: 'Harvest', description: 'Stable tone' },
  { value: 'crepe', label: 'Crepe', description: 'GPU quality' },
  { value: 'rmvpe', label: 'RMVPE', description: 'Best overall' },
  { value: 'fcpe', label: 'FCPE', description: 'Fast neural, realtime' },
];

function BigSlider({ label, value, min, max, step, unit, onChange, onReset }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xl font-semibold tabular-nums tracking-[-0.03em] ${value === 0 ? 'text-[color:var(--muted)]' : 'text-[color:var(--ink-text)]'}`}>
            {value > 0 ? '+' : ''}{Number(value).toFixed(1)}{unit}
          </span>
          <button
            onClick={onReset}
            disabled={value === 0}
            className="chip-button !px-2.5 !py-1"
          >
            ⟲
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full"
      />
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-[color:var(--muted)]">
        <span>{min}</span>
        <span>0</span>
        <span>+{max}</span>
      </div>
    </div>
  );
}

function MiniSlider({ label, value, min, max, step, onChange, format = (v) => v.toFixed(2) }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[color:var(--muted)]">{label}</span>
        <span className="font-mono text-xs tabular-nums text-[color:var(--ink-text)]">{format(Number(value))}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="fx-slider mt-2 w-full"
      />
    </div>
  );
}

export default function VoiceLab({ voice, onChange, hasModel, isRunning, compact = false }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sliders = (
    <div className={compact ? 'mt-3 space-y-4' : 'mt-5 space-y-6'}>
      <BigSlider
        label="Pitch Shift"
        value={voice.pitch}
        min={-12}
        max={12}
        step={0.5}
        unit=" st"
        onChange={(value) => onChange({ pitch: value })}
        onReset={() => onChange({ pitch: 0 })}
      />

      <BigSlider
        label="Formant Shift"
        value={voice.formant}
        min={-12}
        max={12}
        step={0.5}
        unit=" st"
        onChange={(value) => onChange({ formant: value })}
        onReset={() => onChange({ formant: 0 })}
      />
    </div>
  );

  if (compact) {
    return (
      <section className="panel p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Voice Lab
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight">Pitch & formant</h2>
          </div>
          <button
            type="button"
            className="chip-button !min-h-9 !px-2.5"
            onClick={() => onChange({ pitch: 0, formant: 0 })}
            disabled={voice.pitch === 0 && voice.formant === 0}
          >
            Reset
          </button>
        </div>
        {sliders}
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="panel-kicker">Voice Lab</p>
          <h2 className="panel-title">Pitch & timbre</h2>
          {voice.pitch === 0 && voice.formant === 0 ? (
            <p className="mt-1 text-xs text-[color:var(--accent-soft)]">Pitch/formant at 0 = no change. Drag pitch up/down.</p>
          ) : (
            <p className="mt-1 text-xs text-[color:var(--success)]">
              Live shift: pitch {voice.pitch > 0 ? '+' : ''}{voice.pitch} · formant {voice.formant > 0 ? '+' : ''}{voice.formant}
            </p>
          )}
        </div>
        <span className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          isRunning
            ? 'border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent-soft)]'
            : 'border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--muted)]'
        }`}
        >
          {isRunning ? 'Live' : 'Applies on start'}
        </span>
      </div>

      {sliders}

      <div className="mt-6 border-t border-[color:var(--line)] pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          F0 Method {hasModel ? '' : '· needs an RVC model'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {F0_METHODS.map((method) => {
            const selected = voice.f0Method === method.value;
            return (
              <button
                key={method.value}
                onClick={() => onChange({ f0Method: method.value })}
                className={`rounded-md border px-3 py-2.5 text-left transition ${
                  selected
                    ? 'border-[color:var(--ink-text)]/30 bg-white/[0.07] text-[color:var(--ink-text)]'
                    : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60 text-[color:var(--muted)] hover:border-[color:var(--ink-text)]/20 hover:text-[color:var(--ink-text)]'
                }`}
              >
                <p className="text-sm font-semibold leading-tight">{method.label}</p>
                <p className={`mt-0.5 text-[11px] ${selected ? 'text-[color:var(--muted)]' : 'text-[color:var(--muted)]'}`}>
                  {method.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-[color:var(--line)] pt-4">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] transition hover:text-[color:var(--ink-text)]"
        >
          RVC Advanced
          <svg
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <MiniSlider
              label="Index Rate"
              value={voice.indexRate}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => onChange({ indexRate: value })}
            />
            <MiniSlider
              label="RMS Mix"
              value={voice.rmsMixRate}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => onChange({ rmsMixRate: value })}
            />
            <MiniSlider
              label="Protect"
              value={voice.protect}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(value) => onChange({ protect: value })}
            />
            <p className="text-[11px] leading-4 text-[color:var(--muted)]">
              Index rate blends retrieval features, RMS mix follows input loudness,
              protect preserves breaths and consonants.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
