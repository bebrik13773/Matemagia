import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PetMood,
  PetSkin,
  Question,
  SessionMode,
  appendExamDigit,
  backspaceExamInput,
  clamp,
  evaluateTypedAnswer,
  getPetStage,
} from '../game/engine';
import { CaterpillarPet } from './CaterpillarPet';

export interface ActiveFeedback {
  ok: boolean;
  timeout: boolean;
  pickedIdx: number | null;
  pickedValue: number | null;
  text: string;
}

export interface AnswerSubmission {
  idx: number | null;
  value: number | null;
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
  onAnswer: (submission: AnswerSubmission | null, elapsed: number, tileRect?: DOMRect) => void;
  onPause: () => void;
  onQuit: () => void;
  onTickWarning: () => void;
  comboRef: React.RefObject<HTMLSpanElement | null>;
}

const KEYPAD_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
];

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
  const qmarkRef = useRef<HTMLSpanElement | null>(null);
  const tLeftRef = useRef<number>(question.limit);
  const lastTickRef = useRef<number>(99);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onAnswerRef = useRef(onAnswer);
  const onTickRef = useRef(onTickWarning);
  onAnswerRef.current = onAnswer;
  onTickRef.current = onTickWarning;

  const [typedInput, setTypedInput] = useState('');
  const typedInputRef = useRef('');
  typedInputRef.current = typedInput;

  const isExam = mode === 'exam';
  const expectedDigits = String(question.ans).length;

  useEffect(() => {
    tLeftRef.current = question.limit;
    lastTickRef.current = 99;
    setTypedInput('');
    typedInputRef.current = '';
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

  const submitTypedValue = useCallback(
    (rawInput: string) => {
      if (feedback || paused || modalOpen) return;
      const evaluated = evaluateTypedAnswer(rawInput, question.ans);
      if (evaluated.value === null) return;
      const elapsed = clamp(question.limit - tLeftRef.current, 0, question.limit);
      const rect = qmarkRef.current?.getBoundingClientRect();
      onAnswer({ idx: null, value: evaluated.value }, elapsed, rect);
    },
    [feedback, modalOpen, onAnswer, paused, question.ans, question.limit]
  );

  const handleDigitInput = useCallback(
    (digit: string) => {
      if (!isExam || feedback || paused || modalOpen) return;
      const res = appendExamDigit(typedInputRef.current, digit, expectedDigits);
      setTypedInput(res.nextInput);
      typedInputRef.current = res.nextInput;
      if (res.shouldAutoSubmit && res.numericValue !== null) {
        submitTypedValue(res.nextInput);
      }
    },
    [expectedDigits, feedback, isExam, modalOpen, paused, submitTypedValue]
  );

  const handleBackspace = useCallback(() => {
    if (!isExam || feedback || paused || modalOpen) return;
    const next = backspaceExamInput(typedInputRef.current);
    setTypedInput(next);
    typedInputRef.current = next;
  }, [feedback, isExam, modalOpen, paused]);

  useEffect(() => {
    if (feedback || paused || modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isExam) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          handleDigitInput(e.key);
          return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          handleBackspace();
          return;
        }
        if (e.key === 'Enter' && typedInputRef.current.length > 0) {
          e.preventDefault();
          submitTypedValue(typedInputRef.current);
        }
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        if (idx >= question.options.length) return;
        e.preventDefault();
        const elapsed = clamp(question.limit - tLeftRef.current, 0.05, question.limit);
        const correctIdx = question.options.indexOf(question.ans);
        const rect = tileRefs.current[correctIdx]?.getBoundingClientRect();
        onAnswerRef.current({ idx, value: question.options[idx] ?? null }, elapsed, rect);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    feedback,
    handleBackspace,
    handleDigitInput,
    isExam,
    modalOpen,
    paused,
    question.ans,
    question.limit,
    question.options,
    submitTypedValue,
  ]);

  const handleTileClick = (i: number) => {
    if (feedback || paused || modalOpen) return;
    const elapsed = clamp(question.limit - tLeftRef.current, 0, question.limit);
    const correctIdx = question.options.indexOf(question.ans);
    const rect = tileRefs.current[correctIdx]?.getBoundingClientRect();
    onAnswer({ idx: i, value: question.options[i] }, elapsed, rect);
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
    <section className="screen-anim" aria-label={isExam ? 'Финальный тест' : 'Тренировка'}>
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
          <div className={`qmode ${isExam ? 'exam' : ''}`}>
            {question.mode === 'mul' ? 'УМНОЖЕНИЕ' : 'ДЕЛЕНИЕ'} · {question.tag}
          </div>
          <div className="equation" id="eq">
            {question.x} <span className="op">{question.sym}</span> {question.y}{' '}
            <span className="eqs">=</span>{' '}
            <span
              id="qmark"
              ref={qmarkRef}
              className={
                feedback
                  ? feedback.ok
                    ? 'ok'
                    : 'bad'
                  : isExam
                    ? typedInput
                      ? 'typing'
                      : 'awaiting'
                    : ''
              }
            >
              {feedback ? question.ans : isExam ? typedInput || '?' : '?'}
            </span>
          </div>

          {isExam ? (
            <div className="exam-keypad-wrap">
              <div
                className={`exam-keypad ${feedback ? 'locked' : ''}`}
                role="group"
                aria-label="Цифровая клавиатура ответа"
              >
                {KEYPAD_ROWS.flat().map((keyLabel) => {
                  if (keyLabel === '⌫') {
                    return (
                      <button
                        key="backspace"
                        type="button"
                        className="keypad-btn action"
                        aria-label="Удалить цифру"
                        disabled={Boolean(feedback) || typedInput.length === 0}
                        onClick={handleBackspace}
                      >
                        ⌫
                      </button>
                    );
                  }
                  if (keyLabel === '✓') {
                    return (
                      <button
                        key="submit"
                        type="button"
                        className="keypad-btn confirm"
                        aria-label="Ответить"
                        disabled={Boolean(feedback) || typedInput.length === 0}
                        onClick={() => submitTypedValue(typedInput)}
                      >
                        ✓
                      </button>
                    );
                  }
                  return (
                    <button
                      key={keyLabel}
                      type="button"
                      className="keypad-btn"
                      aria-label={`Цифра ${keyLabel}`}
                      disabled={Boolean(feedback)}
                      onClick={() => handleDigitInput(keyLabel)}
                    >
                      {keyLabel}
                    </button>
                  );
                })}
              </div>
              <div className="exam-input-hint">
                Набери ответ на экране или клавиатуре — отправится автоматически
              </div>
            </div>
          ) : (
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
                    key={`${index}-${question.k}-${i}-${val}`}
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
          )}

          <div className="feedback" id="fb" aria-live="polite">
            {feedback &&
              (feedback.ok ? (
                <span className="fb-ok">{feedback.text}</span>
              ) : (
                <span className="fb-bad">
                  {feedback.timeout ? 'Время вышло!' : 'Мимо!'}{' '}
                  {isExam && !feedback.timeout && feedback.pickedValue !== null
                    ? `Введено ${feedback.pickedValue}. `
                    : ''}
                  {question.x} {question.sym} {question.y} = <b>{question.ans}</b>
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
