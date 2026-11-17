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
}

export interface CertificateData {
  name: string;
  date: number;
  avg: number;
  mastery: number;
  id: string;
}

export interface GameState {
  v: number;
  name: string;
  xp: number;
  sound: boolean;
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
    totals: { ...base.totals, ...(raw.totals || {}) },
    streak: { ...base.streak, ...(raw.streak || {}) },
    exam: { ...base.exam, ...(raw.exam || {}) },
    facts: raw.facts || {},
    ach: raw.ach || {},
    cert: raw.cert || null,
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
    };
  }
  return state.facts[k];
}

export function mastery(state: GameState, k: string, now = Date.now()): number {
  const s = state.facts[k];
  if (!s || !s.n) return 0;
  const acc = (s.c + 0.7) / (s.n + 1.4);
  const speed = s.ema > 0 ? clamp(3.0 / s.ema, 0, 1) : 0.3;
  const days = (now - s.seen) / 864e5;
  const rec = clamp(1 - Math.max(0, days - 3) * 0.02, 0.72, 1);
  return Math.round(100 * Math.pow(acc, 1.25) * (0.5 + 0.5 * speed) * rec);
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

export function pickFact(
  state: GameState,
  pool: readonly string[],
  recent: readonly string[],
  now = Date.now()
): { k: string; w: number; tag: string } {
  const weights: Array<{ k: string; w: number; tag: string }> = [];
  let total = 0;
  for (let i = 0; i < pool.length; i++) {
    const k = pool[i];
    const st = state.facts[k];
    const m = st && st.n ? mastery(state, k, now) : 0;
    let w = 0.18 + 3.4 * Math.pow(1 - m / 100, 1.7);
    let tag = 'ЗАКРЕПЛЕНИЕ';
    if (!st || st.n === 0) {
      w += 1.5;
      tag = 'НОВОЕ';
    } else if (st.lastWrong) {
      w *= 1.9;
      tag = 'СЛАБОЕ МЕСТО';
    } else if (m < 70) {
      tag = 'СЛАБОЕ МЕСТО';
    } else {
      const days = (now - st.seen) / 864e5;
      if (days > 1) {
        w = 0.22 + Math.min(1.2, days * 0.25);
        tag = 'ПОВТОРЕНИЕ';
      } else {
        w = 0.2;
      }
    }
    if (recent.includes(k)) w *= 0.1;
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
  if (st && st.mn >= 3 && st.dn >= 3) {
    const ma = st.mc / st.mn;
    const da = st.dc / st.dn;
    if (da < ma - 0.08) p = 0.68;
    else if (ma < da - 0.08) p = 0.25;
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
  const fe = st && st.ema ? st.ema : g;
  const base = clamp(fe * 2.1 + 1.2, 3.5, 12);
  const df = DIFF_MULT[state.diff] || 1;
  const limit = clamp(
    base * df * (mode === 'div' ? 1.15 : 1) * (sessionMode === 'exam' ? 0.9 : 1),
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
  if (q.mode === 'mul') {
    st.mn++;
    if (ok) st.mc++;
  } else {
    st.dn++;
    if (ok) st.dc++;
  }
  if (ok) {
    st.c++;
    st.ema = st.ema ? st.ema * 0.65 + t * 0.35 : t;
    st.best = st.best ? Math.min(st.best, t) : t;
    st.lastWrong = false;
    state.totals.ok++;
    state.totals.ema = state.totals.ema ? state.totals.ema * 0.7 + t * 0.3 : t;
    if (t < 2) state.totals.fast++;
    if (q.mode === 'div') state.totals.divOk++;
  } else {
    st.w++;
    st.lastWrong = true;
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
