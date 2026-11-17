import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { COLORS, clamp, rnd, rndi } from '../game/engine';

export interface StarfieldFxHandle {
  burst: (x: number, y: number, opts?: { n?: number; colors?: string[] }) => void;
  confetti: () => void;
}

interface Star {
  x: number;
  y: number;
  r: number;
  sp: number;
  tw: number;
  ts: number;
  c: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  ttl: number;
  size: number;
  c: string;
  rot: number;
  vr: number;
}

const STAR_COLORS = ['#a855f7', '#22d3ee', '#ff2ea6', '#f4eeff', '#f4eeff', '#4f7cff'];

export const StarfieldFx = forwardRef<StarfieldFxHandle>(function StarfieldFx(_, ref) {
  const starsRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<HTMLCanvasElement | null>(null);
  const partsRef = useRef<Particle[]>([]);
  const rmRef = useRef(false);

  useImperativeHandle(ref, () => ({
    burst(x: number, y: number, opts = {}) {
      const rm = rmRef.current;
      const n = rm ? Math.min(12, opts.n || 24) : opts.n || 24;
      const colors = opts.colors || [COLORS.violet, COLORS.cyan, COLORS.magenta, COLORS.lime];
      for (let i = 0; i < n; i++) {
        const a = rnd(6.28);
        const sp = rnd(120, 420);
        partsRef.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 90,
          g: 700,
          life: 0,
          ttl: rnd(0.6, 1.3),
          size: rnd(3, 8),
          c: colors[rndi(0, colors.length - 1)],
          rot: rnd(6.28),
          vr: rnd(-6, 6),
        });
      }
    },
    confetti() {
      const rm = rmRef.current;
      const n = rm ? 40 : 120;
      const colors = [
        COLORS.gold,
        COLORS.amber,
        COLORS.magenta,
        COLORS.cyan,
        COLORS.lime,
        COLORS.violet,
      ];
      for (let i = 0; i < n; i++) {
        partsRef.current.push({
          x: rnd(window.innerWidth),
          y: -20 - rnd(120),
          vx: rnd(-80, 80),
          vy: rnd(120, 340),
          g: 260,
          life: 0,
          ttl: rnd(2.2, 3.8),
          size: rnd(4, 10),
          c: colors[rndi(0, colors.length - 1)],
          rot: rnd(6.28),
          vr: rnd(-5, 5),
        });
      }
    },
  }));

  useEffect(() => {
    const starsCv = starsRef.current;
    const fxCv = fxRef.current;
    if (!starsCv || !fxCv) return;
    const sctx = starsCv.getContext('2d');
    const fctx = fxCv.getContext('2d');
    if (!sctx || !fctx) return;

    rmRef.current =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars: Star[] = [];
    let fxDirty = false;
    let rafId = 0;
    let last = performance.now();

    const fit = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      [starsCv, fxCv].forEach((cv) => {
        cv.width = window.innerWidth * d;
        cv.height = window.innerHeight * d;
        cv.style.width = `${window.innerWidth}px`;
        cv.style.height = `${window.innerHeight}px`;
        const ctx = cv.getContext('2d');
        if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
      });
      const n = rmRef.current
        ? 40
        : Math.min(120, Math.round((window.innerWidth * window.innerHeight) / 12000));
      stars = [];
      for (let i = 0; i < n; i++) {
        stars.push({
          x: rnd(window.innerWidth),
          y: rnd(window.innerHeight),
          r: rnd(0.4, 2),
          sp: rnd(2, 10),
          tw: rnd(6.28),
          ts: rnd(0.5, 2),
          c: STAR_COLORS[rndi(0, STAR_COLORS.length - 1)],
        });
      }
    };

    fit();
    window.addEventListener('resize', fit);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      sctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.sp * dt;
        if (s.y > window.innerHeight + 4) {
          s.y = -4;
          s.x = rnd(window.innerWidth);
        }
        sctx.globalAlpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin((now / 1000) * s.ts + s.tw));
        sctx.fillStyle = s.c;
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r, 0, 7);
        sctx.fill();
      }
      sctx.globalAlpha = 1;

      if (partsRef.current.length) {
        fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        fxDirty = true;
        partsRef.current = partsRef.current.filter((p) => {
          p.life += dt;
          if (p.life >= p.ttl) return false;
          p.vy += p.g * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          fctx.save();
          fctx.globalAlpha = clamp(1 - p.life / p.ttl, 0, 1);
          fctx.translate(p.x, p.y);
          fctx.rotate(p.rot);
          fctx.fillStyle = p.c;
          fctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
          fctx.restore();
          return true;
        });
      } else if (fxDirty) {
        fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        fxDirty = false;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <>
      <canvas id="stars" ref={starsRef} aria-hidden="true" />
      <div className="aurora" aria-hidden="true" />
      <canvas id="fx" ref={fxRef} aria-hidden="true" />
    </>
  );
});
