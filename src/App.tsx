import { useCallback, useEffect, useRef, useState } from 'react';
import { AchScreen } from './components/AchScreen';
import { ActiveFeedback, GameScreen } from './components/GameScreen';
import { HubScreen } from './components/HubScreen';
import { MapScreen } from './components/MapScreen';
import {
  CertModal,
  ConfirmModal,
  ExamModal,
  LevelModal,
  NameModal,
  PauseModal,
} from './components/Overlays';
import { ResultsScreen, SessionSummary } from './components/ResultsScreen';
import { PetScreen } from './components/PetScreen';
import { ExamScreen } from './components/ExamScreen';
import { StarfieldFx, StarfieldFxHandle } from './components/StarfieldFx';
import { ensureAudio, setAmbientEnabled, setSoundEnabled, sfx } from './game/audio';
import {
  COLORS,
  Difficulty,
  FKEYS,
  GameState,
  PET_SKINS,
  PRAISE,
  Question,
  QuestionMode,
  QuestionResult,
  SessionMode,
  STORAGE_KEY,
  buildExamQueue,
  calculateGrade,
  calculateQuestionXp,
  certId,
  checkAchievements,
  chooseMode,
  cloneState,
  createDefaultState,
  displayStreak,
  fmtDate,
  getEquippedPetSkin,
  getStreakBonus,
  levelInfo,
  makeQuestion,
  mergeLoadedState,
  pickFact,
  rankFor,
  recordStat,
  rndi,
  snapshotMastery,
} from './game/engine';
import {
  MAX_IMPORT_FILE_BYTES,
  applyStorageSnapshot,
  buildExportFilename,
  createExportPayload,
  parseAndValidateImport,
  readStorageEntries,
  serializeExportPayload,
} from './game/storageTransfer';

type Screen = 'hub' | 'pet' | 'map' | 'exam' | 'ach' | 'game' | 'results';

interface ToastItem {
  id: number;
  icon: string;
  title: string;
  sub: string;
  type?: 'ach';
}

interface ActiveSession {
  token: number;
  mode: SessionMode;
  count: number;
  index: number;
  answered: number;
  ok: number;
  xp: number;
  combo: number;
  bestCombo: number;
  times: number[];
  results: QuestionResult[];
  recent: string[];
  focus: string[] | null;
  paused: boolean;
  question: Question;
  feedback: ActiveFeedback | null;
  before: { m: Record<string, number>; overall: number };
  queue: Array<{ k: string; mode: QuestionMode }> | null;
}

