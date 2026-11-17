import { QuestionResult, SessionMode, fmtK } from '../game/engine';

export interface SessionSummary {
  mode: SessionMode;
  count: number;
  answered: number;
  ok: number;
  xp: number;
  acc: number;
  avg: number;
  best: number;
  overallAfter: number;
  overallDelta: number;
  improved: Array<{ k: string; d: number }>;
  failed: QuestionResult[];
  complete: boolean;
  perfect: boolean;
  grade: string;
}

interface ResultsScreenProps {
  summary: SessionSummary;
  onCertOpen: () => void;
  onFocusErrors: (keys: string[]) => void;
  onTrainAgain: () => void;
  onBackToHub: () => void;
}

export function ResultsScreen({
  summary,
  onCertOpen,
  onFocusErrors,
  onTrainAgain,
  onBackToHub,
}: ResultsScreenProps) {
  const modeName =
    summary.mode === 'exam'
      ? 'Выпускной экзамен'
      : summary.mode === 'focus'
        ? 'Фокус-тренировка'
        : 'Тренировка';

  const titles: Record<string, string> = {
    S: 'Легендарно!',
    A: 'Отлично!',
    B: 'Хорошо!',
    C: 'Неплохо, но можно лучше',
    D: 'Тренируемся дальше!',
    '—': 'Занятие прервано',
  };

  const title = summary.perfect
    ? 'Идеальный экзамен! 🎉'
    : titles[summary.grade] || 'Занятие завершено';
  const gCls = summary.grade === '—' ? 'gX' : `g${summary.grade}`;
  const failKeys = Array.from(new Set(summary.failed.map((f) => f.k)));

  return (
    <section className="screen-anim" aria-label="Результаты">
      <div className="res-wrap">
        <div className="res-head">
          <div className={`grade ${gCls}`}>{summary.grade}</div>
          <div>
            <div className="res-title">{title}</div>
            <div className="res-sub">
              {modeName} · {summary.answered} из {summary.count} заданий
              {summary.complete ? '' : ' · прервано досрочно'}
            </div>
          </div>
        </div>

        {summary.perfect && (
          <div className="res-banner">
            🏅 36 из 36 без единой ошибки — сертификат Академии твой!
            <button
              type="button"
              className="primary-btn gold"
              style={{ marginLeft: 'auto' }}
              onClick={onCertOpen}
            >
              📜 Открыть сертификат
            </button>
          </div>
        )}

        <div className="res-grid">
          <div className="res-stat">
            <div className="rv lime">
              {summary.answered ? Math.round(summary.acc * 100) : 0}%
            </div>
            <div className="rl">точность</div>
          </div>
          <div className="res-stat">
            <div className="rv">
              {summary.ok} / {summary.answered}
            </div>
            <div className="rl">верно</div>
          </div>
          <div className="res-stat">
            <div className="rv gold">+{summary.xp}</div>
            <div className="rl">опыт</div>
          </div>
          <div className="res-stat">
            <div className="rv">{summary.avg ? `${summary.avg.toFixed(1)} с` : '—'}</div>
            <div className="rl">ср. время</div>
          </div>
          <div className="res-stat">
            <div className="rv mag">{summary.best ? `${summary.best.toFixed(1)} с` : '—'}</div>
            <div className="rl">лучший ответ</div>
          </div>
          <div className="res-stat">
            <div className="rv lime">
              {summary.overallAfter}%
              {summary.overallDelta !== 0 && (
                <span className={`delta ${summary.overallDelta > 0 ? 'up' : 'down'}`}>
                  {summary.overallDelta > 0 ? '▲+' : '▼'}
                  {summary.overallDelta}%
                </span>
              )}
            </div>
            <div className="rl">усвоение</div>
          </div>
        </div>

        {summary.improved.length > 0 && (
          <div className="res-sec">
            <h3>📈 Прокачано за занятие</h3>
            {summary.improved.map((o) => (
              <span key={o.k} className="imp-chip">
                {fmtK(o.k)} <b>+{o.d}%</b>
              </span>
            ))}
          </div>
        )}

        {summary.failed.length > 0 && (
          <div className="res-sec">
            <h3>🔧 Над чем поработать</h3>
            {summary.failed.map((f) => (
              <div key={f.k} className="fail-row">
                <span className="fe">
                  {f.eq} = {f.ans}
                </span>
                <span className="ft">{f.timeout ? '⏱ время вышло' : '✕ ошибка'}</span>
                <span className="fa">запомни!</span>
              </div>
            ))}
          </div>
        )}

        <div className="res-actions">
          {failKeys.length > 0 && (
            <button
              type="button"
              className="primary-btn mag"
              onClick={() => onFocusErrors(failKeys)}
            >
              🔧 Тренировать ошибки
            </button>
          )}
          <button type="button" className="primary-btn" onClick={onTrainAgain}>
            ⚡ Ещё тренировка
          </button>
          <button type="button" className="ghost-btn" onClick={onBackToHub}>
            🏠 В штаб
          </button>
        </div>
      </div>
    </section>
  );
}
