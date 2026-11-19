import {
  Difficulty,
  GameState,
  STORAGE_KEY,
  mergeLoadedState,
} from './engine';

export const EXPORT_FILE_EXTENSION = '.matemagia.export';
export const EXPORT_FORMAT = 'matemagia-export';
export const EXPORT_VERSION = 1;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export interface ExportPayload {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: number;
  app: 'matemagia';
  storage: Record<string, string>;
}

export type ImportValidationResult =
  | {
      ok: true;
      payload: ExportPayload;
      state: GameState;
      storageCount: number;
      exportedAt: number;
    }
  | {
      ok: false;
      error: string;
    };

const VALID_DIFFS: ReadonlySet<Difficulty> = new Set(['calm', 'normal', 'strict']);
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function buildExportFilename(name: string, now = Date.now()): string {
  const d = new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const datePart = `${yyyy}-${mm}-${dd}`;

  const safeName = String(name || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

  const namePart = safeName || 'uchenik';
  return `matemagia-${namePart}-${datePart}${EXPORT_FILE_EXTENSION}`;
}

export function readStorageEntries(storage: Pick<Storage, 'length' | 'key' | 'getItem'>): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k || FORBIDDEN_KEYS.has(k)) continue;
    const v = storage.getItem(k);
    if (typeof v === 'string') {
      result[k] = v;
    }
  }
  return result;
}

export function createExportPayload(
  storageEntries: Record<string, string>,
  currentState: GameState,
  now = Date.now()
): ExportPayload {
  const cleanStorage: Record<string, string> = {};
  for (const [k, v] of Object.entries(storageEntries)) {
    if (!k || FORBIDDEN_KEYS.has(k)) continue;
    if (typeof v === 'string') {
      cleanStorage[k] = v;
    }
  }
  cleanStorage[STORAGE_KEY] = JSON.stringify(currentState);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now,
    app: 'matemagia',
    storage: cleanStorage,
  };
}

