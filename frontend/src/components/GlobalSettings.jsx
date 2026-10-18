import React, { useMemo } from 'react';

const SAMPLE_RATE_OPTIONS = [32000, 40000, 44100, 48000];
const CHUNK_SIZE_OPTIONS = [1024, 2048, 4096, 8192];

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))].sort((a, b) => a - b);
}

function RuntimeBadge({ label, ready }) {
  return (
    <div className={`rounded-md border px-4 py-3 ${
      ready
        ? 'border-emerald-300/30 bg-emerald-400/[0.07] text-emerald-200'
        : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60 text-[color:var(--muted)]'
    }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">
        {ready ? 'Ready' : 'Unavailable'}
      </p>
    </div>
  );
}

function RuntimeItem({ label, value, detail }) {
  return (
    <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[color:var(--ink-text)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export default function GlobalSettings({ config, onChange, disabled, onClose }) {
  const sampleRateOptions = useMemo(
    () => uniqueSorted([config.sampleRate, ...SAMPLE_RATE_OPTIONS]),
    [config.sampleRate]
  );
  const chunkSizeOptions = useMemo(
    () => uniqueSorted([config.chunkSize, ...CHUNK_SIZE_OPTIONS]),
    [config.chunkSize]
  );
  const onnxSelectedProviders = config.runtime?.onnx?.selectedProviders || [];
  const onnxProviders = config.runtime?.onnx?.availableProviders || [];
  const onnxProvider = config.runtime?.onnx?.activeProvider || (config.runtime?.onnx?.available ? 'CPUExecutionProvider' : 'Nicht verfügbar');
  const torchDevice = config.runtime?.torch?.device || 'nicht verfügbar';
  const gpuName = config.runtime?.torch?.gpuName || (torchDevice === 'cpu' ? 'nur CPU' : 'Nicht erkannt');
  const cudaVersion = config.runtime?.torch?.cudaVersion || 'Nicht erkannt';
  const onnxGpuReady = Boolean(config.runtime?.onnx?.gpuEnabled);
  const torchGpuReady = Boolean(config.runtime?.torch?.cudaAvailable);

  return (
    <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[color:var(--muted)]">
            Globale Einstellungen
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[color:var(--ink-text)]">
            Sitzungs-Laufzeit
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
            Stream-Standards und Hardware-Laufzeitdetails an einem Ort.
          </p>
        </div>

        {onClose ? (
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--muted)] transition hover:border-[color:var(--ink-text)]/25 hover:bg-[color:var(--surface)] hover:text-[color:var(--ink-text)]"
            aria-label="Einstellungen schließen"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 p-5">
          <div className="flex flex-col gap-2 border-b border-[color:var(--line)] pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Stream-Standards
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              Gilt für die nächste Routing-Sitzung. Vor dem Ändern dieser Werte das Routing stoppen.
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Abtastrate
              </label>
              <select
                value={config.sampleRate}
                onChange={(event) => onChange?.({ sampleRate: Number(event.target.value) })}
                disabled={disabled}
                className="native-select-safe mt-3 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 px-4 py-3 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 focus:bg-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sampleRateOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString()} Hz
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Chunk-Größe
              </label>
              <select
                value={config.chunkSize}
                onChange={(event) => onChange?.({ chunkSize: Number(event.target.value) })}
                disabled={disabled}
                className="native-select-safe mt-3 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 px-4 py-3 text-sm text-[color:var(--ink-text)] outline-none transition focus:border-[color:var(--ink-text)]/30 focus:bg-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chunkSizeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString()} Samples
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {disabled
              ? 'Routing läuft. Stream stoppen, um die Standards zu ändern.'
              : 'Lokal gespeichert und vor dem nächsten Stream an den Server übertragen.'}
          </p>
        </div>

        <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface-2)]/60 p-5">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Hardware-Laufzeit
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Was das Backend aktuell von ONNX, PyTorch, GPU und CUDA erkennt.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RuntimeBadge label="ONNX Runtime" ready={config.runtime?.onnx?.available} />
              <RuntimeBadge label="PyTorch / RVC" ready={config.runtime?.torch?.available} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RuntimeItem
              label="ONNX-Provider"
              value={onnxProvider}
              detail={
                onnxSelectedProviders.length > 0
                  ? `Gewählt: ${onnxSelectedProviders.join(', ')}. Verfügbar: ${onnxProviders.join(', ')}`
                  : onnxProviders.length > 0
                    ? `Verfügbar: ${onnxProviders.join(', ')}`
                    : 'Keine Provider erkannt'
              }
            />
            <RuntimeItem
              label="PyTorch-Gerät"
              value={torchDevice}
              detail={torchGpuReady ? 'CUDA-Beschleunigung ist für PyTorch verfügbar.' : 'PyTorch läuft ohne CUDA-Beschleunigung.'}
            />
            <RuntimeItem
              label="GPU"
              value={gpuName}
              detail={onnxGpuReady ? 'ONNX Runtime kann CUDAExecutionProvider nutzen.' : 'ONNX Runtime läuft aktuell nur über den CPU-Provider.'}
            />
            <RuntimeItem
              label="CUDA"
              value={cudaVersion}
              detail={config.runtime?.torch?.cudaAvailable ? 'Gemeldet von torch.version.cuda.' : 'CUDA wurde von der aktuellen PyTorch-Laufzeit nicht gemeldet.'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
