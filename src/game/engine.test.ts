import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FACTS,
  FKEYS,
  PET_SKINS,
  appendExamDigit,
  backspaceExamInput,
  buildExamQueue,
  calculateGrade,
  calculateQuestionXp,
  checkAchievements,
  chooseMode,
  createDefaultState,
  dayKey,
  esc,
  evaluateTypedAnswer,
  factCurriculumTier,
  factTimeVariance,
  genOptions,
  getAdaptiveCourse,
  getEquippedPetSkin,
  getPetStage,
  getStreakBonus,
  getUnlockedPetSkins,
  isPetSkinUnlocked,
  levelInfo,
  makeQuestion,
  mastery,
  mergeLoadedState,
  needsExamReadinessWarning,
  overallMastery,
  rankFor,
  recordStat,
  spacedIntervalDays,
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

test('pet skins unlock by level and pet stage grows with fed count', () => {
  assert.equal(getUnlockedPetSkins(1).length, 1);
  assert.equal(getUnlockedPetSkins(3).length, 3);
  assert.equal(getUnlockedPetSkins(8).length, PET_SKINS.length);
  assert.equal(isPetSkinUnlocked(PET_SKINS[1], 1), false);
  assert.equal(isPetSkinUnlocked(PET_SKINS[1], 2), true);

  const s = mergeLoadedState({ xp: 0, pet: { fed: 12, skin: 'royal' } });
  assert.equal(s.ambient, true);
  assert.equal(getEquippedPetSkin(s).id, 'meadow');

  s.xp = 1500;
  assert.ok(levelInfo(s.xp).l >= 5);

  assert.equal(getPetStage(0).title, 'Малышка');
  assert.equal(getPetStage(25).title, 'Умняшка');
  assert.equal(getPetStage(105).title, 'Легенда листа');
});

test('adaptive course analyzes response times, variance, spaced intervals, and mode lag', () => {
  const s = createDefaultState();
  const now = new Date(2026, 10, 17, 12, 0, 0).getTime();

  // Fresh state starts on Stage 1 focusing on tier-1 anchor facts
  const initialPlan = getAdaptiveCourse(s, now);
  assert.equal(initialPlan.stage, 1);
  assert.ok(initialPlan.focusPool.every((k) => factCurriculumTier(k) === 1));

  // Steady fast times vs erratic hesitant times
  s.facts['2,2'] = {
    n: 4, c: 4, w: 0, ema: 1.6, best: 1.4, lastWrong: false, seen: now,
    mn: 2, mc: 2, dn: 2, dc: 2, mEma: 1.5, dEma: 1.7,
    lastTimes: [1.5, 1.6, 1.5, 1.7], streak: 4, slowCount: 0,
  };
  s.facts['7,8'] = {
    n: 4, c: 4, w: 0, ema: 3.8, best: 1.9, lastWrong: false, seen: now,
    mn: 2, mc: 2, dn: 2, dc: 2, mEma: 2.0, dEma: 5.5,
    lastTimes: [1.9, 6.2, 2.1, 5.4], streak: 4, slowCount: 2,
  };

  assert.ok(factTimeVariance(s.facts['7,8']) > factTimeVariance(s.facts['2,2']));
  assert.ok(mastery(s, '2,2', now) > mastery(s, '7,8', now));
  assert.ok(spacedIntervalDays(s.facts['2,2']) > spacedIntervalDays(s.facts['7,8']));

  // chooseMode favors division when division EMA lags multiplication EMA significantly
  let divPicks = 0;
  for (let i = 0; i < 200; i++) {
    if (chooseMode(s.facts['7,8']) === 'div') divPicks++;
  }
  assert.ok(divPicks > 115);

  const courseWithSlowFact = getAdaptiveCourse(s, now);
  assert.ok(courseWithSlowFact.focusPool.includes('7,8'));
  assert.ok(courseWithSlowFact.hesitantCount >= 1);
});

test('exam mode omits options, grants a larger timer, and warns below 100% readiness', () => {
  const s = createDefaultState();
  const trainQ = makeQuestion(s, '7,8', 'mul', 'train', 'ТРЕНИРОВКА');
  const examQ = makeQuestion(s, '7,8', 'mul', 'exam', 'ЭКЗАМЕН');

  assert.equal(trainQ.options.length, 4);
  assert.equal(examQ.options.length, 0);
  assert.ok(examQ.limit > trainQ.limit);
  assert.ok(examQ.limit >= 9);

  s.totals.ema = 1.2;
  const fastTrainQ = makeQuestion(s, '2,2', 'mul', 'train', 'ТРЕНИРОВКА');
  const fastExamQ = makeQuestion(s, '2,2', 'mul', 'exam', 'ЭКЗАМЕН');
  assert.ok(fastExamQ.limit > fastTrainQ.limit);
  assert.ok(fastExamQ.limit >= 9);

  assert.equal(needsExamReadinessWarning(0), true);
  assert.equal(needsExamReadinessWarning(99), true);
  assert.equal(needsExamReadinessWarning(100), false);
});

test('exam keypad input handles 1-digit and 2-digit auto-submit, leading zeros, and backspace', () => {
  // Leading zero ignored when empty
  assert.deepEqual(appendExamDigit('', '0', 1), {
    nextInput: '',
    shouldAutoSubmit: false,
    numericValue: null,
  });

  // 1-digit answer auto-submits on first digit
  assert.deepEqual(appendExamDigit('', '6', 1), {
    nextInput: '6',
    shouldAutoSubmit: true,
    numericValue: 6,
  });

  // 2-digit answer waits after first digit, auto-submits on second digit
  const step1 = appendExamDigit('', '5', 2);
  assert.deepEqual(step1, {
    nextInput: '5',
    shouldAutoSubmit: false,
    numericValue: 5,
  });
  assert.equal(backspaceExamInput(step1.nextInput), '');

  const step2 = appendExamDigit(step1.nextInput, '6', 2);
  assert.deepEqual(step2, {
    nextInput: '56',
    shouldAutoSubmit: true,
    numericValue: 56,
  });

  // Allows 0 as second digit (e.g. 20, 40)
  assert.deepEqual(appendExamDigit('4', '0', 2), {
    nextInput: '40',
    shouldAutoSubmit: true,
    numericValue: 40,
  });

  assert.deepEqual(evaluateTypedAnswer('56', 56), { ok: true, value: 56 });
  assert.deepEqual(evaluateTypedAnswer('54', 56), { ok: false, value: 54 });
  assert.deepEqual(evaluateTypedAnswer('', 56), { ok: false, value: null });
});

test('tutorialDone defaults to false, merges cleanly, and streak3 ignores expired streaks', () => {
  const s = createDefaultState();
  assert.equal(s.tutorialDone, false);

  const mergedTrue = mergeLoadedState({ tutorialDone: true });
  assert.equal(mergedTrue.tutorialDone, true);

  const mergedMissing = mergeLoadedState({});
  assert.equal(mergedMissing.tutorialDone, false);

  // Expired streak from 10 days ago should report 0/3 on streak3 achievement until unlocked
  const now = new Date(2026, 10, 18, 12, 0, 0).getTime();
  const tenDaysAgo = dayKey(now - 10 * 864e5);
  s.streak = { day: tenDaysAgo, n: 2 };
  const streakAch = checkAchievements(s, now);
  assert.equal(streakAch.length, 0);

  // Import ACH dynamically via checking displayStreak indirectly:
  // If streak is from yesterday, displayStreak keeps it; if 10 days ago, it is 0
  const streakInfoOld = getStreakBonus(s, now);
  assert.equal(streakInfoOld.streak, 0);
});

