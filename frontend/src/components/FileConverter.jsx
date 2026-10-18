import React, { useRef, useState } from 'react';
import { convertFile } from '../lib/api';
import { countActiveEffects } from '../lib/effects';

const ACCEPTED = '.wav,.mp3,.flac,.ogg,.m4a,.aiff';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Offline conversion: renders an uploaded audio file through the active
// model + current studio settings on the server, returns a WAV.
export default function FileConverter({ voice, effects, activeModel }) {
  const [file, setFile] = useState(null);
  const [useModel, setUseModel] = useState(true);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null); // {url, name, size}
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const fxCount = countActiveEffects(effects, voice.formant);

  const pickFile = (candidate) => {
    if (!candidate) return;
    setFile(candidate);
    setError(null);
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const handleConvert = async () => {
    if (!file || converting) return;
    setConverting(true);
    setError(null);
    try {
      const blob = await convertFile(file, {
        pitchShift: voice.pitch,
        formantShift: voice.formant,
        f0Method: voice.f0Method,
        effects,
        useModel: useModel && Boolean(activeModel),
      });
      const name = `${file.name.replace(/\.[^.]+$/, '')}_converted.wav`;
      setResult((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), name, size: blob.size };
      });
    } catch (err) {
      setError(err.message || 'Konvertierung fehlgeschlagen');
    } finally {
      setConverting(false);
    }
  };

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-kicker">Dateikonverter</p>
          <h2 className="panel-title">Offline-Stimmkonvertierung</h2>
        </div>
        <span className="rounded border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
          Nutzt die aktuellen Studio-Einstellungen
        </span>
      </div>

      <p className="mt-2 text-sm text-[color:var(--muted)]">
        Eine ganze Audiodatei rendern über {activeModel ? 'das aktive Modell und ' : ''}die
        Effektkette — Tonhöhe {voice.pitch > 0 ? '+' : ''}{voice.pitch} st,
        Formant {voice.formant > 0 ? '+' : ''}{voice.formant} st, {fxCount} Effekt{fxCount === 1 ? '' : 'e'}.
      </p>

      <div
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          pickFile(event.dataTransfer.files?.[0]);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-5 cursor-pointer rounded-md border border-dashed p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-[color:var(--ink-text)]/35 bg-[color:var(--surface)] drag-active'
            : 'border-white/[0.12] bg-[color:var(--surface)] hover:border-[color:var(--ink-text)]/25 hover:bg-[color:var(--surface)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={(event) => {
            pickFile(event.target.files?.[0]);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="hidden"
        />
        <svg className="mx-auto mb-3 h-9 w-9 text-[color:var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        {file ? (
          <>
            <p className="text-sm font-medium text-[color:var(--ink-text)]">{file.name}</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">{formatSize(file.size)} · klicken, um eine andere Datei zu wählen</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-[color:var(--ink-text)]">
              {dragActive ? 'Audiodatei hier ablegen' : 'Audiodatei ablegen oder klicken zum Durchsuchen'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              wav · mp3 · flac · ogg · m4a
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <label className={`flex items-center gap-2.5 text-sm ${activeModel ? 'text-[color:var(--ink-text)]' : 'text-[color:var(--muted)]'}`}>
          <input
            type="checkbox"
            checked={useModel && Boolean(activeModel)}
            disabled={!activeModel}
            onChange={(event) => setUseModel(event.target.checked)}
            className="h-4 w-4 accent-zinc-300"
          />
          Über aktives Modell laufen lassen
          <span className="text-xs text-[color:var(--muted)]">
            {activeModel ? `(${activeModel})` : '(kein Modell aktiv — nur DSP)'}
          </span>
        </label>

        <button
          onClick={handleConvert}
          disabled={!file || converting}
          className="rounded-md bg-zinc-100 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[color:var(--surface)] disabled:text-[color:var(--muted)]"
        >
          {converting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Konvertiert…
            </span>
          ) : (
            'Konvertieren'
          )}
        </button>
      </div>

      {converting && (
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Lange Dateien brauchen etwas Zeit — die ganze Datei läuft serverseitig durch die Pipeline.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-[color:var(--danger)]/25 bg-[color:var(--danger)]/10 p-4">
          <p className="text-sm text-[color:var(--danger-soft)]">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-5 rounded-md border border-emerald-300/25 bg-emerald-400/[0.05] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-emerald-100">
              {result.name} <span className="text-xs text-emerald-200/60">({formatSize(result.size)})</span>
            </p>
            <a href={result.url} download={result.name} className="chip-button !normal-case">
              ↓ WAV herunterladen
            </a>
          </div>
          <audio controls src={result.url} className="mt-3 h-9 w-full" />
        </div>
      )}
    </section>
  );
}
