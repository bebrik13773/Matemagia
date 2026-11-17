import {
  ACH,
  COLORS,
  Difficulty,
  GameState,
  colorClass,
  displayStreak,
  factsSeen,
  fmtDate,
  fmtK,
  getStreakBonus,
  levelInfo,
  limitPreview,
  masteredCount,
  overallMastery,
  rankFor,
  weakList,
} from '../game/engine';

interface HubScreenProps {
  state: GameState;
  onTrain: () => void;
  onExam: () => void;
  onCertOpen: () => void;
  onDiffChange: (diff: Difficulty) => void;
  onFocusWeak: (keys: string[]) => void;
  onOpenMap: () => void;
  onOpenAch: () => void;
  onEditName: () => void;
  onReset: () => void;
}

export function HubScreen({
  state,
  onTrain,
  onExam,
  onCertOpen,
  onDiffChange,
  onFocusWeak,
  onOpenMap,
  onOpenAch,
  onEditName,
  onReset,
}: HubScreenProps) {
  const li = levelInfo(state.xp);
  const rk = rankFor(li.l);
  const om = overallMastery(state);
  const weak = weakList(state, 5);
  const lim = limitPreview(state);
  const tempo = state.totals.ema ? `${state.totals.ema.toFixed(1)} с` : '—';
  const st = displayStreak(state);
  const streakBonus = getStreakBonus(state);
  const seenWeak = weak.filter((w) => w.st && w.st.n > 0);
  const trainSub = seenWeak.length
    ? `Слабые: ${seenWeak
        .slice(0, 2)
        .map((w) => fmtK(w.k))
        .join(', ')}`
    : '12 заданий · умный подбор';
  const readyC = om >= 85 ? COLORS.lime : om >= 60 ? COLORS.amber : COLORS.magenta;
  const circ = 106.8;
  const off = (circ * (1 - om / 100)).toFixed(1);
  const achN = Object.keys(state.ach).length;

  const miniCells: Array<{ id: string; cls: string }> = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      const k = `${Math.min(a, b)},${Math.max(a, b)}`;
      miniCells.push({ id: `${a}-${b}`, cls: colorClass(state, k) });
    }
  }

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
            Идеальный таймер считается по твоим прошлым ответам: отвечаешь быстрее — лимит
            сжимается. Скорость и точность формируют % усвоения каждого примера.
          </p>
        </div>

        <div className="actions">
          <button type="button" className="big-btn train" onClick={onTrain}>
            <span className="bb-ico">⚡</span>
            <span>
              <span className="bb-t">Тренировка</span>
              <span className="bb-s">{trainSub}</span>
            </span>
          </button>

          <button type="button" className="big-btn exam" onClick={onExam}>
            <span className="bb-ico">🎓</span>
            <span>
              <span className="bb-t">Экзамен</span>
              <span className="bb-s">36 заданий · вся таблица · готовность {om}%</span>
            </span>
            <svg className="exam-ring" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
              <circle
                cx="23"
                cy="23"
                r="17"
                fill="none"
                stroke="rgba(255,255,255,.25)"
                strokeWidth="5"
              />
              <circle
                cx="23"
                cy="23"
                r="17"
                fill="none"
                stroke={readyC}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={off}
                transform="rotate(-90 23 23)"
              />
              <text
                x="23"
                y="27"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#fff"
                fontFamily="Nunito"
              >
                {om}
              </text>
            </svg>
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

        <div className="card steps">
          <div className="step">
            <i>1</i>
            <span>
              <b>Тренируйся</b> — алгоритм следит за точностью и скоростью и чаще даёт слабые
              примеры.
            </span>
          </div>
          <div className="step">
            <i>2</i>
            <span>
              <b>Закрашивай карту</b> — каждое семейство примеров прокачивается до «мастера».
            </span>
          </div>
          <div className="step">
            <i>3</i>
            <span>
              <b>Сдай экзамен 36/36</b> — и получи именной сертификат Академии. 📜
            </span>
          </div>
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

        <div className="card map-card">
          <h3>🗺️ Карта таблицы</h3>
          <div className="mini-map" aria-hidden="true">
            {miniCells.map((cell) => (
              <span key={cell.id} className={`mm-cell ${cell.cls}`} />
            ))}
          </div>
          <p className="hint" style={{ marginBottom: 12 }}>
            Мастеров: <b style={{ color: 'var(--lime)' }}>{masteredCount(state)}</b> из 36 ·
            встречено {factsSeen(state)}
          </p>
          <button
            type="button"
            className="ghost-btn"
            style={{ width: '100%' }}
            onClick={onOpenMap}
          >
            Открыть карту →
          </button>
        </div>

        <div className="side">
          <div className="card">
            <h3>
              🏆 Достижения · {achN}/{ACH.length}
            </h3>
            <div className="ach-icons">
              {ACH.slice(0, 8).map((a) => (
                <span key={a.id} className={state.ach[a.id] ? '' : 'lock'} title={a.t}>
                  {state.ach[a.id] ? a.icon : '🔒'}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="ghost-btn"
              style={{ width: '100%' }}
              onClick={onOpenAch}
            >
              Все достижения →
            </button>
          </div>

          <div className="card">
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
            <p className="hint" style={{ marginBottom: 12 }}>
              💾 Прогресс автоматически сохраняется в этом браузере.
            </p>
            <button type="button" className="ghost-btn small danger-btn" onClick={onReset}>
              Сбросить прогресс
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
