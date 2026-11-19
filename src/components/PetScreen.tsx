import { useEffect, useRef, useState } from 'react';
import { sfx } from '../game/audio';
import {
  GameState,
  PET_SKINS,
  PetMood,
  getEquippedPetSkin,
  getPetStage,
  isPetSkinUnlocked,
  levelInfo,
} from '../game/engine';
import { CaterpillarPet } from './CaterpillarPet';

const PET_PHRASES = [
  'Мур-хрум! Порешаем ещё?',
  'Умножение — моё любимое лакомство!',
  'Каждый верный ответ — сочный листик!',
  'Щекотно! Давай побьём рекорд!',
  'Обожаю математику и звёзды!',
];

const GROWTH_MILESTONES = [
  { fed: 0, title: 'Малышка' },
  { fed: 5, title: 'Любознашка' },
  { fed: 20, title: 'Умняшка' },
  { fed: 50, title: 'Волшебница' },
  { fed: 100, title: 'Легенда листа' },
];

interface PetScreenProps {
  state: GameState;
  onSelectPetSkin: (skinId: string) => void;
  onTrain: () => void;
  onBackToHub: () => void;
}

export function PetScreen({
  state,
  onSelectPetSkin,
  onTrain,
  onBackToHub,
}: PetScreenProps) {
  const [tapMood, setTapMood] = useState<PetMood | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const phraseIdxRef = useRef(0);
  const petTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (petTimerRef.current) {
        window.clearTimeout(petTimerRef.current);
      }
    };
  }, []);

  const li = levelInfo(state.xp);
  const equippedSkin = getEquippedPetSkin(state);
  const petStage = getPetStage(state.pet.fed);
  const defaultMood: PetMood = state.pet.fed === 0 ? 'hungry' : 'idle';
  const activeMood: PetMood = tapMood || defaultMood;

  const moodLabel =
    activeMood === 'excited'
      ? '✨ В восторге'
      : activeMood === 'happy'
        ? '💚 Счастлива'
        : activeMood === 'hungry'
          ? '🍃 Ждёт угощения'
          : '🌿 Настроение: бодрое';

  const handlePetTap = () => {
    sfx.petGiggle();
    const nextPhrase = PET_PHRASES[phraseIdxRef.current % PET_PHRASES.length];
    phraseIdxRef.current += 1;
    setSpeech(nextPhrase);
    setTapMood(state.pet.fed >= 20 ? 'excited' : 'happy');
    if (petTimerRef.current) {
      window.clearTimeout(petTimerRef.current);
    }
    petTimerRef.current = window.setTimeout(() => {
      setTapMood(null);
      setSpeech(null);
    }, 2200);
  };

  return (
    <section className="screen-anim" aria-label="Питомец">
      <div className="page-head">
        <button type="button" className="ghost-btn small" onClick={onBackToHub}>
          ← В штаб
        </button>
        <h2>🐛 Питомец Гусеничка</h2>
        <span className="pet-stage-tag">{petStage.title}</span>
      </div>

      <div className="pet-layout">
        <div className="card pet-stage-card">
          <div className="pet-habitat" data-tour="pet-habitat">
            <div className="pet-habitat-glow" aria-hidden="true" />
            <CaterpillarPet
              skin={equippedSkin}
              mood={activeMood}
              segments={petStage.segments}
              interactive
              speech={speech}
              onPet={handlePetTap}
            />
            <span className="pet-tap-hint">Нажми на гусеницу, чтобы погладить ✨</span>
          </div>

          <div className="pet-status-row">
            <span className="pet-mood-chip">{moodLabel}</span>
            <span className="pet-skin-chip">
              {equippedSkin.icon} {equippedSkin.name}
            </span>
          </div>

          <div className="pet-feed-row">
            <span>
              🍃 Съедено ответов: <b>{state.pet.fed}</b>
            </span>
            <span className="pet-next-growth">
              {petStage.nextAt !== null
                ? `До роста: ${petStage.nextAt - state.pet.fed} 🍃`
                : '🌟 Максимальный размер!'}
            </span>
          </div>

          <div className="bar pet-growth-bar">
            <i
              style={{
                width: `${
                  petStage.nextAt
                    ? Math.min(100, Math.round((state.pet.fed / petStage.nextAt) * 100))
                    : 100
                }%`,
              }}
            />
          </div>

          <div className="pet-milestones" aria-label="Стадии роста гусеницы">
            {GROWTH_MILESTONES.map((m) => {
              const reached = state.pet.fed >= m.fed;
              const current = petStage.title === m.title;
              return (
                <div
                  key={m.title}
                  className={`pet-ms ${reached ? 'reached' : ''} ${current ? 'current' : ''}`}
                >
                  <b>{m.fed} 🍃</b>
                  <span>{m.title}</span>
                </div>
              );
            })}
          </div>

          <button type="button" className="primary-btn" style={{ width: '100%' }} onClick={onTrain}>
            ⚡ Заработать листики в тренировке
          </button>
        </div>

        <div className="card pet-wardrobe" data-tour="pet-wardrobe">
          <div className="pet-head-row">
            <h3>🎨 Скины за уровни</h3>
            <span className="hint">Твой уровень: {li.l}</span>
          </div>
          <p className="pet-desc">
            Повышай уровень в тренировках и экзамене — каждый рубеж открывает новый образ для твоей
            гусенички.
          </p>

          <div className="pet-skin-grid" role="group" aria-label="Скины гусеницы">
            {PET_SKINS.map((skin) => {
              const unlocked = isPetSkinUnlocked(skin, li.l);
              const active = equippedSkin.id === skin.id;
              return (
                <button
                  key={skin.id}
                  type="button"
                  className={`skin-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
                  disabled={!unlocked}
                  aria-pressed={active}
                  onClick={() => onSelectPetSkin(skin.id)}
                  title={
                    unlocked
                      ? `Надеть скин «${skin.name}»`
                      : `Откроется на уровне ${skin.unlockLevel}`
                  }
                >
                  <div className="sc-top">
                    <span className="sc-ico">{skin.icon}</span>
                    <span className="sc-badge">
                      {!unlocked ? `🔒 Ур. ${skin.unlockLevel}` : active ? '✓ Надет' : `Ур. ${skin.unlockLevel}`}
                    </span>
                  </div>
                  <div className="sc-name">{skin.name}</div>
                  <div className="sc-swatches" aria-hidden="true">
                    {skin.segmentColors.slice(0, 4).map((color, idx) => (
                      <i key={idx} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
