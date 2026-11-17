import { ACH, GameState, clamp, fmtDate } from '../game/engine';

interface AchScreenProps {
  state: GameState;
  onBackToHub: () => void;
}

export function AchScreen({ state, onBackToHub }: AchScreenProps) {
  const unlockedCount = Object.keys(state.ach).length;

  return (
    <section className="screen-anim" aria-label="Достижения">
      <div className="page-head">
        <button type="button" className="ghost-btn" onClick={onBackToHub}>
          ← В штаб
        </button>
        <h2>🏆 Достижения</h2>
        <span className="chip c-amber">
          {unlockedCount} / {ACH.length}
        </span>
      </div>

      <div className="ach-grid">
        {ACH.map((a) => {
          const doneAt = state.ach[a.id];
          const done = Boolean(doneAt);
          const pr = a.p(state);
          const pct = Math.round(clamp(pr[0] / pr[1], 0, 1) * 100);
          return (
            <div key={a.id} className={`card ach-item ${done ? 'done' : 'locked'}`}>
              <span className="ach-ico">{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div className="ach-t">{a.t}</div>
                <div className="ach-d">{a.d}</div>
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className="ach-p">
                  {done ? `✓ Получено ${fmtDate(doneAt)}` : `${pr[0]} / ${pr[1]}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