export function serializeExportPayload(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

function validateGameStateShape(raw: unknown): string | null {
  if (!isPlainObject(raw)) {
    return 'Данные профиля в файле повреждены';
  }
  if (typeof raw.name !== 'string') {
    return 'Некорректное имя профиля в файле';
  }
  if (!isNonNegativeFinite(raw.xp)) {
    return 'Некорректное значение опыта (XP) в файле';
  }
  if (typeof raw.sound !== 'boolean') {
    return 'Некорректные настройки звука в файле';
  }
  if (raw.ambient !== undefined && typeof raw.ambient !== 'boolean') {
    return 'Некорректные настройки музыки в файле';
  }
  if (typeof raw.diff !== 'string' || !VALID_DIFFS.has(raw.diff as Difficulty)) {
    return 'Некорректный режим сложности в файле';
  }

  if (!isPlainObject(raw.totals)) {
    return 'Отсутствует или повреждена статистика ответов';
  }
  const totalFields = ['ans', 'ok', 'fast', 'divOk', 'bestCombo', 'ema', 'sessions', 'focusDone'];
  for (const field of totalFields) {
    if (raw.totals[field] !== undefined && !isNonNegativeFinite(raw.totals[field])) {
      return `Повреждено поле статистики (${field})`;
    }
  }

  if (!isPlainObject(raw.facts)) {
    return 'Повреждена статистика по примерам';
  }
  for (const [factKey, factVal] of Object.entries(raw.facts)) {
    if (FORBIDDEN_KEYS.has(factKey) || !isPlainObject(factVal)) {
      return 'Повреждена запись примера в файле';
    }
    if (
      !isNonNegativeFinite(factVal.n) ||
      !isNonNegativeFinite(factVal.c) ||
      !isNonNegativeFinite(factVal.w)
    ) {
      return 'Некорректные счётчики примера в файле';
    }
  }

  if (!isPlainObject(raw.ach)) {
    return 'Повреждён список достижений';
  }
  for (const [achKey, achVal] of Object.entries(raw.ach)) {
    if (FORBIDDEN_KEYS.has(achKey) || !isNonNegativeFinite(achVal)) {
      return 'Некорректная запись достижения';
    }
  }

  if (
    !isPlainObject(raw.streak) ||
    typeof raw.streak.day !== 'string' ||
    !isNonNegativeFinite(raw.streak.n)
  ) {
    return 'Повреждены данные ежедневной серии';
  }

  if (
    !isPlainObject(raw.exam) ||
    !isNonNegativeFinite(raw.exam.tries) ||
    !isNonNegativeFinite(raw.exam.best)
  ) {
    return 'Повреждены данные экзамена';
  }

  if (
    !isPlainObject(raw.pet) ||
    !isNonNegativeFinite(raw.pet.fed) ||
    typeof raw.pet.skin !== 'string'
  ) {
    return 'Повреждены данные питомца';
  }

  if (raw.tutorialDone !== undefined && typeof raw.tutorialDone !== 'boolean') {
    return 'Повреждены данные статуса обучения';
  }

  if (raw.cert !== null && raw.cert !== undefined) {
    if (
      !isPlainObject(raw.cert) ||
      typeof raw.cert.name !== 'string' ||
      typeof raw.cert.id !== 'string' ||
      !isNonNegativeFinite(raw.cert.date) ||
      !isNonNegativeFinite(raw.cert.avg) ||
      !isNonNegativeFinite(raw.cert.mastery)
    ) {
      return 'Повреждены данные сертификата';
    }
  }

  return null;
}

export function parseAndValidateImport(rawText: string, filename?: string): ImportValidationResult {
  if (filename !== undefined && !filename.toLowerCase().endsWith(EXPORT_FILE_EXTENSION)) {
    return {
      ok: false,
      error: `Нужен файл с расширением ${EXPORT_FILE_EXTENSION}`,
    };
  }

  if (typeof rawText !== 'string' || !rawText.trim()) {
    return {
      ok: false,
      error: 'Файл пуст',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: 'Файл повреждён: неверный формат JSON',
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: 'Неверная структура файла экспорта',
    };
  }

  if (parsed.format !== EXPORT_FORMAT || parsed.version !== EXPORT_VERSION) {
    return {
      ok: false,
      error: 'Файл не является совместимым экспортом Матемагии',
    };
  }

  if (!isNonNegativeFinite(parsed.exportedAt) || parsed.exportedAt <= 0) {
    return {
      ok: false,
      error: 'В файле отсутствует корректная дата экспорта',
    };
  }

  if (!isPlainObject(parsed.storage)) {
    return {
      ok: false,
      error: 'В файле отсутствуют данные локального хранилища',
    };
  }

  const validatedStorage: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.storage)) {
    if (!k || FORBIDDEN_KEYS.has(k)) {
      return {
        ok: false,
        error: 'Обнаружен недопустимый ключ в данных хранилища',
      };
    }
    if (typeof v !== 'string') {
      return {
        ok: false,
        error: `Некорректное значение ключа «${k}» в файле`,
      };
    }
    validatedStorage[k] = v;
  }

  const rawGameJson = validatedStorage[STORAGE_KEY];
  if (typeof rawGameJson !== 'string') {
    return {
      ok: false,
      error: `В файле отсутствует основной прогресс (${STORAGE_KEY})`,
    };
  }

  let rawGameState: unknown;
  try {
    rawGameState = JSON.parse(rawGameJson);
  } catch {
    return {
      ok: false,
      error: 'Данные прогресса внутри файла повреждены',
    };
  }

  const shapeError = validateGameStateShape(rawGameState);
  if (shapeError) {
    return {
      ok: false,
      error: shapeError,
    };
  }

  const state = mergeLoadedState(rawGameState as Partial<GameState>);
  const payload: ExportPayload = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: parsed.exportedAt,
    app: 'matemagia',
    storage: validatedStorage,
  };

  return {
    ok: true,
    payload,
    state,
    storageCount: Object.keys(validatedStorage).length,
    exportedAt: parsed.exportedAt,
  };
}

export function applyStorageSnapshot(
  storage: Pick<Storage, 'clear' | 'setItem'>,
  snapshot: Record<string, string>
): void {
  storage.clear();
  for (const [k, v] of Object.entries(snapshot)) {
    if (!k || FORBIDDEN_KEYS.has(k)) continue;
    storage.setItem(k, v);
  }
}
