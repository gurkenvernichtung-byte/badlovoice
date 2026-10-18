import React from 'react';

/**
 * Erklärt DSP- vs. RVC/ONNX-Modellmodule — der fehlende Teil für eine „echte“ Stimmumwandlung.
 */
export default function EngineModes({ hasModel, torchOk, onnxOk }) {
  return (
    <section className="panel p-5">
      <p className="panel-kicker">So wandelt BadloVoice die Stimme um</p>
      <h2 className="panel-title">Zwei Engines</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={`rounded border p-4 ${hasModel ? 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60' : 'border-[#6ee7b7]/35 bg-[#6ee7b7]/8'}`}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">A · DSP (jetzt)</p>
          <h3 className="mt-1 font-display text-lg font-bold text-[color:var(--ink-text)]">Tonhöhe-/Formant-Morphing</h3>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
            <li>1. Ziel wählen: Männlich / Weiblich / Junge / Mädchen</li>
            <li>2. Live-Verschiebung von Tonhöhe und Formant zu dieser Stimme</li>
            <li>3. Oder ein RVC-Modul laden für einen vollen Klangwechsel</li>
          </ul>
          <p className="mt-3 text-xs text-[color:var(--muted)]">
            Schnell, kein Download. Klingt höher/tiefer — nicht wie eine komplett andere Person. Gut für Alters- und Geschlechtsverschiebung.
          </p>
        </div>

        <div className={`rounded border p-4 ${hasModel ? 'border-[#6ee7b7]/35 bg-[#6ee7b7]/8' : 'border-[color:var(--line)] bg-[color:var(--surface-2)]/60'}`}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">B · Modellmodule</p>
          <h3 className="mt-1 font-display text-lg font-bold text-[color:var(--ink-text)]">RVC-/ONNX-Stimmmodelle</h3>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
            <li>Lade eine <code className="text-[color:var(--ink-text)]">.pth</code>-Datei (RVC) oder <code className="text-[color:var(--ink-text)]">.onnx</code>-Datei</li>
            <li>Passende <code className="text-[color:var(--ink-text)]">.index</code>-Datei (optional)</li>
            <li>HuBERT + PyTorch für RVC · onnxruntime für ONNX</li>
            <li>Wandelt deinen Klang in diese trainierte Stimme um</li>
          </ul>
          <p className="mt-3 text-xs text-[color:var(--muted)]">
            Öffne <strong className="text-[color:var(--ink-text)]">Modelle</strong> → aktiviere eine{' '}
            <code className="text-[color:var(--ink-text)]">.pth</code> (wir haben noch keine ONNX-Dateien).
            Auf der CPU ist RVC langsam (Sekunden Verzögerung) — das ist normal; die Tonhöhen-Engine bleibt sofort.
          </p>
          <p className="mt-2 font-mono text-[10px] text-[color:var(--muted)]">
            Laufzeit: torch {torchOk ? 'OK' : 'fehlt'} · onnx {onnxOk ? 'OK' : 'fehlt'}
            {hasModel ? ' · Modul geladen' : ' · kein Modul aktiv'}
          </p>
        </div>
      </div>
    </section>
  );
}
