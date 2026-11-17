let AC: AudioContext | null = null;
let master: GainNode | null = null;
let soundEnabled = true;
let ambientEnabled = true;

interface AmbientNodes {
  gain: GainNode;
  filter: BiquadFilterNode;
  oscillators: OscillatorNode[];
  lfo: OscillatorNode;
  chimeTimer: number;
}

let ambientNodes: AmbientNodes | null = null;

const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (master) {
    master.gain.value = enabled ? 0.5 : 0;
  }
  syncAmbientState();
}

export function setAmbientEnabled(enabled: boolean): void {
  ambientEnabled = enabled;
  syncAmbientState();
}

export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!AC) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        AC = new Ctx();
        master = AC.createGain();
        master.gain.value = soundEnabled ? 0.5 : 0;
        master.connect(AC.destination);
      }
    } catch {
      // Ignore audio init errors
    }
  }
  if (AC && AC.state === 'suspended') {
    AC.resume()
      .then(() => syncAmbientState())
      .catch(() => {});
  } else {
    syncAmbientState();
  }
  return AC;
}

function playAmbientChime(): void {
  if (!AC || !ambientNodes || !soundEnabled || !ambientEnabled || AC.state !== 'running') return;
  try {
    const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
    const t = AC.currentTime + 0.05;
    const osc = AC.createOscillator();
    const g = AC.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    osc.connect(g);
    g.connect(ambientNodes.filter);
    osc.start(t);
    osc.stop(t + 2.7);
  } catch {
    // Ignore chime error
  }
}

function startAmbient(): void {
  const ctx = AC;
  if (!ctx || !master || ambientNodes || typeof window === 'undefined') return;
  try {
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, t);
    filter.Q.setValueAtTime(0.7, t);

    // Warm Cmaj9 cosmic pad (C3, G3, E4, D4)
    const freqs = [130.81, 196.0, 293.66, 329.63];
    const oscillators: OscillatorNode[] = freqs.map((f, idx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t);
      osc.detune.setValueAtTime((idx - 1.5) * 4, t);
      voiceGain.gain.setValueAtTime(idx < 2 ? 0.22 : 0.11, t);
      osc.connect(voiceGain);
      voiceGain.connect(filter);
      osc.start(t);
      return osc;
    });

    // Gentle LFO breathing on low-pass filter
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.11, t);
    lfoGain.gain.setValueAtTime(220, t);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);

    filter.connect(gain);
    gain.connect(master);

    const chimeTimer = window.setInterval(() => {
      if (Math.random() < 0.72) {
        playAmbientChime();
      }
    }, 3400);

    ambientNodes = { gain, filter, oscillators, lfo, chimeTimer };
  } catch {
    // Ignore ambient start errors
  }
}

function stopAmbient(): void {
  if (!ambientNodes) return;
  const nodes = ambientNodes;
  ambientNodes = null;
  if (typeof window !== 'undefined') {
    window.clearInterval(nodes.chimeTimer);
  }
  try {
    if (AC) {
      const t = AC.currentTime;
      nodes.gain.gain.cancelScheduledValues(t);
      nodes.gain.gain.setValueAtTime(Math.max(0.0001, nodes.gain.gain.value), t);
      nodes.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      window.setTimeout(() => {
        nodes.oscillators.forEach((o) => {
          try {
            o.stop();
          } catch {
            // ignore
          }
        });
        try {
          nodes.lfo.stop();
        } catch {
          // ignore
        }
        nodes.gain.disconnect();
      }, 400);
    }
  } catch {
    // Ignore ambient stop errors
  }
}

export function syncAmbientState(): void {
  if (soundEnabled && ambientEnabled && AC && AC.state === 'running') {
    if (!ambientNodes) startAmbient();
  } else if (ambientNodes) {
    stopAmbient();
  }
}

function tone(
  f: number,
  t0: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.4,
  slide = 0
): void {
  if (!AC || !master || !soundEnabled) return;
  try {
    const o = AC.createOscillator();
    const g = AC.createGain();
    const t = AC.currentTime + t0;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {
    // Ignore audio playback errors
  }
}

export const sfx = {
  click(): void {
    ensureAudio();
    tone(520, 0, 0.07, 'triangle', 0.22);
  },
  ok(c: number): void {
    ensureAudio();
    const b = 440 * Math.pow(2, Math.min(c, 12) / 12);
    tone(b, 0, 0.12, 'triangle', 0.38);
    tone(b * 1.5, 0.07, 0.16, 'triangle', 0.32);
  },
  munch(): void {
    ensureAudio();
    tone(360, 0.06, 0.06, 'triangle', 0.2, 140);
    tone(480, 0.14, 0.07, 'triangle', 0.22, 180);
  },
  petGiggle(): void {
    ensureAudio();
    tone(587, 0, 0.08, 'sine', 0.24, 90);
    tone(740, 0.08, 0.09, 'sine', 0.24, 120);
    tone(880, 0.17, 0.14, 'triangle', 0.22);
  },
  bad(): void {
    ensureAudio();
    tone(180, 0, 0.25, 'sawtooth', 0.2, -60);
    tone(120, 0.05, 0.3, 'sine', 0.22, -40);
  },
  tick(): void {
    ensureAudio();
    tone(880, 0, 0.05, 'square', 0.1);
  },
  timeout(): void {
    ensureAudio();
    tone(300, 0, 0.4, 'sawtooth', 0.22, -220);
  },
  level(): void {
    ensureAudio();
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(f, i * 0.09, 0.22, 'triangle', 0.38);
    });
  },
  ach(): void {
    ensureAudio();
    tone(784, 0, 0.1, 'sine', 0.32);
    tone(1175, 0.08, 0.18, 'sine', 0.32);
  },
  combo(): void {
    ensureAudio();
    tone(1319, 0, 0.12, 'sine', 0.28);
  },
  fanfare(): void {
    ensureAudio();
    [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => {
      tone(f, i * 0.12, 0.3, 'triangle', 0.38);
    });
    [262, 330, 392].forEach((f, i) => {
      tone(f, i * 0.12, 0.5, 'sine', 0.18);
    });
  },
};
