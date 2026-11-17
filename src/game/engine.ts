export type Difficulty = 'calm' | 'normal' | 'strict';
export type QuestionMode = 'mul' | 'div';
export type SessionMode = 'train' | 'exam' | 'focus';

export interface FactStat {
  n: number;
  c: number;
  w: number;
  ema: number;
  best: number;
  lastWrong: boolean;
  seen: number;
  mn: number;
  mc: number;
  dn: number;
  dc: number;
  mEma?: number;
  dEma?: number;
  lastTimes?: number[];
  streak?: number;
  slowCount?: number;
}

export interface CertificateData {
  name: string;
  date: number;
  avg: number;
  mastery: number;
  id: string;
}

export interface PetState {
  fed: number;
  skin: string;
}

export interface GameState {
  v: number;
  name: string;
  xp: number;
  sound: boolean;
  ambient: boolean;
  diff: Difficulty;
  totals: {
    ans: number;
    ok: number;
    fast: number;
    divOk: number;
    bestCombo: number;
    ema: number;
    sessions: number;
    focusDone: number;
  };
  facts: Record<string, FactStat>;
  ach: Record<string, number>;
  streak: { day: string; n: number };
  exam: {
    tries: number;
    best: number;
    last: { ok: number; date: number } | null;
  };
  cert: CertificateData | null;
  pet: PetState;
}

export interface Fact {
  a: number;
  b: number;
  k: string;
  p: number;
}

export interface Question {
  k: string;
  mode: QuestionMode;
  a: number;
  b: number;
  p: number;
  x: number;
  y: number;
  sym: '×' | '÷';
  ans: number;
  limit: number;
  options: number[];
  done: boolean;
  tag: string;
}

export interface QuestionResult {
  k: string;
  ok: boolean;
  t: number;
  timeout: boolean;
  eq: string;
  ans: number;
  mode: QuestionMode;
}

export interface AchievementDef {
  id: string;
  icon: string;
  t: string;
  d: string;
  p: (s: GameState) => [number, number];
}

export const COLORS = {
  violet: '#a855f7',
  cyan: '#22d3ee',
  magenta: '#ff2ea6',
  lime: '#a3e635',
  amber: '#fbbf24',
  blue: '#4f7cff',
  red: '#ff5470',
  gold: '#f5c451',
} as const;

export const STORAGE_KEY = 'matemagia_v1';

export const PRAISE = [
  'Верно!',
  'Точно!',
  'Мощно!',
  'Класс!',
  'В яблочко!',
  'Блестяще!',
  'Магия чисел!',
];

export const RANKS: ReadonlyArray<readonly [string, string]> = [
  ['✨', 'Искра'],
  ['📘', 'Ученик'],
  ['🪄', 'Подмастерье'],
  ['🔮', 'Чародей'],
  ['🧙', 'Магистр'],
  ['🌟', 'Архимаг'],
  ['👑', 'Легенда таблицы'],
];

export const FACTS: Fact[] = (() => {
  const list: Fact[] = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      list.push({ a, b, k: `${a},${b}`, p: a * b });
    }
  }
  return list;
})();

export const FKEYS: string[] = FACTS.map((f) => f.k);

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function rnd(a = 1, b?: number): number {
  return b === undefined ? Math.random() * a : a + Math.random() * (b - a);
}

export function rndi(a: number, b: number): number {
  return Math.floor(rnd(a, b + 1));
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const ESC_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c] || c);
}

export function fmtK(k: string): string {
  return k.split(',').join('×');
}

