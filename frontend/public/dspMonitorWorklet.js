/**
 * Local wet monitor — pitch + ring-mod so you hear a change even if
 * server round-trip is quiet or delayed.
 */
class DspMonitorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pitch = 7;
    this.robot = 0.7;
    this.robotFreq = 90;
    this.enabled = true;
    this.win = 1536;
    this.hist = new Float32Array(this.win + 2);
    this.phase = 0;
    this.robotPhase = 0;
    this.port.onmessage = (event) => {
      const msg = event.data || {};
      if (typeof msg.pitch === 'number') this.pitch = msg.pitch;
      if (typeof msg.robot === 'number') this.robot = msg.robot;
      if (typeof msg.robotFreq === 'number') this.robotFreq = msg.robotFreq;
      if (typeof msg.enabled === 'boolean') this.enabled = msg.enabled;
    };
  }

  _pitchShift(input) {
    const n = input.length;
    const out = new Float32Array(n);
    if (Math.abs(this.pitch) < 0.05) {
      this._push(input);
      out.set(input);
      return out;
    }
    const ratio = Math.pow(2, this.pitch / 12);
    const rate = 1 - ratio;
    const win = this.win;
    const full = new Float32Array(this.hist.length + n);
    full.set(this.hist);
    full.set(input, this.hist.length);
    for (let i = 0; i < n; i++) {
      let d1 = (this.phase + rate * i) % win;
      if (d1 < 0) d1 += win;
      const d2 = (d1 + win / 2) % win;
      const g1 = Math.sin((Math.PI * d1) / win);
      const g2 = Math.sin((Math.PI * d2) / win);
      const writePos = this.hist.length + i;
      const i1 = writePos - d1;
      const i2 = writePos - d2;
      const t1 = this._at(full, i1);
      const t2 = this._at(full, i2);
      out[i] = g1 * t1 + g2 * t2;
    }
    this.phase = (this.phase + rate * n) % win;
    if (this.phase < 0) this.phase += win;
    this.hist = full.slice(full.length - (win + 2));
    return out;
  }

  _at(buf, pos) {
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const a = buf[Math.max(0, Math.min(buf.length - 1, i0))] || 0;
    const b = buf[Math.max(0, Math.min(buf.length - 1, i0 + 1))] || 0;
    return a + (b - a) * frac;
  }

  _push(input) {
    const full = new Float32Array(this.hist.length + input.length);
    full.set(this.hist);
    full.set(input, this.hist.length);
    this.hist = full.slice(full.length - (this.win + 2));
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input || !output) return true;

    if (!this.enabled) {
      output.set(input);
      return true;
    }

    const pitched = this._pitchShift(input);
    const twoPi = 2 * Math.PI;
    const freq = Math.max(10, this.robotFreq);
    const wet = Math.min(1, Math.max(0, this.robot));
    for (let i = 0; i < pitched.length; i++) {
      const carrier = Math.sin(this.robotPhase);
      this.robotPhase += (twoPi * freq) / sampleRate;
      if (this.robotPhase > twoPi) this.robotPhase -= twoPi;
      const mixed = pitched[i] * (1 - wet) + pitched[i] * carrier * wet * 1.15;
      // Mild makeup — heavy gain was hard-clipping speech into mush.
      const y = mixed * 1.15;
      // Soft limit so consonants stay clear when you talk loud
      output[i] = y > 0.95 ? 0.95 + 0.05 * Math.tanh((y - 0.95) * 4) : y < -0.95 ? -0.95 - 0.05 * Math.tanh((-y - 0.95) * 4) : y;
    }
    for (let ch = 1; ch < outputs[0].length; ch++) {
      outputs[0][ch].set(output);
    }
    return true;
  }
}

registerProcessor('dsp-monitor-processor', DspMonitorProcessor);
