import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, createDefaultState } from './engine';
import {
  EXPORT_FILE_EXTENSION,
  applyStorageSnapshot,
  buildExportFilename,
  createExportPayload,
  parseAndValidateImport,
  readStorageEntries,
  serializeExportPayload,
} from './storageTransfer';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    getItem(k: string) {
      return map.has(k) ? map.get(k)! : null;
    },
    setItem(k: string, v: string) {
      map.set(k, String(v));
    },
    clear() {
      map.clear();
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

test('buildExportFilename includes sanitized student name, date, and .matemagia.export extension', () => {
  const now = new Date(2026, 10, 17, 15, 30, 0).getTime();
  assert.equal(
    buildExportFilename('Алиса', now),
    `matemagia-Алиса-2026-11-17${EXPORT_FILE_EXTENSION}`
  );
  assert.equal(
    buildExportFilename('  Максим / * ?  ', now),
    `matemagia-Максим-2026-11-17${EXPORT_FILE_EXTENSION}`
  );
  assert.equal(
    buildExportFilename('///', now),
    `matemagia-uchenik-2026-11-17${EXPORT_FILE_EXTENSION}`
  );
});

test('export and import round-trip preserves full localStorage and GameState', () => {
  const state = createDefaultState();
  state.name = 'София';
  state.xp = 420;
  state.pet.fed = 15;
  state.pet.skin = 'berry';
  state.totals.ans = 25;
  state.totals.ok = 23;

  const mem = createMemoryStorage({
    [STORAGE_KEY]: JSON.stringify(state),
    custom_theme_flag: 'starlight',
    helper_tip_seen: '1',
  });

  const entries = readStorageEntries(mem);
  const now = new Date(2026, 10, 17, 10, 0, 0).getTime();
  const payload = createExportPayload(entries, state, now);
  const serialized = serializeExportPayload(payload);

  const filename = buildExportFilename(state.name, now);
  const result = parseAndValidateImport(serialized, filename);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.state.name, 'София');
    assert.equal(result.state.xp, 420);
    assert.equal(result.state.pet.skin, 'berry');
    assert.equal(result.storageCount, 3);
    assert.equal(result.payload.storage.custom_theme_flag, 'starlight');

    const targetMem = createMemoryStorage({ stale_key: 'should_be_cleared' });
    applyStorageSnapshot(targetMem, result.payload.storage);
    assert.deepEqual(targetMem.dump(), {
      [STORAGE_KEY]: JSON.stringify(state),
      custom_theme_flag: 'starlight',
      helper_tip_seen: '1',
    });
  }
});

test('parseAndValidateImport rejects wrong extension, invalid JSON, wrong format, and corrupted state', () => {
  const state = createDefaultState();
  const validText = serializeExportPayload(
    createExportPayload({ [STORAGE_KEY]: JSON.stringify(state) }, state, 1700000000000)
  );

  const badExt = parseAndValidateImport(validText, 'backup.json');
  assert.equal(badExt.ok, false);

  const badJson = parseAndValidateImport('{broken json', 'test.matemagia.export');
  assert.equal(badJson.ok, false);

  const foreignJson = parseAndValidateImport(
    JSON.stringify({ hello: 'world' }),
    'test.matemagia.export'
  );
  assert.equal(foreignJson.ok, false);

  const nonStringStorage = parseAndValidateImport(
    JSON.stringify({
      format: 'matemagia-export',
      version: 1,
      exportedAt: 1700000000000,
      storage: { [STORAGE_KEY]: 123 },
    }),
    'test.matemagia.export'
  );
  assert.equal(nonStringStorage.ok, false);

  const corruptXp = parseAndValidateImport(
    JSON.stringify({
      format: 'matemagia-export',
      version: 1,
      exportedAt: 1700000000000,
      storage: {
        [STORAGE_KEY]: JSON.stringify({ ...state, xp: -50 }),
      },
    }),
    'test.matemagia.export'
  );
  assert.equal(corruptXp.ok, false);

  const missingMainKey = parseAndValidateImport(
    JSON.stringify({
      format: 'matemagia-export',
      version: 1,
      exportedAt: 1700000000000,
      storage: { other_key: '1' },
    }),
    'test.matemagia.export'
  );
  assert.equal(missingMainKey.ok, false);
});