export function dayKey(t = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function fmtDate(t: number): string {
  try {
    return new Date(t).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date(t).toLocaleDateString();
  }
}

export function createDefaultState(): GameState {
  return {
    v: 1,
    name: 'Ученик',
    xp: 0,
    sound: true,
    ambient: true,
    diff: 'normal',
    totals: {
      ans: 0,
      ok: 0,
      fast: 0,
      divOk: 0,
      bestCombo: 0,
      ema: 0,
      sessions: 0,
      focusDone: 0,
    },
    facts: {},
    ach: {},
    streak: { day: '', n: 0 },
    exam: { tries: 0, best: 0, last: null },
    cert: null,
    pet: { fed: 0, skin: 'meadow' },
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

export function mergeLoadedState(raw: Partial<GameState> | null | undefined): GameState {
  const base = createDefaultState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    ambient: raw.ambient !== undefined ? raw.ambient : base.ambient,
    totals: { ...base.totals, ...(raw.totals || {}) },
    streak: { ...base.streak, ...(raw.streak || {}) },
    exam: { ...base.exam, ...(raw.exam || {}) },
    facts: raw.facts || {},
    ach: raw.ach || {},
    cert: raw.cert || null,
    pet: { ...base.pet, ...(raw.pet || {}) },
  };
}

export function ensureFactStat(state: GameState, k: string): FactStat {
  if (!state.facts[k]) {
    state.facts[k] = {
      n: 0,
      c: 0,
      w: 0,
      ema: 0,
      best: 0,
      lastWrong: false,
      seen: 0,
      mn: 0,
      mc: 0,
      dn: 0,
      dc: 0,
      mEma: 0,
      dEma: 0,
      lastTimes: [],
      streak: 0,
      slowCount: 0,
    };
  }
  return state.facts[k];
}

export function factTimeVariance(st: FactStat | undefined): number {
  const times = st?.lastTimes;
  if (!times || times.length < 2) return 0;
  const mean = times.reduce((s, v) => s + v, 0) / times.length;
  if (mean <= 0) return 0;
  const variance = times.reduce((s, v) => s + (v - mean) * (v - mean), 0) / times.length;
  // Normalized coefficient of variation clamped to [0, 1]
  return clamp(Math.sqrt(variance) / Math.max(mean, 1.2), 0, 1);
}

export function spacedIntervalDays(st: FactStat | undefined): number {
  if (!st || !st.n) return 0;
  if (st.lastWrong) return 0.15;
  const streak = st.streak || 0;
  if (streak <= 0) return 0.4;
  const speedBonus = st.ema > 0 && st.ema < 2.3 ? 1.35 : st.ema > 4.2 ? 0.7 : 1;
  return clamp(Math.pow(1.9, streak - 1) * speedBonus, 0.4, 16);
}

export function mastery(state: GameState, k: string, now = Date.now()): number {
  const s = state.facts[k];
  if (!s || !s.n) return 0;
  const acc = (s.c + 0.7) / (s.n + 1.4);
  const speed = s.ema > 0 ? clamp(3.0 / s.ema, 0, 1) : 0.3;
  const cv = factTimeVariance(s);
  const consistency = 1 - 0.18 * cv;
  const slowRatio = s.n >= 2 ? clamp((s.slowCount || 0) / s.n, 0, 0.6) : 0;
  const fluency = (0.5 + 0.5 * speed) * consistency * (1 - 0.2 * slowRatio);

  const days = (now - s.seen) / 864e5;
  const interval = Math.max(1.5, spacedIntervalDays(s));
  const overdue = Math.max(0, days - interval);
  const rec = clamp(1 - overdue * 0.025, 0.68, 1);
  const wrongPenalty = s.lastWrong ? 0.86 : 1;
  return Math.round(100 * Math.pow(acc, 1.25) * fluency * rec * wrongPenalty);
}

export function overallMastery(state: GameState, now = Date.now()): number {
  const sum = FKEYS.reduce((acc, k) => acc + mastery(state, k, now), 0);
  return Math.round(sum / FKEYS.length);
}

export function factsSeen(state: GameState): number {
  return FKEYS.filter((k) => state.facts[k] && state.facts[k].n > 0).length;
}

export function masteredCount(state: GameState, now = Date.now()): number {
  return FKEYS.filter((k) => mastery(state, k, now) >= 90).length;
}

export function colorClass(state: GameState, k: string, now = Date.now()): string {
  const s = state.facts[k];
  if (!s || !s.n) return 'cU';
  const m = mastery(state, k, now);
  return m < 40 ? 'c1' : m < 70 ? 'c2' : m < 90 ? 'c3' : 'c4';
}

export interface WeakItem {
  k: string;
  m: number;
  st: FactStat | null;
}

export function weakList(state: GameState, n: number, now = Date.now()): WeakItem[] {
  return FKEYS.map((k) => ({ k, m: mastery(state, k, now), st: state.facts[k] || null }))
    .sort((a, b) => a.m - b.m || (a.st ? a.st.n : 0) - (b.st ? b.st.n : 0))
    .slice(0, n);
}

const DIFF_MULT: Record<Difficulty, number> = {
  calm: 1.3,
  normal: 1,
  strict: 0.8,
};

export function limitPreview(state: GameState): number {
  const g = state.totals.ema || 4.2;
  const df = DIFF_MULT[state.diff] || 1;
  return clamp(clamp(g * 2.1 + 1.2, 3.5, 12) * df, 2.5, 15);
}

export function snapshotMastery(state: GameState, now = Date.now()): {
  m: Record<string, number>;
  overall: number;
} {
  const m: Record<string, number> = {};
  FKEYS.forEach((k) => {
    m[k] = mastery(state, k, now);
  });
  return { m, overall: overallMastery(state, now) };
}

export function factCurriculumTier(k: string): number {
  const [a, b] = k.split(',').map(Number);
  if (a === 2 || b === 2 || a === 5 || b === 5 || a === b) return 1;
  if (a === 3 || b === 3 || a === 4 || b === 4) return 2;
  if (a === 9 || b === 9 || a === 6 || b === 6) return 3;
  return 4;
}

export interface AdaptiveCoursePlan {
  stage: number;
  stageTitle: string;
  stageGoal: string;
  lessonTitle: string;
  lessonReason: string;
  lessonSize: number;
  focusPool: string[];
  dueCount: number;
  hesitantCount: number;
  weakCount: number;
  divLagPct: number;
  stageProgressPct: number;
}

const COURSE_STAGE_META: Array<{ title: string; goal: string }> = [
  { title: 'Этап 1 · Опорные числа', goal: 'Умножение на 2, 5 и квадраты (2×2…9×9)' },
  { title: 'Этап 2 · Уверенный счёт', goal: 'Связки с тройкой и четвёркой' },
  { title: 'Этап 3 · Продвинутый уровень', goal: 'Примеры на 6 и закономерности ×9' },
  { title: 'Этап 4 · Сложное ядро', goal: 'Сложные пары 7×8 и баланс деления' },
  { title: 'Этап 5 · Свободное владение', goal: 'Интервальное повторение и скорость <2.5 с' },
];

export function getAdaptiveCourse(state: GameState, now = Date.now()): AdaptiveCoursePlan {
  const tierFacts: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  FKEYS.forEach((k) => {
    tierFacts[factCurriculumTier(k)].push(k);
  });

  // Determine active curriculum stage (advance when >= 72% of current tier reaches 70%+ mastery)
  let stage = 5;
  let stageProgressPct = 100;
  for (let t = 1; t <= 4; t++) {
    const keys = tierFacts[t];
    const ready = keys.filter((k) => mastery(state, k, now) >= 70).length;
    const pct = Math.round((ready / keys.length) * 100);
    if (pct < 72) {
      stage = t;
      stageProgressPct = pct;
      break;
    }
  }

  let dueCount = 0;
  let hesitantCount = 0;
  let weakCount = 0;
  let mulTimeSum = 0;
  let mulTimeCnt = 0;
  let divTimeSum = 0;
  let divTimeCnt = 0;

  const scored: Array<{ k: string; priority: number; reason: 'error' | 'hesitant' | 'due' | 'new' | 'polish' }> = [];

  FKEYS.forEach((k) => {
    const st = state.facts[k];
    const m = mastery(state, k, now);
    const tier = factCurriculumTier(k);

    if (st && st.n > 0) {
      if (st.mEma && st.mEma > 0) {
        mulTimeSum += st.mEma;
        mulTimeCnt++;
      }
      if (st.dEma && st.dEma > 0) {
        divTimeSum += st.dEma;
        divTimeCnt++;
      }
      const days = (now - st.seen) / 864e5;
      const interval = spacedIntervalDays(st);
      const isDue = days >= interval;
      const cv = factTimeVariance(st);
      const isHesitant = st.ema > 3.9 || cv > 0.36 || (st.slowCount || 0) >= 2;
      if (isDue) dueCount++;
      if (isHesitant && m < 92) hesitantCount++;
      if (st.lastWrong || m < 65) weakCount++;

      let priority = (100 - m) * 1.1;
      let reason: 'error' | 'hesitant' | 'due' | 'polish' = 'polish';
      if (st.lastWrong) {
        priority += 60;
        reason = 'error';
      } else if (isHesitant && m < 90) {
        priority += 34;
        reason = 'hesitant';
      } else if (isDue) {
        priority += 28 + Math.min(25, (days - interval) * 8);
        reason = 'due';
      }
      if (tier <= stage) priority += 12;
      scored.push({ k, priority, reason });
    } else {
      // Unseen facts: strongly prefer facts in the current curriculum stage
      const tierPenalty = tier <= stage ? 0 : (tier - stage) * 38;
      scored.push({
        k,
        priority: 48 - tierPenalty + (tier === stage ? 18 : 0),
        reason: 'new',
      });
    }
  });

  scored.sort((a, b) => b.priority - a.priority);

  // Build an 8-10 fact personalized lesson pool
  const focusPool = scored.slice(0, Math.min(10, scored.length)).map((item) => item.k);

  const avgMul = mulTimeCnt ? mulTimeSum / mulTimeCnt : 0;
  const avgDiv = divTimeCnt ? divTimeSum / divTimeCnt : 0;
  const divLagPct =
    avgMul > 0 && avgDiv > avgMul ? Math.round(((avgDiv - avgMul) / avgMul) * 100) : 0;

  const topReason = scored[0]?.reason || 'new';
  const unseenCount = FKEYS.length - factsSeen(state);
  let lessonTitle = 'Персональный урок курса';
  let lessonReason = COURSE_STAGE_META[stage - 1].goal;

  if (unseenCount === FKEYS.length) {
    lessonTitle = 'Стартовая диагностика';
    lessonReason = 'Начнём с опорных примеров ×2, ×5 и квадратов, чтобы определить твой темп.';
  } else if (weakCount >= 3 || topReason === 'error') {
    lessonTitle = 'Укрепление слабых связок';
    lessonReason = `Алгоритм заметил ${weakCount || 1} сложн. примеров с ошибками — закрепим их на комфортном темпе.`;
  } else if (hesitantCount >= 2 || topReason === 'hesitant') {
    lessonTitle = 'Тренировка скорости и уверенности';
    lessonReason = `На ${hesitantCount} примерах время ответа нестабильно — доведём их до автоматизма.`;
  } else if (divLagPct >= 25) {
    lessonTitle = 'Прокачка деления';
    lessonReason = `Деление даётся на ${divLagPct}% медленнее умножения — усилим обратные задачи.`;
  } else if (dueCount >= 3) {
    lessonTitle = 'Интервальное повторение';
    lessonReason = `Пора освежить в памяти ${dueCount} примеров, чтобы не потерять мастерство.`;
  } else if (stage < 5) {
    lessonTitle = `Открываем новые факты (${COURSE_STAGE_META[stage - 1].title.split('·')[0].trim()})`;
    lessonReason = `Добавили свежие примеры этапа: ${focusPool.slice(0, 3).map(fmtK).join(', ')}.`;
  } else {
    lessonTitle = 'Шлифовка мастерства';
    lessonReason = 'База пройдена — оттачиваем молниеносную реакцию по всей таблице.';
  }

  return {
    stage,
    stageTitle: COURSE_STAGE_META[stage - 1].title,
    stageGoal: COURSE_STAGE_META[stage - 1].goal,
    lessonTitle,
    lessonReason,
    lessonSize: 12,
    focusPool,
    dueCount,
    hesitantCount,
    weakCount,
    divLagPct,
    stageProgressPct,
  };
}

export function pickFact(
  state: GameState,
  pool: readonly string[],
  recent: readonly string[],
  now = Date.now()
): { k: string; w: number; tag: string } {
  const course = pool.length === FKEYS.length ? getAdaptiveCourse(state, now) : null;
  const activeStage = course ? course.stage : 5;
  const weights: Array<{ k: string; w: number; tag: string }> = [];
  let total = 0;

  for (let i = 0; i < pool.length; i++) {
    const k = pool[i];
    const st = state.facts[k];
    const m = st && st.n ? mastery(state, k, now) : 0;
    const tier = factCurriculumTier(k);
    let w = 0.16 + 3.4 * Math.pow(1 - m / 100, 1.7);
    let tag = 'ЗАКРЕПЛЕНИЕ';

    if (!st || st.n === 0) {
      const stageBoost = tier <= activeStage ? 1.85 : Math.max(0.2, 0.85 - (tier - activeStage) * 0.28);
      w = (1.6 + 2.0) * stageBoost;
      tag = 'НОВОЕ';
    } else if (st.lastWrong) {
      w *= 2.15;
      tag = 'РАБОТА НАД ОШИБКОЙ';
    } else {
      const cv = factTimeVariance(st);
      const isHesitant = st.ema > 4.0 || cv > 0.36;
      const days = (now - st.seen) / 864e5;
      const interval = spacedIntervalDays(st);

      if (m < 70) {
        w *= isHesitant ? 1.45 : 1.15;
        tag = 'СЛАБОЕ МЕСТО';
      } else if (isHesitant) {
        w = 0.95 + cv * 1.4 + Math.max(0, st.ema - 3.2) * 0.35;
        tag = 'НА СКОРОСТЬ';
      } else if (days >= interval) {
        w = 0.42 + Math.min(1.6, (days - interval + 0.5) * 0.35);
        tag = 'ПОВТОРЕНИЕ';
      } else {
        w = 0.14;
      }
    }

    if (recent.includes(k)) w *= 0.08;
    weights.push({ k, w, tag });
    total += w;
  }

  let r = Math.random() * total;
  for (let j = 0; j < weights.length; j++) {
    r -= weights[j].w;
    if (r <= 0) return weights[j];
  }
  return weights[weights.length - 1];
}

export function chooseMode(st: FactStat | undefined): QuestionMode {
  let p = 0.45;
  if (st) {
    if (st.mn >= 2 && st.dn >= 2) {
      const ma = st.mc / st.mn;
      const da = st.dc / st.dn;
      const mSlow = st.mEma || st.ema || 3;
      const dSlow = st.dEma || st.ema || 3;
      if (da < ma - 0.08 || dSlow > mSlow * 1.32) p = 0.72;
      else if (ma < da - 0.08 || mSlow > dSlow * 1.25) p = 0.24;
    } else if (st.mn >= 2 && st.dn === 0) {
      // Encourage testing division once multiplication is seen
      p = 0.65;
    }
  }
  return Math.random() < p ? 'div' : 'mul';
}

export function genOptions(
  ans: number,
  mode: QuestionMode,
  a: number,
  b: number,
  p: number
): number[] {
  const set = [ans];
  const cand =
    mode === 'mul'
      ? [
          p + a,
          p - a,
          p + b,
          p - b,
          p + 1,
          p - 1,
          p + 10,
          p - 10,
          a * (b + 1),
          a * (b - 1),
          (a + 1) * b,
          (a - 1) * b,
          p + 2,
          p - 2,
        ]
      : [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, a, b, ans + 3, ans - 3];
  const sh = shuffle(cand);
  for (let i = 0; i < sh.length; i++) {
    if (set.length >= 4) break;
    const v = sh[i];
    if (Number.isFinite(v) && v > 0 && !set.includes(v)) set.push(v);
  }
  let pad = ans + 3;
  while (set.length < 4) {
    pad += rndi(1, 4);
    if (pad > 0 && !set.includes(pad)) set.push(pad);
  }
  return shuffle(set);
}

export function makeQuestion(
  state: GameState,
  k: string,
  mode: QuestionMode,
  sessionMode: SessionMode,
  tag = ''
): Question {
  const [a, b] = k.split(',').map(Number);
  const p = a * b;
  let x: number;
  let y: number;
  let sym: '×' | '÷';
  let ans: number;
  if (mode === 'mul') {
    if (Math.random() < 0.5) {
      x = a;
      y = b;
    } else {
      x = b;
      y = a;
    }
    sym = '×';
    ans = p;
  } else {
    const d = Math.random() < 0.5 ? a : b;
    x = p;
    y = d;
    sym = '÷';
    ans = p / d;
  }
  const st = state.facts[k];
  const g = state.totals.ema || 4.2;
  const modeEma = mode === 'div' ? st?.dEma || st?.ema : st?.mEma || st?.ema;
  const fe = modeEma && modeEma > 0 ? modeEma : g;
  const scaffolding = !st || st.n < 2 || st.lastWrong ? 1.15 : 1;
  const base = clamp(fe * 2.05 + 1.2, 3.5, 12);
  const df = DIFF_MULT[state.diff] || 1;
  const limit = clamp(
    base * df * scaffolding * (mode === 'div' ? 1.15 : 1) * (sessionMode === 'exam' ? 0.9 : 1),
    2.5,
    15
  );
  return {
    k,
    mode,
    a,
    b,
    p,
    x,
    y,
    sym,
    ans,
    limit,
    options: genOptions(ans, mode, a, b, p),
    done: false,
    tag,
  };
}

export function buildExamQueue(): Array<{ k: string; mode: QuestionMode }> {
  const start = Math.random() < 0.5 ? 0 : 1;
  return shuffle(FKEYS).map((k, i) => ({
    k,
    mode: (i + start) % 2 ? 'div' : 'mul',
  }));
}

export function rankFor(l: number): { emoji: string; name: string } {
  const r = RANKS[Math.min(RANKS.length - 1, Math.floor((l - 1) / 2))];
  return { emoji: r[0], name: r[1] };
}

export function levelInfo(xp: number): { l: number; into: number; need: number } {
  let l = 1;
  let rem = xp;
  let need = Math.round(90 * Math.pow(l, 1.35));
  while (rem >= need) {
    rem -= need;
    l++;
    need = Math.round(90 * Math.pow(l, 1.35));
  }
  return { l, into: rem, need };
}

export const ACH: AchievementDef[] = [
  { id: 'first', icon: '✨', t: 'Первая искра', d: 'Первый верный ответ', p: (s) => [Math.min(s.totals.ok, 1), 1] },
  { id: 'c10', icon: '🔥', t: 'Серия ×10', d: '10 верных ответов подряд', p: (s) => [Math.min(s.totals.bestCombo, 10), 10] },
  { id: 'c25', icon: '☄️', t: 'Серия ×25', d: '25 верных ответов подряд', p: (s) => [Math.min(s.totals.bestCombo, 25), 25] },
  { id: 'a100', icon: '💯', t: 'Сотня', d: 'Ответить на 100 заданий', p: (s) => [Math.min(s.totals.ans, 100), 100] },
  { id: 'a500', icon: '🚀', t: 'Пятисотка', d: 'Ответить на 500 заданий', p: (s) => [Math.min(s.totals.ans, 500), 500] },
  { id: 'expl', icon: '🗺️', t: 'Разведчик', d: 'Встретить все 36 семейств примеров', p: (s) => [factsSeen(s), 36] },
  { id: 'm10', icon: '🛡️', t: 'Десятка мастеров', d: 'Прокачать 10 примеров до 90%', p: (s) => [Math.min(masteredCount(s), 10), 10] },
  { id: 'm36', icon: '👑', t: 'Грандмастер', d: 'Все 36 примеров на 90%+', p: (s) => [masteredCount(s), 36] },
  { id: 'flash', icon: '⚡', t: 'Молния', d: '15 верных ответов быстрее 2 секунд', p: (s) => [Math.min(s.totals.fast, 15), 15] },
  { id: 'div50', icon: '➗', t: 'Мастер деления', d: '50 верных ответов на деление', p: (s) => [Math.min(s.totals.divOk, 50), 50] },
  { id: 'exam', icon: '🎯', t: 'Экзамен сдан', d: 'Набрать 33+ из 36 на экзамене', p: (s) => [Math.min(s.exam.best, 33), 33] },
  { id: 'cert', icon: '📜', t: 'Архимаг', d: 'Идеальный экзамен 36/36 — сертификат!', p: (s) => [s.cert ? 1 : 0, 1] },
  { id: 'focus', icon: '🔧', t: 'Работа над ошибками', d: 'Завершить фокус-тренировку', p: (s) => [Math.min(s.totals.focusDone, 1), 1] },
  { id: 'streak3', icon: '📅', t: 'Три дня подряд', d: 'Заниматься 3 дня подряд', p: (s) => [Math.min(s.streak.n, 3), 3] },
];

export function bumpStreak(state: GameState, now = Date.now()): void {
  const today = dayKey(now);
  if (state.streak.day === today) return;
  const y = dayKey(now - 864e5);
  state.streak.n = state.streak.day === y ? state.streak.n + 1 : 1;
  state.streak.day = today;
}

export function displayStreak(state: GameState, now = Date.now()): number {
  const t = dayKey(now);
  const y = dayKey(now - 864e5);
  return state.streak.day === t || state.streak.day === y ? state.streak.n : 0;
}

export interface StreakBonusInfo {
  streak: number;
  practicedToday: boolean;
  multiplier: number;
  bonusPercent: number;
  badgeEmoji: string;
  badgeTitle: string;
  nextTierDays: number | null;
  nextTierPercent: number | null;
}

export function getStreakBonus(state: GameState, now = Date.now()): StreakBonusInfo {
  const streak = displayStreak(state, now);
  const practicedToday = state.streak.day === dayKey(now);

  if (streak >= 7) {
    return {
      streak,
      practicedToday,
      multiplier: 1.5,
      bonusPercent: 50,
      badgeEmoji: '👑',
      badgeTitle: 'Неделя магии',
      nextTierDays: null,
      nextTierPercent: null,
    };
  }
  if (streak >= 5) {
    return {
      streak,
      practicedToday,
      multiplier: 1.35,
      bonusPercent: 35,
      badgeEmoji: '🌟',
      badgeTitle: 'Звёздная серия',
      nextTierDays: 7,
      nextTierPercent: 50,
    };
  }
  if (streak >= 3) {
    return {
      streak,
      practicedToday,
      multiplier: 1.2,
      bonusPercent: 20,
      badgeEmoji: '⚡',
      badgeTitle: 'Уверенный ритм',
      nextTierDays: 5,
      nextTierPercent: 35,
    };
  }
  if (streak >= 2) {
    return {
      streak,
      practicedToday,
      multiplier: 1.1,
      bonusPercent: 10,
      badgeEmoji: '🔥',
      badgeTitle: 'Искра привычки',
      nextTierDays: 3,
      nextTierPercent: 20,
    };
  }
  if (streak === 1) {
    return {
      streak,
      practicedToday,
      multiplier: 1,
      bonusPercent: 0,
      badgeEmoji: '🔥',
      badgeTitle: 'Первый шаг',
      nextTierDays: 2,
      nextTierPercent: 10,
    };
  }
  return {
    streak: 0,
    practicedToday: false,
    multiplier: 1,
    bonusPercent: 0,
    badgeEmoji: '🌱',
    badgeTitle: 'Старт серии',
    nextTierDays: 2,
    nextTierPercent: 10,
  };
}

export function recordStat(
  state: GameState,
  q: Question,
  ok: boolean,
  t: number,
  now = Date.now()
): void {
  const st = ensureFactStat(state, q.k);
  st.n++;
  st.seen = now;
  const times = Array.isArray(st.lastTimes) ? st.lastTimes.slice(-4) : [];
  times.push(Number(t.toFixed(2)));
  st.lastTimes = times;

  if (q.mode === 'mul') {
    st.mn++;
    if (ok) {
      st.mc++;
      st.mEma = st.mEma ? st.mEma * 0.6 + t * 0.4 : t;
    }
  } else {
    st.dn++;
    if (ok) {
      st.dc++;
      st.dEma = st.dEma ? st.dEma * 0.6 + t * 0.4 : t;
    }
  }
  if (ok) {
    st.c++;
    st.ema = st.ema ? st.ema * 0.65 + t * 0.35 : t;
    st.best = st.best ? Math.min(st.best, t) : t;
    st.lastWrong = false;
    st.streak = (st.streak || 0) + 1;
    if (t > Math.max(4.4, q.limit * 0.72)) {
      st.slowCount = (st.slowCount || 0) + 1;
    }
    state.totals.ok++;
    state.totals.ema = state.totals.ema ? state.totals.ema * 0.7 + t * 0.3 : t;
    if (t < 2) state.totals.fast++;
    if (q.mode === 'div') state.totals.divOk++;
  } else {
    st.w++;
    st.lastWrong = true;
    st.streak = 0;
  }
  state.totals.ans++;
  bumpStreak(state, now);
}

export function calculateQuestionXp(
  diff: Difficulty,
  sessionMode: SessionMode,
  tLeft: number,
  limit: number,
  combo: number,
  ok: boolean,
  streakMultiplier = 1
): number {
  if (!ok) return 2;
  const speedB = Math.round(10 * clamp(tLeft / limit, 0, 1));
  const dm = { calm: 0.8, normal: 1, strict: 1.25 }[diff] || 1;
  return Math.round(
    (10 + speedB + Math.min(combo, 10)) *
      dm *
      (sessionMode === 'exam' ? 1.5 : 1) *
      streakMultiplier
  );
}

export function checkAchievements(state: GameState, now = Date.now()): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (let i = 0; i < ACH.length; i++) {
    const a = ACH[i];
    if (state.ach[a.id]) continue;
    const pr = a.p(state);
    if (pr[0] >= pr[1]) {
      state.ach[a.id] = now;
      unlocked.push(a);
    }
  }
  return unlocked;
}

export function certId(now = Date.now()): string {
  return 'MM-' + now.toString(36).toUpperCase().slice(-6);
}

export function calculateGrade(complete: boolean, acc: number, avg: number): string {
  if (!complete) return '—';
  const speed = avg ? clamp(3.5 / avg, 0, 1) : 0;
  const sc = acc * 0.75 + speed * 0.25;
  return sc >= 0.92 ? 'S' : sc >= 0.8 ? 'A' : sc >= 0.62 ? 'B' : sc >= 0.45 ? 'C' : 'D';
}

export type PetMood = 'idle' | 'hungry' | 'eating' | 'happy' | 'excited' | 'sad' | 'sleepy';

export interface PetSkin {
  id: string;
  name: string;
  unlockLevel: number;
  icon: string;
  segmentColors: string[];
  headColor: string;
  bellyColor: string;
  antennaColor: string;
  cheekColor: string;
  hasCrown?: boolean;
  hasStars?: boolean;
}

export const PET_SKINS: PetSkin[] = [
  {
    id: 'meadow',
    name: 'Луговая',
    unlockLevel: 1,
    icon: '🌿',
    headColor: '#a3e635',
    segmentColors: ['#84cc16', '#4ade80', '#22c55e', '#4ade80', '#84cc16', '#a3e635'],
    bellyColor: '#ecfccb',
    antennaColor: '#bef264',
    cheekColor: '#ff7eb6',
  },
  {
    id: 'berry',
    name: 'Ягодная',
    unlockLevel: 2,
    icon: '🍓',
    headColor: '#ff2ea6',
    segmentColors: ['#ec4899', '#fb7185', '#f43f5e', '#fb7185', '#ec4899', '#ff2ea6'],
    bellyColor: '#ffe4e6',
    antennaColor: '#f5c451',
    cheekColor: '#fde047',
  },
  {
    id: 'cosmos',
    name: 'Космос',
    unlockLevel: 3,
    icon: '🌌',
    headColor: '#a855f7',
    segmentColors: ['#7c3aed', '#22d3ee', '#6366f1', '#22d3ee', '#7c3aed', '#a855f7'],
    bellyColor: '#e0f2fe',
    antennaColor: '#22d3ee',
    cheekColor: '#ff2ea6',
    hasStars: true,
  },
  {
    id: 'sun',
    name: 'Солнечная',
    unlockLevel: 4,
    icon: '☀️',
    headColor: '#fbbf24',
    segmentColors: ['#f59e0b', '#fb923c', '#f5c451', '#fb923c', '#f59e0b', '#fbbf24'],
    bellyColor: '#fef3c7',
    antennaColor: '#fef08a',
    cheekColor: '#f97316',
  },
  {
    id: 'ice',
    name: 'Ледяная',
    unlockLevel: 5,
    icon: '❄️',
    headColor: '#22d3ee',
    segmentColors: ['#38bdf8', '#60a5fa', '#818cf8', '#60a5fa', '#38bdf8', '#67e8f9'],
    bellyColor: '#f0f9ff',
    antennaColor: '#a5f3fc',
    cheekColor: '#f472b6',
    hasStars: true,
  },
  {
    id: 'rainbow',
    name: 'Радужная',
    unlockLevel: 6,
    icon: '🌈',
    headColor: '#ff5470',
    segmentColors: ['#fb923c', '#f5c451', '#a3e635', '#22d3ee', '#4f7cff', '#a855f7'],
    bellyColor: '#ffffff',
    antennaColor: '#f5c451',
    cheekColor: '#ff85b3',
  },
  {
    id: 'royal',
    name: 'Королева',
    unlockLevel: 8,
    icon: '👑',
    headColor: '#9333ea',
    segmentColors: ['#f5c451', '#7c3aed', '#f5c451', '#7c3aed', '#f5c451', '#a855f7'],
    bellyColor: '#fef9c3',
    antennaColor: '#fde047',
    cheekColor: '#ff2ea6',
    hasCrown: true,
    hasStars: true,
  },
];

export function isPetSkinUnlocked(skin: PetSkin, level: number): boolean {
  return level >= skin.unlockLevel;
}

export function getUnlockedPetSkins(level: number): PetSkin[] {
  return PET_SKINS.filter((skin) => isPetSkinUnlocked(skin, level));
}

export function getEquippedPetSkin(state: GameState): PetSkin {
  const level = levelInfo(state.xp).l;
  const found = PET_SKINS.find((s) => s.id === state.pet.skin);
  if (found && isPetSkinUnlocked(found, level)) {
    return found;
  }
  return PET_SKINS[0];
}

export function getPetStage(fed: number): {
  title: string;
  segments: number;
  nextAt: number | null;
} {
  if (fed >= 100) return { title: 'Легенда листа', segments: 6, nextAt: null };
  if (fed >= 50) return { title: 'Волшебница', segments: 6, nextAt: 100 };
  if (fed >= 20) return { title: 'Умняшка', segments: 5, nextAt: 50 };
  if (fed >= 5) return { title: 'Любознашка', segments: 4, nextAt: 20 };
  return { title: 'Малышка', segments: 4, nextAt: 5 };
}

