import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PetSkin } from '../game/engine';
import { RectBox, TourStep, computeTourCardPlacement } from '../game/tour';
import { CaterpillarPet } from './CaterpillarPet';

interface OnboardingTourProps {
  open: boolean;
  stepIndex: number;
  steps: TourStep[];
  petSkin: PetSkin;
  petSegments: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

export function OnboardingTour({
  open,
  stepIndex,
  steps,
  petSkin,
  petSegments,
  onNext,
  onPrev,
  onFinish,
}: OnboardingTourProps) {
  const step = steps[stepIndex];
  const [targetRect, setTargetRect] = useState<RectBox | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1440, h: 900 }
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);

  const measureTarget = useCallback(() => {
    if (!open || !step || typeof window === 'undefined') {
      setTargetRect(null);
      return;
    }
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setTargetRect(null);
      return;
    }
    const pad = 6;
    const top = Math.max(4, r.top - pad);
    const left = Math.max(4, r.left - pad);
    const right = Math.min(window.innerWidth - 4, r.right + pad);
    const bottom = Math.min(window.innerHeight - 4, r.bottom + pad);
    setTargetRect({
      top,
      left,
      width: Math.max(24, right - left),
      height: Math.max(24, bottom - top),
      right,
      bottom,
    });
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('tour-active');
    return () => {
      document.body.classList.remove('tour-active');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (cardRef.current && (!active || !cardRef.current.contains(active))) {
      primaryBtnRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !step) {
      setTargetRect(null);
      return;
    }

    const scrollTargetIntoView = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) return;
      const style = window.getComputedStyle(el);
      if (style.position !== 'fixed' && !el.closest('#topbar') && !el.closest('#bottomnav')) {
        const r = el.getBoundingClientRect();
        const inComfortBand = r.top >= 74 && r.bottom <= window.innerHeight - 92;
        if (!inComfortBand) {
          const desiredTop =
            r.height < window.innerHeight * 0.45
              ? Math.max(78, Math.round((window.innerHeight - r.height) * 0.38))
              : 78;
          const nextScrollY = Math.max(0, Math.round(window.scrollY + (r.top - desiredTop)));
          window.scrollTo({ top: nextScrollY, behavior: 'auto' });
        }
      }
    };

    scrollTargetIntoView();
    measureTarget();

    let rafId = 0;
    rafId = window.requestAnimationFrame(measureTarget);
    const t1 = window.setTimeout(measureTarget, 140);
    const t2 = window.setTimeout(measureTarget, 360);

    const el = document.querySelector<HTMLElement>(step.selector);
    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measureTarget);
      ro.observe(el);
    }

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget, open, step]);

  useEffect(() => {
    if (!open) return;
    const isLast = stepIndex >= steps.length - 1;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFinish();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) onFinish();
        else onNext();
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onFinish, onNext, onPrev, open, stepIndex, steps.length]);

  if (!open || !step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= steps.length - 1;
  const placement = computeTourCardPlacement(targetRect, viewport.w, viewport.h);
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  return (
    <div className="tour-layer" role="presentation">
      <div className="tour-click-shield" aria-hidden="true" />

      {targetRect ? (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      ) : (
        <div className="tour-dim-fallback" aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Обучение: ${step.title}`}
        style={{
          top: placement.top !== undefined ? `${placement.top}px` : undefined,
          bottom: placement.bottom !== undefined ? `${placement.bottom}px` : undefined,
          left: `${placement.left}px`,
          width: `${placement.width}px`,
        }}
      >
        <div className="tour-head">
          <span className="tour-step-counter">
            Шаг {stepIndex + 1} из {steps.length} · {step.actionHint}
          </span>
          <button
            type="button"
            className="tour-skip-link"
            onClick={onFinish}
            aria-label="Пропустить обучение"
          >
            Пропустить ✕
          </button>
        </div>

        <div className="bar tour-prog-bar" aria-hidden="true">
          <i style={{ width: `${progressPct}%` }} />
        </div>

        <div className="tour-body">
          <div className="tour-pet-box" aria-hidden="true">
            <CaterpillarPet
              skin={petSkin}
              mood={step.mood}
              segments={petSegments}
              compact
            />
          </div>

          <div className="tour-copy">
            <h2 className="tour-title">{step.title}</h2>
            <p className="tour-text">{step.text}</p>
          </div>
        </div>

        <div className="tour-actions">
          <button
            type="button"
            className="ghost-btn small"
            disabled={isFirst}
            onClick={onPrev}
          >
            ← Назад
          </button>
          <button
            ref={primaryBtnRef}
            type="button"
            className={`primary-btn ${isLast ? 'gold' : ''}`}
            onClick={isLast ? onFinish : onNext}
          >
            {isLast ? 'Начать учиться! 🚀' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  );
}
