import { useEffect, useRef } from 'react';
import { PetMood, PetSkin, Question, SessionMode, clamp, getPetStage } from '../game/engine';
import { CaterpillarPet } from './CaterpillarPet';

export interface ActiveFeedback {
  ok: boolean;
  timeout: boolean;
  pickedIdx: number | null;
  text: string;
}

interface GameScreenProps {
  mode: SessionMode;
  index: number;
  count: number;
  combo: number;
  sessionXp: number;
  question: Question;
  feedback: ActiveFeedback | null;
  paused: boolean;
  modalOpen: boolean;
  petSkin: PetSkin;
  petFed: number;
  onAnswer: (idx: number | null, elapsed: number, tileRect?: DOMRect) => void;
  onPause: () => void;
  onQuit: () => void;
  onTickWarning: () => void;
  comboRef: React.RefObject<HTMLSpanElement | null>;
}

export function GameScreen({
  mode,
  index,
  count,
  combo,
  sessionXp,
  question,
  feedback,
  paused,
  modalOpen,
  petSkin,
  petFed,
  onAnswer,
  onPause,
  onQuit,
  onTickWarning,
  comboRef,
}: GameScreenProps) {
  const fillRef = useRef<HTMLElement | null>(null);
  const numRef = useRef<HTMLDivElement | null>(null);
  const tLeftRef = useRef<number>(question.limit);
  const lastTickRef = useRef<number>(99);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onAnswerRef = useRef(onAnswer);
  const onTickRef = useRef(onTickWarning);
  onAnswerRef.current = onAnswer;
  onTickRef.current = onTickWarning;

  useEffect(() => {
    tLeftRef.current = question.limit;
    lastTickRef.current = 99;
    if (fillRef.current) {
      fillRef.current.style.width = '100%';
      fillRef.current.className = '';
    }
    if (numRef.current) {
      numRef.current.textContent = question.limit.toFixed(1);
      numRef.current.classList.remove('danger');
    }
  }, [question]);

  useEffect(() => {
    if (feedback || paused || modalOpen) return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tLeftRef.current = Math.max(0, tLeftRef.current - dt);
      const r = tLeftRef.current / question.limit;

      if (fillRef.current) {
        fillRef.current.style.width = `${clamp(r, 0, 1) * 100}%`;
        fillRef.current.className = r < 0.25 ? 'danger' : r < 0.5 ? 'warn' : '';
      }
      if (numRef.current) {
        numRef.current.textContent = Math.max(0, tLeftRef.current).toFixed(1);
        numRef.current.classList.toggle('danger', r < 0.25);
      }

      const sec = Math.ceil(tLeftRef.current);
      if (sec <= 3 && sec >= 1 && sec !== lastTickRef.current) {
        lastTickRef.current = sec;
        onTickRef.current();
      }

      if (tLeftRef.current <= 0) {
        onAnswerRef.current(null, question.limit);
        return;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [question, feedback, paused, modalOpen]);

  const handleTileClick = (i: number) => {
    if (feedback || paused || modalOpen) return;
    const elapsed = clamp(question.limit - tLeftRef.current, 0, question.limit);
    const correctIdx = question.options.indexOf(question.ans);
    const rect = tileRefs.current[correctIdx]?.getBoundingClientRect();
    onAnswer(i, elapsed, rect);
  };

  const progressPct = ((feedback ? index + 1 : index) / count) * 100;
  const correctIdx = question.options.indexOf(question.ans);
  const petStage = getPetStage(petFed);

  const petMood: PetMood = paused
    ? 'sleepy'
    : feedback
      ? feedback.ok
        ? combo >= 3
          ? 'excited'
          : 'eating'
        : 'sad'
      : combo >= 3
        ? 'happy'
        : petFed === 0
          ? 'hungry'
          : 'idle';

  const petSpeech = paused
    ? 'Хр-р... жду!'
    : feedback
      ? feedback.ok
        ? combo >= 3
          ? 'Ого, комбо! ✨'
          : 'Хрум-хрум! 🍃'
        : 'Ничего, вперёд!'
      : null;

  return (
    <section className="screen-anim" aria-label="Тренировка">
      <div className="game-wrap">
        <div className="game-hud">
          <button type="button" className="hud-btn" onClick={onQuit} aria-label="Завершить">
            ✕
          </button>
          <div className="gprog">
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <span id="gCount">
            {index + 1} / {count}
          </span>
          {combo >= 2 && (
            <span className="combo" ref={comboRef}>
              🔥 ×{combo}
            </span>
          )}
          <button type="button" className="hud-btn" onClick={onPause} aria-label="Пауза">
            ⏸
          </button>
        </div>

        <div className="game-pet-bar" aria-label="Питомец в тренировке">
          <CaterpillarPet
            skin={petSkin}
            mood={petMood}
            segments={petStage.segments}
            compact
            speech={petSpeech}
          />
          <div className="pet-feed-pill">
            <span>{petSkin.icon}</span>
            <span>🍃 {petFed}</span>
          </div>
        </div>

        <div className="qcard" id="qcard">
          <div className="timerbar">
            <i id="tFill" ref={fillRef} />
          </div>
          <div className="tnum" id="tNum" ref={numRef}>
            {question.limit.toFixed(1)}
          </div>
          <div className={`qmode ${mode === 'exam' ? 'exam' : ''}`}>
            {question.mode === 'mul' ? 'УМНОЖЕНИЕ' : 'ДЕЛЕНИЕ'} · {question.tag}
          </div>
          <div className="equation" id="eq">
            {question.x} <span className="op">{question.sym}</span> {question.y}{' '}
            <span className="eqs">=</span>{' '}
            <span id="qmark" className={feedback ? (feedback.ok ? 'ok' : 'bad') : ''}>
              {feedback ? question.ans : '?'}
            </span>
          </div>

          <div className={`answers ${feedback ? 'locked' : ''}`} id="answers">
            {question.options.map((val, i) => {
              let cls = 'tile';
              if (feedback) {
                if (i === correctIdx) cls += ' correct';
                else if (i === feedback.pickedIdx) cls += ' wrong';
                else cls += ' dim';
              }
              return (
                <button
                  key={`${question.k}-${i}-${val}`}
                  ref={(el) => {
                    tileRefs.current[i] = el;
                  }}
                  type="button"
                  className={cls}
                  disabled={Boolean(feedback)}
                  onClick={() => handleTileClick(i)}
                >
                  <span className="key">{i + 1}</span>
                  {val}
                </button>
              );
            })}
          </div>

          <div className="feedback" id="fb" aria-live="polite">
            {feedback &&
              (feedback.ok ? (
                <span className="fb-ok">{feedback.text}</span>
              ) : (
                <span className="fb-bad">
                  {feedback.timeout ? 'Время вышло!' : 'Мимо!'} {question.x} {question.sym}{' '}
                  {question.y} = <b>{question.ans}</b>
                </span>
              ))}
          </div>
        </div>

        <div className="game-foot">
          Опыт сессии: <b id="gXp">+{sessionXp}</b>
        </div>
      </div>
    </section>
  );
}
