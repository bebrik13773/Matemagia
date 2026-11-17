import { useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  FKEYS,
  GameState,
  QuestionMode,
  colorClass,
  fmtDate,
  mastery,
  overallMastery,
  weakList,
} from '../game/engine';

interface MapScreenProps {
  state: GameState;
  selectedKey: string | null;
  mapMode: QuestionMode;
  onSelectKey: (k: string) => void;
  onToggleMapMode: () => void;
  onBackToHub: () => void;
  onFocusFact: (k: string) => void;
}

export function MapScreen({
  state,
  selectedKey,
  mapMode,
  onSelectKey,
  onToggleMapMode,
  onBackToHub,
  onFocusFact,
}: MapScreenProps) {
  const [hovered, setHovered] = useState<{ r: number; c: number; k: string } | null>(null);

  const activeKey =
    selectedKey && FKEYS.includes(selectedKey) ? selectedKey : weakList(state, 1)[0].k;
  const [a, b] = activeKey.split(',').map(Number);
  const p = a * b;
  const st = state.facts[activeKey];
  const m = mastery(state, activeKey);

  const acc = st && st.n ? `${Math.round((st.c / st.n) * 100)}%` : '—';
  const ema = st && st.ema ? `${st.ema.toFixed(1)} с` : '—';
  const best = st && st.best ? `${st.best.toFixed(1)} с` : '—';
  const last = st && st.seen ? fmtDate(st.seen) : '—';
  const masteryColor =
    m >= 90 ? 'var(--lime)' : m >= 70 ? 'var(--amber)' : m > 0 ? 'var(--red)' : 'var(--mute)';

  const cols = [2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <section className="screen-anim" aria-label="Карта таблицы">
      <div className="page-head">
        <button type="button" className="ghost-btn" onClick={onBackToHub}>
          ← В штаб
        </button>
        <h2>🗺️ Карта таблицы</h2>
        <button type="button" className="ghost-btn" onClick={onToggleMapMode}>
          {mapMode === 'mul' ? 'Показать деление ÷' : 'Показать умножение ×'}
        </button>
      </div>

      <div className="legend">
        <span className="leg-item">
          <i className="cU" />
          новое
        </span>
        <span className="leg-item">
          <i className="c1" />
          &lt;40%
        </span>
        <span className="leg-item">
          <i className="c2" />
          40–69%
        </span>
        <span className="leg-item">
          <i className="c3" />
          70–89%
        </span>
        <span className="leg-item">
          <i className="c4" />
          мастер 90%+
        </span>
        <span className="leg-item" style={{ marginLeft: 'auto', color: 'var(--lime)' }}>
          Общее усвоение: {overallMastery(state)}%
        </span>
      </div>

      <div className="map-layout">
        <div className="card">
          <MotionConfig reducedMotion="user">
            <div
              className="mgrid"
              role="grid"
              aria-label="Таблица умножения от 2 до 9"
              onMouseLeave={() => setHovered(null)}
            >
              <span className="mh">{mapMode === 'mul' ? '×' : '÷'}</span>
              {cols.map((c) => (
                <span
                  key={`h-${c}`}
                  className={`mh ${hovered?.c === c ? 'axis-active' : ''}`}
                >
                  {c}
                </span>
              ))}
              {cols.map((r, rIdx) => (
                <span key={`row-${r}`} style={{ display: 'contents' }}>
                  <span className={`mh ${hovered?.r === r ? 'axis-active' : ''}`}>{r}</span>
                  {cols.map((c2, cIdx) => {
                    const k = `${Math.min(r, c2)},${Math.max(r, c2)}`;
                    const main = mapMode === 'mul' ? r * c2 : r;
                    const label = mapMode === 'mul' ? `${r}×${c2}` : `${r * c2}÷${c2}`;
                    const isSelected = k === activeKey;
                    const isFamilyHover = hovered?.k === k;
                    return (
                      <motion.div
                        key={`${r}-${c2}`}
                        className={`mcell-wrap ${isSelected ? 'is-sel' : ''}`}
                        initial={{ opacity: 0, scale: 0.72, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.34,
                          delay: (rIdx + cIdx) * 0.022,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <button
                          type="button"
                          className={`mcell ${colorClass(state, k)} ${isSelected ? 'sel' : ''} ${isFamilyHover ? 'fam-hover' : ''}`}
                          aria-label={`${label} равно ${main}`}
                          aria-pressed={isSelected}
                          onMouseEnter={() => setHovered({ r, c: c2, k })}
                          onFocus={() => setHovered({ r, c: c2, k })}
                          onBlur={() => setHovered((prev) => (prev?.r === r && prev?.c === c2 ? null : prev))}
                          onClick={() => onSelectKey(k)}
                        >
                          <span key={mapMode} className="mcell-inner">
                            <b>{main}</b>
                            <small>{label}</small>
                          </span>
                        </button>
                      </motion.div>
                    );
                  })}
                </span>
              ))}
            </div>
          </MotionConfig>
        </div>

        <div className="card map-detail">
          <h3>
            {a} × {b} = {p}
          </h3>
          <div className="fam-chips">
            <span>
              {a}×{b}={p}
            </span>
            <span>
              {b}×{a}={p}
            </span>
            <span>
              {p}÷{a}={b}
            </span>
            <span>
              {p}÷{b}={a}
            </span>
          </div>
          <div className="mastery-big" style={{ color: masteryColor }}>
            {m}%
          </div>
          <div className="bar heat">
            <i style={{ width: `${m}%` }} />
          </div>
          <div className="stat-rows">
            <div>
              <span>Попытки</span>
              <b>{st ? st.n : 0}</b>
            </div>
            <div>
              <span>Точность</span>
              <b>{acc}</b>
            </div>
            <div>
              <span>Ср. время (верные)</span>
              <b>{ema}</b>
            </div>
            <div>
              <span>Рекорд скорости</span>
              <b>{best}</b>
            </div>
            <div>
              <span>Последний раз</span>
              <b>{last}</b>
            </div>
          </div>
          <p className="hint" style={{ marginBottom: 14 }}>
            {st && st.n
              ? 'Скорость и точность вместе формируют % усвоения. Отвечай быстрее — процент растёт!'
              : 'Это семейство ещё не встречалось. Алгоритм подмешает его в тренировку.'}
          </p>
          <button
            type="button"
            className="primary-btn"
            style={{ width: '100%' }}
            onClick={() => onFocusFact(activeKey)}
          >
            🎯 Тренировать это семейство
          </button>
        </div>
      </div>
    </section>
  );
}
