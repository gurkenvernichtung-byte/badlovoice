import React, { useEffect, useRef } from 'react';

// Real-time canvas visualizer: input (dim) + output (accent) spectrum.
export default function Visualizer({ getAnalysers, isRunning, hero = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const idlePhaseRef = useRef(0);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const inputData = new Uint8Array(1024);
    const outputData = new Uint8Array(1024);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const { input, output } = getAnalysers?.() || {};
      const running = isRunningRef.current && (input || output);

      const barCount = Math.max(24, Math.min(96, Math.floor(width / 12)));
      const gap = 2;
      const barWidth = (width - gap * (barCount - 1)) / barCount;
      const usableBins = 0.72;

      if (running) {
        if (input) input.getByteFrequencyData(inputData.subarray(0, input.frequencyBinCount));
        if (output) output.getByteFrequencyData(outputData.subarray(0, output.frequencyBinCount));
        const binCount = (output || input).frequencyBinCount;

        for (let i = 0; i < barCount; i++) {
          const t = i / (barCount - 1);
          const bin = Math.min(
            binCount - 1,
            Math.floor(Math.pow(t, 1.6) * binCount * usableBins)
          );
          const x = i * (barWidth + gap);

          if (input) {
            const vIn = inputData[bin] / 255;
            const hIn = Math.max(1, vIn * height * 0.92);
            ctx.fillStyle = 'rgba(58, 111, 150, 0.28)';
            ctx.fillRect(x, height - hIn, barWidth, hIn);
          }

          if (output) {
            const vOut = outputData[bin] / 255;
            const hOut = Math.max(1, vOut * height * 0.92);
            ctx.fillStyle = 'rgba(224, 85, 40, 0.85)';
            ctx.fillRect(x, height - hOut, barWidth, hOut);
          }
        }
      } else {
        idlePhaseRef.current += 0.012;
        const phase = idlePhaseRef.current;
        for (let i = 0; i < barCount; i++) {
          const t = i / (barCount - 1);
          const wave =
            0.06 +
            0.04 * Math.sin(t * 7 + phase) * Math.sin(t * 3 - phase * 0.7) +
            0.02 * Math.sin(t * 13 - phase * 1.4);
          const h = Math.max(1, Math.abs(wave) * height);
          const x = i * (barWidth + gap);
          ctx.fillStyle = 'rgba(42, 35, 28, 0.08)';
          ctx.fillRect(x, height - h, barWidth, h);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [getAnalysers]);

  if (hero) {
    return (
      <canvas
        ref={canvasRef}
        className="h-full min-h-[160px] w-full rounded-xl bg-[color:var(--surface-2)]/35 sm:min-h-[200px]"
        aria-hidden="true"
      />
    );
  }

  return (
    <section className="panel relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="panel-kicker">Spectrum</p>
          <h2 className="panel-title">Live signal</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 bg-[color:var(--mic)]/60" />
            Input
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 bg-[color:var(--accent)]/80" />
            Output
          </span>
        </div>
      </div>
      <canvas ref={canvasRef} className="mt-4 h-44 w-full sm:h-52" />
      {!isRunning && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[38%] text-center text-xs font-medium text-[color:var(--muted)]">
          Start to see the live spectrum
        </p>
      )}
    </section>
  );
}
