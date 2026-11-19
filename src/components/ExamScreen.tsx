import { useState } from 'react';
import {
  COLORS,
  GameState,
  factsSeen,
  fmtDate,
  fmtK,
  getAdaptiveCourse,
  masteredCount,
  overallMastery,
  weakList,
} from '../game/engine';

interface ExamScreenProps {
  state: GameState;
  onStartExam: (name: string) => void;
  onCertOpen: () => void;
  onFocusWeak: (keys: string[]) => void;
  onBackToHub: () => void;
}

export function ExamScreen({
  state,
  onStartExam,
  onCertOpen,
  onFocusWeak,
  onBackToHub,
}: ExamScreenProps) {
  const [nameInput, setNameInput] = useState(state.name || 'Ученик');
  const om = overallMastery(state);
  const mastered = masteredCount(state);
  const seen = factsSeen(state);
  const course = getAdaptiveCourse(state);
  const weak = weakList(state, 4);

  const readyColor = om >= 85 ? COLORS.lime : om >= 60 ? COLORS.amber : COLORS.magenta;
  const circ = 201.1;
  const dashOffset = (circ * (1 - om / 100)).toFixed(1);

  return (
    <section className="screen-anim" aria-label="Финальный тест">
      <div className="page-head">
        <button type="button" className="ghost-btn small" onClick={onBackToHub}>
          ← В штаб
        </button>
        <h2>🎓 Финальный тест</h2>
        <span className="exam-ready-badge" style={{ color: readyColor, borderColor: readyColor }}>
          Готовность {om}%
        </span>
      </div>

      <div className="exam-layout">
        <div className="card exam-hero">
          <div className="exam-top-row">
            <svg className="exam-big-ring" width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeWidth="7"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={readyColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 40 40)"
              />
              <text
                x="40"
                y="45"
                textAnchor="middle"
                fontSize="16"
                fontWeight="900"
                fill="#fff"
                fontFamily="Unbounded, sans-serif"
              >
                {om}%
              </text>
            </svg>

            <div>
              <h3>Проверка всей таблицы</h3>
              <p className="pet-desc" style={{ marginBottom: 0 }}>
                Итоговый экзамен без подсказок на скорость и точность по всем 36 семействам
                примеров.
              </p>
            </div>
          </div>

          <div className="exam-kpi-grid">
            <div className="exam-kpi">
              <b>{mastered}/36</b>
              <span>Мастеров (90%+)</span>
            </div>
            <div className="exam-kpi">
              <b>{seen}/36</b>
              <span>Изучено фактов</span>
            </div>
            <div className="exam-kpi">
              <b>{state.exam.best}/36</b>
              <span>Лучший счёт</span>
            </div>
          </div>

          <ul className="rules">
            <li>
              <span>
                <b>36 заданий</b> — вся таблица от 2×2 до 9×9, умножение и деление по очереди.
              </span>
            </li>
            <li>
              <span>
                <b>Без вариантов ответа</b> — удобная клавиатура с автоотправкой и увеличенный таймер.
              </span>
            </li>
            <li>
              <span>
                <b>36 из 36 без ошибок</b> — награждается именным сертификатом Академии 📜.
              </span>
            </li>
          </ul>

          <label className="seg-label" htmlFor="examScreenName" style={{ display: 'block' }}>
            Имя для сертификата
          </label>
          <input
            id="examScreenName"
            className="ov-input"
            type="text"
            maxLength={24}
            placeholder="Введи своё имя"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />

          <button
            type="button"
            className="primary-btn mag"
            data-tour="exam-start-btn"
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => onStartExam(nameInput.trim() || state.name)}
          >
            🚀 Начать финальный тест (36 заданий)
          </button>
        </div>

        <div className="exam-side">
          {state.cert && (
            <div className="card exam-cert-card">
              <h3>📜 Сертификат получен!</h3>
              <p className="pet-desc">
                Идеальный экзамен сдан {fmtDate(state.cert.date)} со средним временем{' '}
                <b>{state.cert.avg.toFixed(1)} с</b>.
              </p>
              <button
                type="button"
                className="primary-btn gold"
                style={{ width: '100%' }}
                onClick={onCertOpen}
              >
                Открыть сертификат
              </button>
            </div>
          )}

          <div className="card">
            <h3>🧠 Оценка готовности</h3>
            <p className="pet-desc">
              {om >= 85
                ? 'Усвоение на высоком уровне — отличные шансы сдать финальный тест на 36/36!'
                : course.weakCount > 0
                  ? `Сейчас в таблице ${course.weakCount} слабых мест. Советуем разогреться на них перед тестом.`
                  : 'Пройди пару уроков умного курса, чтобы познакомиться со всеми 36 примерами.'}
            </p>
            <div className="exam-weak-chips">
              {weak.map((w) => (
                <span key={w.k} className="exam-wchip">
                  <b>{fmtK(w.k)}</b> {w.m}%
                </span>
              ))}
            </div>
            <button
              type="button"
              className="ghost-btn"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => onFocusWeak(weak.map((w) => w.k))}
            >
              🔧 Повторить слабые перед тестом
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
