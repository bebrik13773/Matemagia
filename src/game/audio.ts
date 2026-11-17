let AC: AudioContext | null = null;
let master: GainNode | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (master) {
    master.gain.value = enabled ? 0.5 : 0;
  }
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
    AC.resume().catch(() => {});
  }
  return AC;
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
