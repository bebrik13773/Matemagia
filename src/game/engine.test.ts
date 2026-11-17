import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FACTS,
  FKEYS,
  buildExamQueue,
  calculateGrade,
  calculateQuestionXp,
  checkAchievements,
  createDefaultState,
  dayKey,
  esc,
  genOptions,
  getStreakBonus,
  levelInfo,
  makeQuestion,
  mastery,
  overallMastery,
  rankFor,
  recordStat,
} from './engine';

test('esc escapes all HTML special characters including single quote without syntax error', () => {
  assert.equal(
    esc(`<script>alert("x'&y")</script>`),
    '&lt;script&gt;alert(&quot;x&#39;&amp;y&quot;)&lt;/script&gt;'
  );
  assert.equal(esc('Ученик'), 'Ученик');
});

test('FACTS contains all 36 unique unordered pairs from 2..9', () => {
  assert.equal(FACTS.length, 36);
  assert.equal(FKEYS.length, 36);
  assert.equal(FKEYS[0], '2,2');
  assert.equal(FKEYS[FKEYS.length - 1], '9,9');
});

test('genOptions always returns 4 distinct positive numbers including the correct answer', () => {
  for (let i = 0; i < 40; i++) {
    const opts = genOptions(24, 'mul', 4, 6, 24);
    assert.equal(opts.length, 4);
    assert.ok(opts.includes(24));
    assert.equal(new Set(opts).size, 4);
    assert.ok(opts.every((v) => Number.isFinite(v) && v > 0));
  }
});

test('recordStat updates mastery, totals, streak, and unlocks first achievement', () => {
  const s = createDefaultState();
  const now = new Date(2026, 10, 17, 12, 0, 0).getTime();
  const q = makeQuestion(s, '6,7', 'mul', 'train', 'НОВОЕ');
  assert.equal(q.ans, 42);
  assert.equal(overallMastery(s, now), 0);

  recordStat(s, q, true, 1.5, now);
  assert.equal(s.totals.ans, 1);
  assert.equal(s.totals.ok, 1);
  assert.equal(s.totals.fast, 1);
  assert.equal(s.streak.n, 1);
  assert.ok(mastery(s, '6,7', now) > 50);

  const unlocked = checkAchievements(s, now);
  assert.ok(unlocked.some((a) => a.id === 'first'));
});

test('levelInfo and rankFor scale cleanly with XP', () => {
  const l1 = levelInfo(0);
  assert.equal(l1.l, 1);
  assert.equal(l1.into, 0);
  assert.equal(rankFor(1).name, 'Искра');

  const l2 = levelInfo(l1.need);
  assert.equal(l2.l, 2);
  assert.equal(l2.into, 0);
});

test('buildExamQueue produces 36 unique facts with alternating mul/div', () => {
  const q = buildExamQueue();
  assert.equal(q.length, 36);
  assert.equal(new Set(q.map((item) => item.k)).size, 36);
  const modes = new Set(q.map((item) => item.mode));
  assert.ok(modes.has('mul') && modes.has('div'));
});

test('calculateQuestionXp and calculateGrade behave as expected', () => {
  assert.equal(calculateQuestionXp('normal', 'train', 5, 10, 1, true), 16);
  assert.equal(calculateQuestionXp('normal', 'train', 5, 10, 1, true, 1.5), 24);
  assert.equal(calculateQuestionXp('normal', 'train', 5, 10, 0, false, 1.5), 2);
  assert.equal(calculateGrade(false, 1, 1), '—');
  assert.equal(calculateGrade(true, 1, 2), 'S');
  assert.equal(calculateGrade(true, 0.5, 5), 'C');
});

test('getStreakBonus grants progressive XP multipliers and badges for returning users', () => {
  const s = createDefaultState();
  const today = new Date(2026, 10, 17, 12, 0, 0).getTime();
  const yesterday = today - 864e5;

  assert.equal(getStreakBonus(s, today).multiplier, 1);
  assert.equal(getStreakBonus(s, today).streak, 0);

  s.streak = { day: dayKey(yesterday), n: 1 };
  const returningDay1 = getStreakBonus(s, today);
  assert.equal(returningDay1.streak, 1);
  assert.equal(returningDay1.practicedToday, false);

  const q = makeQuestion(s, '3,4', 'mul', 'train', 'НОВОЕ');
  recordStat(s, q, true, 2, today);
  const day2 = getStreakBonus(s, today);
  assert.equal(day2.streak, 2);
  assert.equal(day2.practicedToday, true);
  assert.equal(day2.multiplier, 1.1);
  assert.equal(day2.bonusPercent, 10);
  assert.equal(day2.badgeTitle, 'Искра привычки');

  s.streak = { day: dayKey(today), n: 7 };
  const day7 = getStreakBonus(s, today);
  assert.equal(day7.multiplier, 1.5);
  assert.equal(day7.bonusPercent, 50);
  assert.equal(day7.badgeTitle, 'Неделя магии');
  assert.equal(day7.nextTierDays, null);
});
