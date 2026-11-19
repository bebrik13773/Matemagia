import { useEffect, useState } from 'react';
import { CertificateData, fmtDate, rankFor } from '../game/engine';

interface PauseModalProps {
  open: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export function PauseModal({ open, onResume, onQuit }: PauseModalProps) {
  if (!open) return null;
  return (
    <div className="ov open" role="dialog" aria-modal="true" aria-label="Пауза">
      <div className="ov-card" style={{ textAlign: 'center' }}>
        <h2>⏸ Пауза</h2>
        <p>Таймер остановлен. Отдышись — и в бой!</p>
        <div className="ov-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="primary-btn" onClick={onResume}>
            ▶ Продолжить
          </button>
          <button type="button" className="ghost-btn danger-btn" onClick={onQuit}>
            Завершить
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  text: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ text, onConfirm, onCancel }: ConfirmModalProps) {
  if (!text) return null;
  return (
    <div className="ov open" role="dialog" aria-modal="true" aria-label="Подтверждение">
      <div className="ov-card">
        <h2>Подтверждение</h2>
        <p>{text}</p>
        <div className="ov-actions">
          <button type="button" className="primary-btn mag" onClick={onConfirm}>
            Да
          </button>
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

interface NameModalProps {
  open: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function NameModal({ open, initialName, onSave, onClose }: NameModalProps) {
  const [val, setVal] = useState(initialName);

  useEffect(() => {
    if (open) {
      setVal(initialName === 'Ученик' ? '' : initialName);
    }
  }, [open, initialName]);

  if (!open) return null;

  return (
    <div className="ov open" role="dialog" aria-modal="true" aria-label="Редактировать имя">
      <div className="ov-card">
        <h2>✏️ Как тебя зовут?</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(val.trim() || 'Ученик');
          }}
        >
          <input
            className="ov-input"
            maxLength={24}
            placeholder="Имя ученика"
            aria-label="Имя ученика"
            autoComplete="off"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <p className="hint">Имя появится в приветствии и на сертификате.</p>
          <div className="ov-actions">
            <button type="submit" className="primary-btn">
              Сохранить
            </button>
            <button type="button" className="ghost-btn" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ExamReadinessModalProps {
  open: boolean;
  masteryPct: number;
  weakCount: number;
  onConfirmStart: () => void;
  onRepeatWeak: () => void;
  onCancel: () => void;
}

export function ExamReadinessModal({
  open,
  masteryPct,
  weakCount,
  onConfirmStart,
  onRepeatWeak,
  onCancel,
}: ExamReadinessModalProps) {
  if (!open) return null;
  return (
    <div
      className="ov open"
      role="dialog"
      aria-modal="true"
      aria-label="Предупреждение о готовности"
    >
      <div className="ov-card exam-warn-card">
        <h2>⚠️ Готовность {masteryPct}% из 100%</h2>
        <p>
          Подготовка ещё не достигла 100%
          {weakCount > 0 ? ` (слабых примеров: ${weakCount})` : ''}. В финальном тесте нет
          вариантов ответа — числа нужно вводить самостоятельно. Рекомендуем сначала повторить
          слабые места, но можно начать и сейчас.
        </p>
        <div className="ov-actions exam-warn-actions">
          <button type="button" className="primary-btn" onClick={onRepeatWeak}>
            🔧 Повторить слабые
          </button>
          <button type="button" className="primary-btn mag" onClick={onConfirmStart}>
            🚀 Всё равно начать
          </button>
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

interface LevelModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelModal({ level, onClose }: LevelModalProps) {
  if (!level) return null;
  const rk = rankFor(level);
  return (
    <div className="ov open" role="dialog" aria-modal="true" aria-label="Новый уровень">
      <div className="ov-card" style={{ textAlign: 'center' }}>
        <div className="level-big">
          <span className="lb-emoji">{rk.emoji}</span>
          <div className="lb-l">Уровень {level}!</div>
          <div className="lb-r">{rk.name}</div>
          <p className="hint">Магия чисел становится сильнее ✨</p>
        </div>
        <div className="ov-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="primary-btn gold" onClick={onClose}>
            Так держать!
          </button>
        </div>
      </div>
    </div>
  );
}

interface CertModalProps {
  cert: CertificateData | null;
  open: boolean;
  onDownload: () => void;
  onClose: () => void;
}

export function CertModal({ cert, open, onDownload, onClose }: CertModalProps) {
  if (!open || !cert) return null;
  return (
    <div className="ov open" role="dialog" aria-modal="true" aria-label="Сертификат">
      <div className="cert-wrap">
        <div className="cert">
          <div className="cert-top">✦ АКАДЕМИЯ МАТЕМАГИИ ✦</div>
          <div className="cert-title">СЕРТИФИКАТ</div>
          <div className="cert-sub">о полном усвоении таблицы умножения и деления</div>
          <div className="cert-awarded">награждается</div>
          <div className="cert-name">{cert.name}</div>
          <div className="cert-line">
            за идеальный выпускной экзамен — все 36 примеров без единой ошибки
          </div>
          <div className="cert-stats">
            <div className="cert-stat">
              <div className="cv" style={{ color: 'var(--lime)' }}>
                36/36
              </div>
              <div className="cl">экзамен</div>
            </div>
            <div className="cert-stat">
              <div className="cv" style={{ color: 'var(--cyan)' }}>
                {cert.avg.toFixed(1)} с
              </div>
              <div className="cl">ср. время</div>
            </div>
            <div className="cert-stat">
              <div className="cv" style={{ color: 'var(--amber)' }}>
                {cert.mastery}%
              </div>
              <div className="cl">усвоение</div>
            </div>
            <div className="cert-stat">
              <div className="cv" style={{ color: 'var(--ink)' }}>
                {fmtDate(cert.date)}
              </div>
              <div className="cl">дата</div>
            </div>
          </div>
          <div className="cert-bottom">
            <div className="cert-id">
              № {cert.id}
              <br />
              Академия Матемагии
            </div>
            <div className="cert-sign">
              Архимаг Числов<i>ректор академии</i>
            </div>
            <div className="cert-seal">
              <span className="cs-star">✶</span>
              <span className="cs-n">36/36</span>
            </div>
          </div>
        </div>
        <div className="cert-actions">
          <button type="button" className="primary-btn gold" onClick={onDownload}>
            📥 Скачать PNG
          </button>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