function loadSavedState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return mergeLoadedState(JSON.parse(raw) as Partial<GameState>);
    }
  } catch {
    // Ignore parse/storage errors
  }
  return createDefaultState();
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => loadSavedState());
  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  const [screen, setScreen] = useState<Screen>('hub');
  const [selectedMapKey, setSelectedMapKey] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<QuestionMode>('mul');
  const [session, setSession] = useState<ActiveSession | null>(null);
  const sessionRef = useRef<ActiveSession | null>(null);
  sessionRef.current = session;

  const [resultsSummary, setResultsSummary] = useState<SessionSummary | null>(null);

  const [pauseOpen, setPauseOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ text: string; cb: () => void } | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeqRef = useRef(0);
  const storageWarnedRef = useRef(false);
  const tokenSeqRef = useRef(0);
  const advanceTimerRef = useRef<number | null>(null);
  const pendingLevelRef = useRef<number | null>(null);
  const questionShownAtRef = useRef<number>(performance.now());

  const fxRef = useRef<StarfieldFxHandle | null>(null);
  const tbLevelRef = useRef<HTMLDivElement | null>(null);
  const comboBadgeRef = useRef<HTMLSpanElement | null>(null);

  const modalOpen =
    pauseOpen ||
    Boolean(confirmState) ||
    nameModalOpen ||
    examModalOpen ||
    Boolean(levelUpModal) ||
    certModalOpen;

  const pushToast = useCallback((icon: string, title: string, sub: string, type?: 'ach') => {
    const id = ++toastSeqRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, icon, title, sub, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const persistState = useCallback(
    (next: GameState) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        if (!storageWarnedRef.current) {
          storageWarnedRef.current = true;
          pushToast('⚠️', 'Не удалось сохранить', 'Браузер блокирует хранилище');
        }
      }
    },
    [pushToast]
  );

  useEffect(() => {
    setSoundEnabled(gameState.sound);
  }, [gameState.sound]);

  useEffect(() => {
    setAmbientEnabled(gameState.ambient);
  }, [gameState.ambient]);

  useEffect(() => {
    const onPointerDown = () => {
      ensureAudio();
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const navigateTo = useCallback((target: Screen) => {
    setScreen(target);
    window.scrollTo(0, 0);
  }, []);

  const buildNextQuestion = useCallback(
    (
      st: GameState,
      mode: SessionMode,
      index: number,
      queue: Array<{ k: string; mode: QuestionMode }> | null,
      focus: string[] | null,
      recent: string[]
    ): { question: Question; nextRecent: string[] } => {
      let k: string;
      let qMode: QuestionMode;
      let tag: string;
      if (mode === 'exam' && queue) {
        const item = queue[index];
        k = item.k;
        qMode = item.mode;
        tag = 'ЭКЗАМЕН';
      } else {
        const pick = pickFact(st, focus || FKEYS, recent);
        k = pick.k;
        tag = pick.tag;
        qMode = chooseMode(st.facts[k]);
      }
      const nextRecent = [...recent, k];
      if (nextRecent.length > 3) nextRecent.shift();
      return {
        question: makeQuestion(st, k, qMode, mode, tag),
        nextRecent,
      };
    },
    []
  );

  const startSession = useCallback(
    (cfg: { mode: SessionMode; count: number; facts?: string[] }) => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      const st = stateRef.current;
      const queue = cfg.mode === 'exam' ? buildExamQueue() : null;
      const focus = cfg.facts || null;
      const { question, nextRecent } = buildNextQuestion(st, cfg.mode, 0, queue, focus, []);
      const nextSession: ActiveSession = {
        token: ++tokenSeqRef.current,
        mode: cfg.mode,
        count: cfg.count,
        index: 0,
        answered: 0,
        ok: 0,
        xp: 0,
        combo: 0,
        bestCombo: 0,
        times: [],
        results: [],
        recent: nextRecent,
        focus,
        paused: false,
        question,
        feedback: null,
        before: snapshotMastery(st),
        queue,
      };
      setPauseOpen(false);
      questionShownAtRef.current = performance.now();
      setSession(nextSession);
      navigateTo('game');
    },
    [buildNextQuestion, navigateTo]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startSession({ mode: 'train', count: 12 });
    }
  }, [startSession]);

  const finishSession = useCallback(
    (curSession: ActiveSession) => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      setPauseOpen(false);
      setSession(null);

      const nextState = cloneState(stateRef.current);
      nextState.totals.sessions++;

      const answered = curSession.answered;
      const ok = curSession.ok;
      const acc = answered ? ok / answered : 0;
      const avg = curSession.times.length
        ? curSession.times.reduce((s, v) => s + v, 0) / curSession.times.length
        : 0;
      const best = curSession.times.length ? Math.min(...curSession.times) : 0;
      const after = snapshotMastery(nextState);
      const improved = FKEYS.map((k) => ({ k, d: after.m[k] - curSession.before.m[k] }))
        .filter((o) => o.d > 2)
        .sort((x, y) => y.d - x.d)
        .slice(0, 4);

      const failed: QuestionResult[] = [];
      const seenF = new Set<string>();
      curSession.results.forEach((r) => {
        if (!r.ok && !seenF.has(r.k)) {
          seenF.add(r.k);
          failed.push(r);
        }
      });

      const complete = answered >= curSession.count;
      let perfect = false;
      if (curSession.mode === 'exam' && complete) {
        nextState.exam.tries++;
        nextState.exam.best = Math.max(nextState.exam.best, ok);
        nextState.exam.last = { ok, date: Date.now() };
        perfect = ok === curSession.count;
        if (perfect) {
          const cd = {
            name: nextState.name,
            date: Date.now(),
            avg,
            mastery: after.overall,
            id: nextState.cert ? nextState.cert.id : certId(),
          };
          if (!nextState.cert || avg < nextState.cert.avg) {
            nextState.cert = cd;
          }
        }
      }
      if (curSession.mode === 'focus' && complete) {
        nextState.totals.focusDone = 1;
      }

      const unlocked = checkAchievements(nextState);
      unlocked.forEach((item, idx) => {
        window.setTimeout(() => {
          pushToast(item.icon, 'Достижение!', item.t, 'ach');
          sfx.ach();
        }, idx * 500);
      });

      setGameState(nextState);
      persistState(nextState);

      const grade = calculateGrade(complete, acc, avg);
      setResultsSummary({
        mode: curSession.mode,
        count: curSession.count,
        answered,
        ok,
        xp: curSession.xp,
        acc,
        avg,
        best,
        overallAfter: after.overall,
        overallDelta: after.overall - curSession.before.overall,
        improved,
        failed,
        complete,
        perfect,
        grade,
      });
      navigateTo('results');

      if (pendingLevelRef.current) {
        const lv = pendingLevelRef.current;
        pendingLevelRef.current = null;
        window.setTimeout(() => {
          setLevelUpModal(lv);
          fxRef.current?.burst(window.innerWidth / 2, window.innerHeight / 2, {
            n: 60,
            colors: [COLORS.gold, COLORS.amber, COLORS.magenta, COLORS.cyan],
          });
        }, 500);
      }

      if (perfect) {
        sfx.fanfare();
        fxRef.current?.confetti();
        window.setTimeout(() => {
          setCertModalOpen(true);
        }, 1100);
      }
    },
    [navigateTo, persistState, pushToast]
  );

  const advanceQuestion = useCallback(
    (curSession: ActiveSession) => {
      const nextIndex = curSession.index + 1;
      if (nextIndex >= curSession.count) {
        finishSession(curSession);
        return;
      }
      const { question, nextRecent } = buildNextQuestion(
        stateRef.current,
        curSession.mode,
        nextIndex,
        curSession.queue,
        curSession.focus,
        curSession.recent
      );
      questionShownAtRef.current = performance.now();
      setSession({
        ...curSession,
        index: nextIndex,
        question,
        recent: nextRecent,
        feedback: null,
      });
    },
    [buildNextQuestion, finishSession]
  );

  const handleAnswer = useCallback(
    (idx: number | null, elapsed: number, tileRect?: DOMRect) => {
      const cur = sessionRef.current;
      if (!cur || cur.feedback || cur.paused || modalOpen) return;

      const q = cur.question;
      const ok = idx !== null && q.options[idx] === q.ans;
      const nextState = cloneState(stateRef.current);
      const streakBefore = displayStreak(nextState);
      const dayBefore = nextState.streak.day;

      recordStat(nextState, q, ok, ok ? elapsed : q.limit);

      const streakInfo = getStreakBonus(nextState);
      if (nextState.streak.day !== dayBefore && streakInfo.streak >= 2 && streakInfo.streak > streakBefore) {
        pushToast(
          streakInfo.badgeEmoji,
          `Серия ${streakInfo.streak} дн.!`,
          `${streakInfo.badgeTitle} · бонус +${streakInfo.bonusPercent}% XP`
        );
      }

      let nextCombo = cur.combo;
      let nextBestCombo = cur.bestCombo;
      let nextOk = cur.ok;
      const nextTimes = [...cur.times];
      const tLeft = Math.max(0, q.limit - elapsed);

      if (ok) {
        nextOk++;
        nextCombo++;
        nextBestCombo = Math.max(nextBestCombo, nextCombo);
        nextState.totals.bestCombo = Math.max(nextState.totals.bestCombo, nextCombo);
        nextTimes.push(elapsed);
      } else {
        nextCombo = 0;
      }

      const gained = calculateQuestionXp(
        nextState.diff,
        cur.mode,
        tLeft,
        q.limit,
        nextCombo,
        ok,
        streakInfo.multiplier
      );

      const levelBefore = levelInfo(nextState.xp).l;
      nextState.xp += gained;
      const levelAfter = levelInfo(nextState.xp).l;

      if (levelAfter > levelBefore) {
        pendingLevelRef.current = Math.max(pendingLevelRef.current || 0, levelAfter);
        sfx.level();
        pushToast('⬆️', 'Новый уровень!', `Ур. ${levelAfter} — ${rankFor(levelAfter).name}`);
        const newSkins = PET_SKINS.filter(
          (s) => s.unlockLevel > levelBefore && s.unlockLevel <= levelAfter
        );
        newSkins.forEach((skin, idx) => {
          window.setTimeout(() => {
            pushToast(skin.icon, 'Новый скин гусеницы!', `${skin.name} · Ур. ${skin.unlockLevel}`);
          }, (idx + 1) * 450);
        });
        if (tbLevelRef.current) {
          const r = tbLevelRef.current.getBoundingClientRect();
          fxRef.current?.burst(r.left + r.width / 2, r.top + r.height / 2, {
            n: 20,
            colors: [COLORS.gold, COLORS.amber, COLORS.magenta],
          });
        }
      }

      if (ok) {
        nextState.pet.fed = (nextState.pet.fed || 0) + 1;
        sfx.ok(nextCombo);
        sfx.munch();
        if (tileRect) {
          fxRef.current?.burst(tileRect.left + tileRect.width / 2, tileRect.top + tileRect.height / 2, {
            n: 26,
            colors: [COLORS.lime, COLORS.cyan, COLORS.amber, '#ffffff'],
          });
        }
        if (nextCombo % 5 === 0) {
          sfx.combo();
          if (comboBadgeRef.current) {
            const cr = comboBadgeRef.current.getBoundingClientRect();
            fxRef.current?.burst(cr.left + cr.width / 2, cr.top + cr.height / 2, {
              n: 18,
              colors: [COLORS.amber, COLORS.magenta, '#ff9d3d'],
            });
          }
        }
      } else if (idx === null) {
        sfx.timeout();
      } else {
        sfx.bad();
      }

      const unlocked = checkAchievements(nextState);
      unlocked.forEach((item, i) => {
        window.setTimeout(() => {
          pushToast(item.icon, 'Достижение!', item.t, 'ach');
          sfx.ach();
        }, i * 500);
      });

      setGameState(nextState);
      persistState(nextState);

      const fbText = ok
        ? `${PRAISE[rndi(0, PRAISE.length - 1)]} +${gained} XP${
            streakInfo.bonusPercent > 0 ? ` · ${streakInfo.badgeEmoji}+${streakInfo.bonusPercent}%` : ''
          }`
        : '';

      const updatedSession: ActiveSession = {
        ...cur,
        answered: cur.answered + 1,
        ok: nextOk,
        xp: cur.xp + gained,
        combo: nextCombo,
        bestCombo: nextBestCombo,
        times: nextTimes,
        results: [
          ...cur.results,
          {
            k: q.k,
            ok,
            t: elapsed,
            timeout: idx === null,
            eq: `${q.x} ${q.sym} ${q.y}`,
            ans: q.ans,
            mode: q.mode,
          },
        ],
        feedback: {
          ok,
          timeout: idx === null,
          pickedIdx: idx,
          text: fbText,
        },
      };

      setSession(updatedSession);
      const tok = updatedSession.token;
      advanceTimerRef.current = window.setTimeout(() => {
        if (sessionRef.current && sessionRef.current.token === tok) {
          advanceQuestion(sessionRef.current);
        }
      }, ok ? 950 : 1900);
    },
    [advanceQuestion, modalOpen, persistState, pushToast]
  );

  const finishToHub = useCallback(
    (target: Screen = 'hub') => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      setSession(null);
      setPauseOpen(false);
      persistState(stateRef.current);
      navigateTo(target);
    },
    [navigateTo, persistState]
  );

  const requestNav = useCallback(
    (target: Screen) => {
      if (sessionRef.current) {
        const label =
          target === 'pet'
            ? 'Прервать занятие и открыть питомца? Ответы сохранятся.'
            : target === 'map'
              ? 'Прервать занятие и открыть карту? Ответы сохранятся.'
              : target === 'exam'
                ? 'Прервать занятие и перейти к финальному тесту? Ответы сохранятся.'
                : target === 'ach'
                  ? 'Прервать занятие и открыть достижения? Ответы сохранятся.'
                  : 'Прервать занятие и вернуться в штаб? Ответы сохранятся.';
        setConfirmState({
          text: label,
          cb: () => finishToHub(target),
        });
      } else {
        if (target !== 'hub') sfx.click();
        navigateTo(target);
      }
    },
    [finishToHub, navigateTo]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState) {
          setConfirmState(null);
          e.preventDefault();
          return;
        }
        if (pauseOpen) {
          setPauseOpen(false);
          setSession((s) => (s ? { ...s, paused: false } : null));
          e.preventDefault();
          return;
        }
        if (nameModalOpen) {
          setNameModalOpen(false);
          e.preventDefault();
          return;
        }
        if (examModalOpen) {
          setExamModalOpen(false);
          e.preventDefault();
          return;
        }
        if (levelUpModal) {
          setLevelUpModal(null);
          e.preventDefault();
          return;
        }
        if (certModalOpen) {
          setCertModalOpen(false);
          e.preventDefault();
          return;
        }
        if (sessionRef.current && !sessionRef.current.feedback && !sessionRef.current.paused) {
          setSession((s) => (s ? { ...s, paused: true } : null));
          setPauseOpen(true);
        }
        return;
      }

      if (modalOpen) return;
      const cur = sessionRef.current;
      if (!cur || screen !== 'game') return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const tiles = document.querySelectorAll<HTMLButtonElement>('#answers .tile');
        const correctIdx = cur.question.options.indexOf(cur.question.ans);
        const rect = tiles[correctIdx]?.getBoundingClientRect();
        const elapsed = Math.min(
          cur.question.limit,
          Math.max(0.05, (performance.now() - questionShownAtRef.current) / 1000)
        );
        handleAnswer(idx, elapsed, rect);
        e.preventDefault();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (cur.feedback && advanceTimerRef.current) {
          clearTimeout(advanceTimerRef.current);
          advanceTimerRef.current = null;
          advanceQuestion(cur);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    advanceQuestion,
    certModalOpen,
    confirmState,
    examModalOpen,
    handleAnswer,
    levelUpModal,
    modalOpen,
    nameModalOpen,
    pauseOpen,
    screen,
  ]);

  const downloadCert = () => {
    const c = gameState.cert;
    if (!c) return;
    try {
      const w = 1600;
      const h = 1131;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const x = cv.getContext('2d');
      if (!x) return;
      const bg = x.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1d1548');
      bg.addColorStop(0.6, '#0e0a26');
      bg.addColorStop(1, '#170f38');
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);
      x.lineWidth = 6;
      x.strokeStyle = '#f5c451';
      x.strokeRect(28, 28, w - 56, h - 56);
      x.textAlign = 'center';
      x.font = '700 30px sans-serif';
      x.fillStyle = '#b9aee0';
      x.fillText('✦ АКАДЕМИЯ МАТЕМАГИИ ✦', w / 2, 140);
      x.font = '900 108px sans-serif';
      x.fillStyle = '#f5c451';
      x.fillText('СЕРТИФИКАТ', w / 2, 268);
      x.font = '800 34px sans-serif';
      x.fillStyle = '#f4eeff';
      x.fillText('о полном усвоении таблицы умножения и деления', w / 2, 330);
      x.font = '700 28px sans-serif';
      x.fillStyle = '#8d80b8';
      x.fillText('награждается', w / 2, 412);
      x.font = '900 84px sans-serif';
      x.fillStyle = '#22d3ee';
      x.fillText(c.name, w / 2, 505);
      x.font = '800 30px sans-serif';
      x.fillStyle = '#b9aee0';
      x.fillText(
        'за идеальный выпускной экзамен: 36 из 36 примеров без единой ошибки',
        w / 2,
        600
      );
      const a = document.createElement('a');
      a.download = 'sertifikat-matemagia.png';
      a.href = cv.toDataURL('image/png');
      a.click();
      pushToast('📥', 'Сохранено', 'PNG сертификата скачан');
    } catch {
      pushToast('⚠️', 'Не получилось', 'Попробуй ещё раз');
    }
  };

  const handleExportProgress = useCallback(() => {
    try {
      const current = stateRef.current;
      let entries: Record<string, string> = {};
      try {
        entries = readStorageEntries(window.localStorage);
      } catch {
        entries = {};
      }
      const now = Date.now();
      const payload = createExportPayload(entries, current, now);
      const content = serializeExportPayload(payload);
      const filename = buildExportFilename(current.name, now);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      sfx.click();
      pushToast('📥', 'Прогресс экспортирован', filename);
    } catch {
      sfx.bad();
      pushToast('⚠️', 'Ошибка экспорта', 'Не удалось создать файл');
    }
  }, [pushToast]);

  const handleImportFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        sfx.bad();
        pushToast('⚠️', 'Ошибка импорта', 'Файл слишком большой (макс. 5 МБ)');
        return;
      }

      let rawText = '';
      try {
        rawText = await file.text();
      } catch {
        sfx.bad();
        pushToast('⚠️', 'Ошибка импорта', 'Не удалось прочитать файл');
        return;
      }

      const check = parseAndValidateImport(rawText, file.name);
      if (!check.ok) {
        sfx.bad();
        pushToast('⚠️', 'Файл не подходит', check.error);
        return;
      }

      sfx.click();
      setConfirmState({
        text: `Импортировать прогресс из файла от ${fmtDate(check.exportedAt)}? Профиль: «${check.state.name}», ${check.state.xp} XP (ключей хранилища: ${check.storageCount}). Текущий прогресс будет заменён.`,
        cb: () => {
          try {
            applyStorageSnapshot(window.localStorage, check.payload.storage);
          } catch {
            pushToast('⚠️', 'Ошибка хранилища', 'Браузер блокирует запись в localStorage');
            return;
          }
          setGameState(check.state);
          setSoundEnabled(check.state.sound);
          setAmbientEnabled(check.state.ambient);
          setSelectedMapKey(null);
          pendingLevelRef.current = null;
          sfx.level();
          pushToast('📤', 'Прогресс импортирован', `${check.state.name} · ${check.state.xp} XP`);
        },
      });
    },
    [pushToast]
  );

  const li = levelInfo(gameState.xp);
  const rk = rankFor(li.l);
  const streakN = displayStreak(gameState);

  return (
    <>
      <StarfieldFx ref={fxRef} />

      <header id="topbar">
        <button
          type="button"
          className="brand"
          aria-label="В штаб"
          onClick={() => requestNav('hub')}
        >
          <span className="brand-star">✦</span>МАТЕМАГИЯ
        </button>
        <div className="tb-right">
          <div className="tb-chip" id="tbLevel" ref={tbLevelRef}>
            <b>Ур. {li.l}</b>
            <span className="rank-name">· {rk.name}</span>
            <span className="mini-bar">
              <i style={{ width: `${Math.round((li.into / li.need) * 100)}%` }} />
            </span>
          </div>
          {streakN > 0 && (
            <div className="tb-chip streak" id="tbStreak">
              🔥 {streakN}
            </div>
          )}
          <button
            type="button"
            className={`icon-btn ${gameState.ambient && gameState.sound ? '' : 'muted'}`}
            id="ambientBtn"
            aria-label={gameState.ambient ? 'Выключить фоновую музыку' : 'Включить фоновую музыку'}
            aria-pressed={gameState.ambient}
            title={gameState.ambient ? 'Фоновая музыка вкл.' : 'Фоновая музыка выкл.'}
            onClick={() => {
              ensureAudio();
              const nextAmbient = !gameState.ambient;
              const next = { ...gameState, ambient: nextAmbient };
              setAmbientEnabled(nextAmbient);
              setGameState(next);
              persistState(next);
              if (gameState.sound) sfx.click();
              pushToast(
                nextAmbient ? '🎵' : '🔕',
                nextAmbient ? 'Фоновая музыка включена' : 'Фоновая музыка выключена',
                nextAmbient && !gameState.sound ? 'Включи общий звук (🔊), чтобы слышать' : ''
              );
            }}
          >
            {gameState.ambient ? '🎵' : '🔕'}
          </button>
          <button
            type="button"
            className={`icon-btn ${gameState.sound ? '' : 'muted'}`}
            id="soundBtn"
            aria-label={gameState.sound ? 'Выключить звук' : 'Включить звук'}
            onClick={() => {
              const nextSound = !gameState.sound;
              const next = { ...gameState, sound: nextSound };
              setSoundEnabled(nextSound);
              setGameState(next);
              persistState(next);
              if (nextSound) sfx.click();
              pushToast(
                nextSound ? '🔊' : '🔇',
                nextSound ? 'Звук включён' : 'Звук выключен',
                ''
              );
            }}
          >
            {gameState.sound ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <main id="app">
        {screen === 'hub' && (
          <HubScreen
            state={gameState}
            onStartCourse={(focusPool) => {
              sfx.click();
              startSession({ mode: 'train', count: 12, facts: focusPool });
            }}
            onTrain={() => {
              sfx.click();
              startSession({ mode: 'train', count: 12 });
            }}
            onCertOpen={() => {
              sfx.click();
              setCertModalOpen(true);
              fxRef.current?.burst(window.innerWidth / 2, window.innerHeight * 0.3, {
                n: 40,
                colors: [COLORS.gold, COLORS.amber, COLORS.cyan],
              });
            }}
            onDiffChange={(diff: Difficulty) => {
              const next = { ...gameState, diff };
              setGameState(next);
              persistState(next);
              sfx.click();
            }}
            onFocusWeak={(keys) => {
              sfx.click();
              startSession({ mode: 'focus', count: 10, facts: keys });
            }}
            onEditName={() => setNameModalOpen(true)}
            onExport={handleExportProgress}
            onImportFile={(file) => {
              void handleImportFile(file);
            }}
            onReset={() => {
              setConfirmState({
                text: 'Стереть весь прогресс, достижения и сертификат? Это необратимо.',
                cb: () => {
                  const fresh = createDefaultState();
                  setGameState(fresh);
                  persistState(fresh);
                  setSelectedMapKey(null);
                  pendingLevelRef.current = null;
                  navigateTo('hub');
                  pushToast('🧹', 'Прогресс сброшен', 'Начинаем с чистого листа');
                },
              });
            }}
          />
        )}

        {screen === 'pet' && (
          <PetScreen
            state={gameState}
            onSelectPetSkin={(skinId: string) => {
              const next = { ...gameState, pet: { ...gameState.pet, skin: skinId } };
              setGameState(next);
              persistState(next);
              sfx.click();
              const chosen = PET_SKINS.find((s) => s.id === skinId);
              if (chosen) {
                pushToast(chosen.icon, 'Скин гусеницы надет!', chosen.name);
              }
            }}
            onTrain={() => {
              sfx.click();
              startSession({ mode: 'train', count: 12 });
            }}
            onBackToHub={() => requestNav('hub')}
          />
        )}

        {screen === 'map' && (
          <MapScreen
            state={gameState}
            selectedKey={selectedMapKey}
            mapMode={mapMode}
            onSelectKey={(k) => {
              setSelectedMapKey(k);
              sfx.click();
            }}
            onToggleMapMode={() => {
              setMapMode((m) => (m === 'mul' ? 'div' : 'mul'));
              sfx.click();
            }}
            onBackToHub={() => requestNav('hub')}
            onFocusFact={(k) => {
              sfx.click();
              startSession({ mode: 'focus', count: 10, facts: [k] });
            }}
          />
        )}

        {screen === 'exam' && (
          <ExamScreen
            state={gameState}
            onStartExam={(name) => {
              if (name && name !== gameState.name) {
                const next = { ...gameState, name };
                setGameState(next);
                persistState(next);
              }
              sfx.click();
              startSession({ mode: 'exam', count: 36 });
            }}
            onCertOpen={() => {
              sfx.click();
              setCertModalOpen(true);
            }}
            onFocusWeak={(keys) => {
              sfx.click();
              startSession({ mode: 'focus', count: 10, facts: keys });
            }}
            onBackToHub={() => requestNav('hub')}
          />
        )}

        {screen === 'ach' && (
          <AchScreen state={gameState} onBackToHub={() => requestNav('hub')} />
        )}

        {screen === 'game' && session && (
          <GameScreen
            mode={session.mode}
            index={session.index}
            count={session.count}
            combo={session.combo}
            sessionXp={session.xp}
            question={session.question}
            feedback={session.feedback}
            paused={session.paused}
            modalOpen={modalOpen}
            petSkin={getEquippedPetSkin(gameState)}
            petFed={gameState.pet.fed}
            onAnswer={handleAnswer}
            onPause={() => {
              if (!session.feedback && !session.paused) {
                setSession({ ...session, paused: true });
                setPauseOpen(true);
              }
            }}
            onQuit={() => {
              setConfirmState({
                text: 'Завершить занятие досрочно? Ответы сохранятся.',
                cb: () => {
                  if (sessionRef.current) finishSession(sessionRef.current);
                },
              });
            }}
            onTickWarning={() => sfx.tick()}
            comboRef={comboBadgeRef}
          />
        )}

        {screen === 'results' && resultsSummary && (
          <ResultsScreen
            summary={resultsSummary}
            onCertOpen={() => {
              sfx.click();
              setCertModalOpen(true);
            }}
            onFocusErrors={(keys) => {
              sfx.click();
              startSession({ mode: 'focus', count: 10, facts: keys });
            }}
            onTrainAgain={() => {
              sfx.click();
              startSession({ mode: 'train', count: 12 });
            }}
            onBackToHub={() => navigateTo('hub')}
          />
        )}
      </main>

      <nav id="bottomnav" className={screen === 'game' ? 'hidden' : ''} aria-label="Навигация">
        <button
          type="button"
          className={`nav-btn ${screen === 'hub' ? 'active' : ''}`}
          onClick={() => requestNav('hub')}
        >
          <span className="ni">🏠</span>Штаб
        </button>
        <button
          type="button"
          className={`nav-btn ${screen === 'pet' ? 'active' : ''}`}
          onClick={() => requestNav('pet')}
        >
          <span className="ni">🐛</span>Питомец
        </button>
        <button
          type="button"
          className={`nav-btn ${screen === 'map' ? 'active' : ''}`}
          onClick={() => requestNav('map')}
        >
          <span className="ni">🗺️</span>Карта
        </button>
        <button
          type="button"
          className={`nav-btn ${screen === 'exam' ? 'active' : ''}`}
          onClick={() => requestNav('exam')}
        >
          <span className="ni">🎓</span>Экзамен
        </button>
        <button
          type="button"
          className={`nav-btn ${screen === 'ach' ? 'active' : ''}`}
          onClick={() => requestNav('ach')}
        >
          <span className="ni">🏆</span>Награды
        </button>
      </nav>

      <div id="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'ach' ? 't-ach' : ''}`}>
            <span className="ti">{t.icon}</span>
            <span>
              <span className="tt">{t.title}</span>
              {t.sub && (
                <>
                  <br />
                  <span className="ts">{t.sub}</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      <PauseModal
        open={pauseOpen}
        onResume={() => {
          sfx.click();
          setPauseOpen(false);
          setSession((s) => (s ? { ...s, paused: false } : null));
        }}
        onQuit={() => {
          setConfirmState({
            text: 'Завершить занятие досрочно? Ответы сохранятся.',
            cb: () => {
              if (sessionRef.current) finishSession(sessionRef.current);
            },
          });
        }}
      />

      <ConfirmModal
        text={confirmState ? confirmState.text : null}
        onConfirm={() => {
          const cb = confirmState?.cb;
          setConfirmState(null);
          if (cb) cb();
        }}
        onCancel={() => setConfirmState(null)}
      />

      <NameModal
        open={nameModalOpen}
        initialName={gameState.name}
        onSave={(name) => {
          const next = { ...gameState, name };
          setGameState(next);
          persistState(next);
          setNameModalOpen(false);
          pushToast('👤', 'Имя сохранено', name);
        }}
        onClose={() => setNameModalOpen(false)}
      />

      <ExamModal
        open={examModalOpen}
        initialName={gameState.name}
        onStart={(name) => {
          if (name) {
            const next = { ...gameState, name };
            setGameState(next);
            persistState(next);
          }
          setExamModalOpen(false);
          sfx.click();
          startSession({ mode: 'exam', count: 36 });
        }}
        onClose={() => setExamModalOpen(false)}
      />

      <LevelModal level={levelUpModal} onClose={() => setLevelUpModal(null)} />

      <CertModal
        cert={gameState.cert}
        open={certModalOpen}
        onDownload={downloadCert}
        onClose={() => setCertModalOpen(false)}
      />
    </>
  );
}
