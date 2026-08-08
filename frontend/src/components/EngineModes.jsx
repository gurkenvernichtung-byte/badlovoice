import React from 'react';

/**
 * Explains DSP vs RVC/ONNX model modules — the missing piece for "real" voice change.
 */
export default function EngineModes({ hasModel, torchOk, onnxOk }) {
  return (
    <section className="panel p-5">
      <p className="panel-kicker">How BadloVoice converts voice</p>
      <h2 className="panel-title">Two engines</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className={`rounded border p-4 ${hasModel ? 'border-white/10 bg-black/20' : 'border-[#6ee7b7]/35 bg-[#6ee7b7]/8'}`}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">A · DSP (now)</p>
          <h3 className="mt-1 font-display text-lg font-bold text-zinc-100">Pitch / formant morph</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>1. Pick Male / Female / Boy / Girl target</li>
            <li>2. Live pitch + formant shift toward that voice</li>
            <li>3. Or load an RVC module for a full timbre change</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Fast, no download. Sounds higher/lower — not a full different person. Good for age/gender tilt.
          </p>
        </div>

        <div className={`rounded border p-4 ${hasModel ? 'border-[#6ee7b7]/35 bg-[#6ee7b7]/8' : 'border-white/10 bg-black/20'}`}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">B · Model modules</p>
          <h3 className="mt-1 font-display text-lg font-bold text-zinc-100">RVC / ONNX voice models</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-400">
            <li>Upload a <code className="text-zinc-300">.pth</code> (RVC) or <code className="text-zinc-300">.onnx</code> file</li>
            <li>Optional matching <code className="text-zinc-300">.index</code></li>
            <li>HuBERT + PyTorch for RVC · onnxruntime for ONNX</li>
            <li>Converts your timbre into that trained voice</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Open <strong className="text-zinc-300">Models</strong> → Activate a{' '}
            <code className="text-zinc-300">.pth</code> (we have no ONNX files yet).
            On CPU, RVC is slow (seconds of delay) — that is normal; pitch engine stays instant.
          </p>
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            Runtime: torch {torchOk ? 'OK' : 'missing'} · onnx {onnxOk ? 'OK' : 'missing'}
            {hasModel ? ' · module loaded' : ' · no module active'}
          </p>
        </div>
      </div>
    </section>
  );
}
