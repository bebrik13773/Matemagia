import test from 'node:test';
import assert from 'node:assert/strict';
import { ACH, createDefaultState, dayKey } from './engine';
import { TOUR_STEPS, computeTourCardPlacement } from './tour';

test('TOUR_STEPS covers all screens, caterpillar home, and unique step IDs', () => {
  assert.ok(TOUR_STEPS.length >= 10);
  const ids = new Set(TOUR_STEPS.map((s) => s.id));
  assert.equal(ids.size, TOUR_STEPS.length);

  const screens = new Set(TOUR_STEPS.map((s) => s.screen));
  assert.ok(screens.has('hub'));
  assert.ok(screens.has('pet'));
  assert.ok(screens.has('map'));
  assert.ok(screens.has('exam'));
  assert.ok(screens.has('ach'));

  for (const step of TOUR_STEPS) {
    assert.ok(step.selector.length > 0);
    assert.ok(step.title.length > 0);
    assert.ok(step.text.length > 0);
  }
});

test('computeTourCardPlacement keeps card within viewport on desktop and mobile', () => {
  // Desktop target near top -> placed below
  const desktopTop = computeTourCardPlacement(
    { top: 90, left: 40, width: 520, height: 280, right: 560, bottom: 370 },
    1440,
    900
  );
  assert.equal(desktopTop.mode, 'below');
  assert.ok(desktopTop.top !== undefined && desktopTop.top >= 370);
  assert.ok(desktopTop.left >= 18 && desktopTop.left + desktopTop.width <= 1440 - 18);

  // Desktop target near bottom (#bottomnav) -> placed above
  const desktopBottom = computeTourCardPlacement(
    { top: 834, left: 200, width: 800, height: 66, right: 1000, bottom: 900 },
    1440,
    900
  );
  assert.equal(desktopBottom.mode, 'above');
  assert.ok(desktopBottom.bottom !== undefined && desktopBottom.bottom >= 66);

  // Mobile target in bottom half -> docked top
  const mobileBottom = computeTourCardPlacement(
    { top: 750, left: 10, width: 370, height: 70, right: 380, bottom: 820 },
    390,
    844
  );
  assert.equal(mobileBottom.mode, 'docked-top');
  assert.equal(mobileBottom.top, 72);

  // Mobile target in top half -> docked bottom
  const mobileTop = computeTourCardPlacement(
    { top: 75, left: 10, width: 370, height: 180, right: 380, bottom: 255 },
    390,
    844
  );
  assert.equal(mobileTop.mode, 'docked-bottom');
  assert.equal(mobileTop.bottom, 14);
});

test('streak3 achievement progress uses active streak unless already unlocked', () => {
  const streak3 = ACH.find((a) => a.id === 'streak3')!;
  const s = createDefaultState();
  const now = Date.now();
  const tenDaysAgo = dayKey(now - 10 * 864e5);

  s.streak = { day: tenDaysAgo, n: 2 };
  assert.deepEqual(streak3.p(s), [0, 3]);

  s.ach.streak3 = now - 1000;
  assert.deepEqual(streak3.p(s), [3, 3]);
});
