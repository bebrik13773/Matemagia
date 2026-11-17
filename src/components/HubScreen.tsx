import { useRef } from 'react';
import {
  Difficulty,
  GameState,
  displayStreak,
  fmtDate,
  fmtK,
  getAdaptiveCourse,
  getStreakBonus,
  levelInfo,
  limitPreview,
  overallMastery,
  rankFor,
  weakList,
} from '../game/engine';
import { EXPORT_FILE_EXTENSION } from '../game/storageTransfer';

interface HubScreenProps {
  state: GameState;
  onStartCourse: (focusPool: string[]) => void;
  onTrain: () => void;
  onCertOpen: () => void;
  onDiffChange: (diff: Difficulty) => void;
  onFocusWeak: (keys: string[]) => void;
  onEditName: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onReset: () => void;
}

export function HubScreen({
  state,
  onStartCourse,
  onTrain,
  onCertOpen,
  onDiffChange,
  onFocusWeak,
  onEditName,
  onExport,
  onImportFile,
  onReset,
}: HubScreenProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const li = levelInfo(state.xp);
  const rk = rankFor(li.l);
  const om = overallMastery(state);
  const weak = weakList(state, 5);
  const lim = limitPreview(state);
  const tempo = state.totals.ema ? `${state.totals.ema.toFixed(1)} с` : '—';
  const st = displayStreak(state);
  const streakBonus = getStreakBonus(state);
  const course = getAdaptiveCourse(state);

  const diffOptions: Array<{ id: Difficulty; label: string }> = [
    { id: 'calm', label: 'Спокойный' },
    { id: 'normal', label: 'Обычный' },
    { id: 'strict', label: 'Строгий' },
  ];

  const streakDays = [1, 2, 3, 4, 5, 6, 7];
  const streakSub =
    streakBonus.streak === 0
      ? 'Занимайся каждый день, чтобы открыть бонус +10%…+50% XP'
      : !streakBonus.practicedToday
        ? `С возвращением! Ответь сегодня, чтобы продлить серию до ${streakBonus.streak + 1} дн.${
            streakBonus.streak === 1 ? ' и открыть +10% XP' : ''
          }`
        : streakBonus.nextTierDays !== null
          ? `Активен бонус за регулярность · до +${streakBonus.nextTierPercent}% XP: ещё ${
              streakBonus.nextTierDays - streakBonus.streak
            } дн.`
          : 'Максимальный бонус за 7+ дней подряд активен!';

  return (
    <section className="screen-anim" aria-label="Штаб">
      <div className="hub">
        <div className="card hero">
          <h1>Привет, {state.name}! 👋</h1>
          <span className="rank-pill">
            {rk.emoji} {rk.name} · Уровень {li.l}
          </span>
          <div className="xp-wrap">
            <div className="xp-label">
              <span>Опыт</span>
              <b>
                {li.into} / {li.need} XP до Ур. {li.l + 1}
              </b>
            </div>
            <div className="bar gold" style={{ height: 13 }}>
              <i style={{ width: `${Math.round((li.into / li.need) * 100)}%` }} />
            </div>
          </div>
          <div className="chips">
            <span className="chip c-lime">
              🧠 Усвоение<b>{om}%</b>
            </span>
            <span className="chip c-cyan">
              ⏱ Твой темп<b>{tempo}</b>
            </span>
            <span className="chip c-amber">
              ⏳ Лимит<b>≈{lim.toFixed(1)} с</b>
            </span>
            <span className="chip c-mag">
              📅 Серия<b>{st} дн</b>
            </span>
          </div>

          <div
            className={`streak-bonus ${streakBonus.bonusPercent > 0 ? 'is-active' : ''} ${
              streakBonus.streak >= 1 && !streakBonus.practicedToday ? 'is-pending' : ''
            }`}
            aria-label="Ежедневный бонус серии"
          >
            <div className="sb-top">
              <span className="sb-ico" aria-hidden="true">
                {streakBonus.badgeEmoji}
              </span>
              <div className="sb-info">
                <div className="sb-title">
                  {streakBonus.badgeTitle}
                  {streakBonus.streak > 0 && <span className="sb-days"> · {streakBonus.streak} дн.</span>}
                </div>
                <div className="sb-sub">{streakSub}</div>
              </div>
              <div className="sb-mult">
                {streakBonus.bonusPercent > 0 ? `×${streakBonus.multiplier} XP` : '+0% XP'}
              </div>
            </div>
            <div className="sb-pips" aria-label={`Прогресс 7-дневной серии: ${Math.min(streakBonus.streak, 7)} из 7`}>
              {streakDays.map((day) => {
                const done = streakBonus.streak >= day;
                const nextToday = !streakBonus.practicedToday && day === streakBonus.streak + 1;
                return (
                  <span
                    key={day}
                    className={`sb-pip ${done ? 'done' : ''} ${nextToday ? 'next' : ''}`}
                    title={`День ${day}`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="seg-label">Строгость таймера</div>
          <div className="seg" role="group" aria-label="Строгость таймера">
            {diffOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`seg-btn ${state.diff === opt.id ? 'active' : ''}`}
                aria-pressed={state.diff === opt.id}
                onClick={() => onDiffChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="hint">
            Алгоритм учитывает время, разброс скорости и ошибки по каждому примеру и подстраивает
            таймер отдельно для умножения и деления.
          </p>
        </div>

        <div className="actions">
          <div className="card course-card" aria-label="Автоматический курс обучения">
            <div className="course-top">
              <span className="course-stage">{course.stageTitle}</span>
              <span className="course-pct">{course.stageProgressPct}%</span>
            </div>
            <div className="bar" style={{ marginBottom: 12 }}>
              <i style={{ width: `${course.stageProgressPct}%` }} />
            </div>
            <div className="course-title">🧠 {course.lessonTitle}</div>
            <p className="course-reason">{course.lessonReason}</p>
            <div className="course-metrics">
              {course.weakCount > 0 && <span>⚠️ Слабых: {course.weakCount}</span>}
              {course.hesitantCount > 0 && <span>⏱ Нестабильных: {course.hesitantCount}</span>}
              {course.dueCount > 0 && <span>🔁 Повтор: {course.dueCount}</span>}
              {course.divLagPct >= 15 && <span>➗ Деление +{course.divLagPct}%</span>}
            </div>
            <div className="course-focus">
              Подборка: {course.focusPool.slice(0, 4).map(fmtK).join(' · ')}
            </div>
          </div>

          <button
            type="button"
            className="big-btn train"
            onClick={() => onStartCourse(course.focusPool)}
          >
            <span className="bb-ico">⚡</span>
            <span>
              <span className="bb-t">Урок курса</span>
              <span className="bb-s">12 заданий · автоподбор по твоим ответам</span>
            </span>
          </button>

          <button type="button" className="ghost-btn free-train-btn" onClick={onTrain}>
            🎲 Свободная тренировка (вся таблица)
          </button>

          {state.cert && (
            <button type="button" className="big-btn cert-btn" onClick={onCertOpen}>
              <span className="bb-ico">📜</span>
              <span>
                <span className="bb-t">Мой сертификат</span>
                <span className="bb-s">получен {fmtDate(state.cert.date)}</span>
              </span>
            </button>
          )}
        </div>

        <div className="card weak-card">
          <h3>🎯 Слабые места</h3>
          {weak.map((w) => {
            const tag = !w.st || !w.st.n ? 'новое' : w.st.lastWrong ? 'была ошибка' : 'слабое';
            return (
              <div key={w.k} className="weak-row">
                <span className="wk">
                  {fmtK(w.k)}
                  <span className="wt">{tag}</span>
                </span>
                <span className="bar heat">
                  <i style={{ width: `${w.m}%` }} />
                </span>
                <span className="wp">{w.m}%</span>
              </div>
            );
          })}
          <button
            type="button"
            className="primary-btn"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => onFocusWeak(weak.map((w) => w.k))}
          >
            Прокачать слабые места
          </button>
        </div>

        <div className="card profile-card">
          <div>
            <div className="prof-row">
              <span className="prof-name">👤 {state.name}</span>
              <button type="button" className="ghost-btn small" onClick={onEditName}>
                ✏️ Имя
              </button>
            </div>
            <p className="totals-line">
              Ответов: <b>{state.totals.ans}</b> · верных: <b>{state.totals.ok}</b>
              <br />
              Лучшая серия: <b>×{state.totals.bestCombo}</b> · занятий:{' '}
              <b>{state.totals.sessions}</b>
              <br />
              Экзамен: лучший результат <b>{state.exam.best}/36</b>
            </p>
            <p className="hint" style={{ marginBottom: 14 }}>
              💾 Прогресс сохраняется автоматически. Питомец, карта, финальный тест и награды — во
              вкладках ниже.
            </p>
          </div>
          <div className="prof-actions">
            <button type="button" className="ghost-btn small" onClick={onExport}>
              📥 Экспорт
            </button>
            <button
              type="button"
              className="ghost-btn small"
              onClick={() => importInputRef.current?.click()}
            >
              📤 Импорт
            </button>
            <button type="button" className="ghost-btn small danger-btn" onClick={onReset}>
              Сбросить прогресс
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept={EXPORT_FILE_EXTENSION}
              tabIndex={-1}
              aria-hidden="true"
              className="is-hidden-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) {
                  onImportFile(file);
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
