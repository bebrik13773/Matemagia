import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { PetMood, PetSkin } from '../game/engine';

interface CaterpillarPetProps {
  skin: PetSkin;
  mood: PetMood;
  segments: number;
  compact?: boolean;
  interactive?: boolean;
  speech?: string | null;
  onPet?: () => void;
}

export function CaterpillarPet({
  skin,
  mood,
  segments,
  compact = false,
  interactive = false,
  speech = null,
  onPet,
}: CaterpillarPetProps) {
  const [blinking, setBlinking] = useState(false);
  const [lookOffset, setLookOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Natural periodic eye blinking
  useEffect(() => {
    let blinkTimeout = 0;
    let openTimeout = 0;
    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 2000;
      blinkTimeout = window.setTimeout(() => {
        setBlinking(true);
        openTimeout = window.setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(openTimeout);
    };
  }, []);

  // Curious eye glance left/right/up so she looks alive
  useEffect(() => {
    const glances = [
      { x: 0, y: 0 },
      { x: 1.4, y: -0.5 },
      { x: -1.3, y: 0.2 },
      { x: 0.8, y: 0.6 },
      { x: 0, y: -0.8 },
    ];
    let idx = 0;
    const timer = window.setInterval(() => {
      idx = (idx + 1) % glances.length;
      setLookOffset(glances[idx]);
    }, 1900);
    return () => window.clearInterval(timer);
  }, []);

  const segCount = Math.max(4, Math.min(6, segments));
  const segIndices = Array.from({ length: segCount }, (_, i) => i);
  const segStep = 18;
  const tailStartX = 52 + (6 - segCount) * 14;
  const headX = tailStartX + (segCount - 1) * segStep + 22;
  const headY = 50;

  const isJoy = mood === 'happy' || mood === 'excited' || mood === 'eating';
  const isSad = mood === 'sad';
  const isSleepy = mood === 'sleepy';

  const bodyContent = (
    <MotionConfig reducedMotion="user">
      <div className={`caterpillar-stage ${compact ? 'is-compact' : ''} mood-${mood}`}>
        {/* Ambient drifting firefly motes in full habitat */}
        {!compact && (
          <div className="pet-motes" aria-hidden="true">
            <motion.span
              className="pet-mote"
              style={{ left: '16%', top: '24%' }}
              animate={{ y: [0, -10, 0], x: [0, 6, 0], opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="pet-mote"
              style={{ left: '80%', top: '20%' }}
              animate={{ y: [0, 9, 0], x: [0, -7, 0], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2.9, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="pet-mote"
              style={{ left: '52%', top: '12%' }}
              animate={{ y: [0, -7, 0], opacity: [0.2, 0.75, 0.2] }}
              transition={{ duration: 4.1, delay: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        {speech && (
          <div className="pet-bubble-anchor">
            <motion.div
              key={speech}
              className="pet-bubble"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {speech}
            </motion.div>
          </div>
        )}

        {/* Flying star-leaf when eating */}
        {mood === 'eating' && (
          <motion.div
            className="pet-leaf-fly"
            initial={{ x: 24, y: -18, opacity: 1, scale: 1.1, rotate: -25 }}
            animate={{ x: 0, y: 4, opacity: 0, scale: 0.35, rotate: 20 }}
            transition={{ duration: 0.45, ease: 'easeIn' }}
            aria-hidden="true"
          >
            🍃
          </motion.div>
        )}

        {/* Floating emotion particles */}
        {mood === 'excited' && (
          <motion.span
            className="pet-emote"
            initial={{ opacity: 0, y: 4, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], y: -18, scale: [0.8, 1.2, 0.9] }}
            transition={{ duration: 1.0, repeat: Infinity }}
            aria-hidden="true"
          >
            ✨
          </motion.span>
        )}
        {mood === 'happy' && (
          <motion.span
            className="pet-emote"
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0], y: -16, scale: 1.15 }}
            transition={{ duration: 0.9 }}
            aria-hidden="true"
          >
            💚
          </motion.span>
        )}
        {mood === 'sleepy' && (
          <motion.span
            className="pet-emote"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -10, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            aria-hidden="true"
          >
            💤
          </motion.span>
        )}

        <motion.svg
          viewBox="0 0 230 92"
          className="pet-svg"
          aria-hidden="true"
          animate={
            mood === 'excited'
              ? { y: [0, -6, 0, -4, 0], x: [0, 3, -2, 0], rotate: [0, -2.5, 2.5, 0] }
              : mood === 'happy' || mood === 'eating'
                ? { y: [0, -5, 0], scale: [1, 1.04, 1] }
                : mood === 'sad'
                  ? { x: [0, -3, 3, -2, 0], y: [0, 1.5, 0] }
                  : mood === 'sleepy'
                    ? { y: [0, 1.5, 0], scaleY: [1, 0.96, 1] }
                    : { x: [-3, 4, -3], y: [0, -2.2, 0] }
          }
          transition={{
            duration: mood === 'excited' ? 0.7 : mood === 'idle' || mood === 'hungry' ? 2.4 : 0.65,
            repeat:
              mood === 'idle' || mood === 'hungry' || mood === 'excited' || mood === 'sleepy'
                ? Infinity
                : 0,
            ease: 'easeInOut',
          }}
        >
          {/* Soft ground shadow right beneath the caterpillar paws */}
          <ellipse
            cx={(tailStartX + headX) / 2}
            cy="73"
            rx={segCount * 10 + 24}
            ry="6.5"
            fill="rgba(5, 3, 18, 0.5)"
          />

          {/* Cohesive body segments from tail to neck */}
          {segIndices.map((idx) => {
            const cx = tailStartX + idx * segStep;
            const cy = 53 + Math.sin(idx * 0.95) * 1.8;
            const r = 13.5 + (idx / segCount) * 3.5;
            const fill = skin.segmentColors[idx % skin.segmentColors.length];
            const phaseDelay = idx * 0.16;
            return (
              <g key={idx} transform={`translate(${cx}, ${cy})`}>
                <motion.g
                  animate={
                    mood === 'sad'
                      ? { y: [0, 1.5, 0] }
                      : mood === 'sleepy'
                        ? { y: [0, 1.2, 0], scaleY: [1, 0.97, 1] }
                        : {
                            y: [0, -5.2, 0],
                            scaleY: [1, 1.06, 0.96, 1],
                            scaleX: [1, 0.96, 1.04, 1],
                          }
                  }
                  transition={{
                    duration: mood === 'excited' ? 0.55 : 1.35,
                    delay: phaseDelay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  {/* Attached proleg paws tucked cleanly into segment base */}
                  <path
                    d={`M -7 ${r - 5} Q -8 ${r + 3} -3.5 ${r + 3} Q -0.5 ${r + 2} -1 ${r - 3} Z`}
                    fill={fill}
                    stroke="rgba(11, 8, 31, 0.45)"
                    strokeWidth="1"
                  />
                  <path
                    d={`M 2 ${r - 3} Q 2.5 ${r + 3} 6.5 ${r + 3} Q 9.5 ${r + 2} 8 ${r - 5} Z`}
                    fill={fill}
                    stroke="rgba(11, 8, 31, 0.45)"
                    strokeWidth="1"
                  />

                  {/* Segment body */}
                  <circle
                    cx={0}
                    cy={0}
                    r={r}
                    fill={fill}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1.1"
                  />
                  {/* Soft inner belly tint */}
                  <ellipse
                    cx={0}
                    cy={r * 0.44}
                    rx={r * 0.54}
                    ry={r * 0.28}
                    fill={skin.bellyColor}
                    opacity="0.28"
                  />
                  {/* Top gloss */}
                  <circle
                    cx={-r * 0.28}
                    cy={-r * 0.34}
                    r={r * 0.22}
                    fill="rgba(255,255,255,0.28)"
                  />
                  {/* Cosmic/starry pattern */}
                  {skin.hasStars && idx % 2 === 1 && (
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fontSize="9"
                      fill="rgba(255,255,255,0.88)"
                    >
                      ✦
                    </text>
                  )}
                </motion.g>
              </g>
            );
          })}

          {/* Expressive Head: translated to (headX, headY) so all rotations pivot cleanly around (0,0) */}
          <g transform={`translate(${headX}, ${headY})`}>
            <motion.g
              animate={
                mood === 'eating'
                  ? { rotate: [0, -8, 6, -5, 0], y: [0, -2, 0] }
                  : mood === 'hungry'
                    ? { rotate: [-5, 5, -5], y: [0, -3.5, 0] }
                    : mood === 'sad'
                      ? { rotate: 7, y: 2.5 }
                      : { rotate: [-4, 4.5, -4], y: [0, -4, 0] }
              }
              transition={{
                duration: mood === 'eating' ? 0.45 : mood === 'excited' ? 0.65 : 1.7,
                repeat: mood === 'eating' ? 1 : Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '0px 0px' }}
            >
              {/* Left Antenna: anchored directly inside head perimeter at (-7, -16) */}
              <g transform="translate(-7, -16)">
                <motion.g
                  animate={{ rotate: mood === 'sad' ? -18 : [-10, 12, -10] }}
                  transition={{ duration: mood === 'excited' ? 0.55 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  <path
                    d="M 0 0 Q -6 -13 -2 -18"
                    fill="none"
                    stroke={skin.antennaColor}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <circle cx={-2} cy={-18} r="3.6" fill={skin.antennaColor} />
                </motion.g>
              </g>

              {/* Right Antenna: anchored directly inside head perimeter at (7, -16) */}
              <g transform="translate(7, -16)">
                <motion.g
                  animate={{ rotate: mood === 'sad' ? 18 : [11, -11, 11] }}
                  transition={{ duration: mood === 'excited' ? 0.55 : 1.75, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: '0px 0px' }}
                >
                  <path
                    d="M 0 0 Q 7 -13 4 -18"
                    fill="none"
                    stroke={skin.antennaColor}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <circle cx={4} cy={-18} r="3.6" fill={skin.antennaColor} />
                </motion.g>
              </g>

              {/* Royal crown accessory */}
              {skin.hasCrown && (
                <path
                  d="M -10 -17 L -11 -27 L -4 -22 L 0 -30 L 5 -22 L 11 -27 L 10 -17 Z"
                  fill="#f5c451"
                  stroke="#fff3c4"
                  strokeWidth="1"
                />
              )}

              {/* Head sphere */}
              <circle
                cx={0}
                cy={0}
                r="19.5"
                fill={skin.headColor}
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="1.3"
              />
              <circle cx={-7} cy={-8} r="4.8" fill="rgba(255,255,255,0.24)" />

              {/* Rosy Cheeks */}
              <ellipse
                cx={-10}
                cy={5}
                rx="4.2"
                ry="2.6"
                fill={skin.cheekColor}
                opacity={isJoy ? 0.78 : 0.45}
              />
              <ellipse
                cx={11}
                cy={5}
                rx="4.2"
                ry="2.6"
                fill={skin.cheekColor}
                opacity={isJoy ? 0.78 : 0.45}
              />

              {/* Eyes */}
              {isSleepy || blinking ? (
                <>
                  <path
                    d="M -9 -2 Q -6 1 -3 -2"
                    fill="none"
                    stroke="#120d2e"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 4 -2 Q 7 1 10 -2"
                    fill="none"
                    stroke="#120d2e"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </>
              ) : isJoy ? (
                <>
                  <path
                    d="M -9 -1 Q -6 -6 -3 -1"
                    fill="none"
                    stroke="#120d2e"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 4 -1 Q 7 -6 10 -1"
                    fill="none"
                    stroke="#120d2e"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <circle cx={-6} cy={-2} r="4.3" fill="#120d2e" />
                  <circle cx={7} cy={-2} r="4.3" fill="#120d2e" />
                  <circle cx={-4.8 + lookOffset.x} cy={-3.4 + lookOffset.y} r="1.5" fill="#ffffff" />
                  <circle cx={8.2 + lookOffset.x} cy={-3.4 + lookOffset.y} r="1.5" fill="#ffffff" />
                  {mood === 'hungry' && (
                    <>
                      <circle cx={-6.8} cy={-0.5} r="0.9" fill="#ffffff" />
                      <circle cx={6.2} cy={-0.5} r="0.9" fill="#ffffff" />
                    </>
                  )}
                </>
              )}

              {/* Worried eyebrows + tear drop when sad */}
              {isSad && (
                <>
                  <path
                    d="M -10 -7 L -3 -9"
                    stroke="#120d2e"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 4 -9 L 11 -7"
                    stroke="#120d2e"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 14 1 Q 17 6 14 8 Q 11 6 14 1 Z"
                    fill="#67e8f9"
                  />
                </>
              )}

              {/* Mouth */}
              {mood === 'eating' ? (
                <motion.ellipse
                  cx={0.5}
                  cy={7}
                  rx="4"
                  ry="3.6"
                  fill="#7a1b3f"
                  animate={{ scaleY: [1, 0.32, 1] }}
                  transition={{ duration: 0.25, repeat: 2 }}
                  style={{ transformOrigin: '0.5px 7px' }}
                />
              ) : isSad ? (
                <path
                  d="M -4 9 Q 0.5 5 5 9"
                  fill="none"
                  stroke="#120d2e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              ) : isJoy ? (
                <path
                  d="M -5 5 Q 0.5 11 6 5 Z"
                  fill="#7a1b3f"
                />
              ) : (
                <path
                  d="M -4 6 Q -1 9 0.5 6.5 Q 2 9 5 6"
                  fill="none"
                  stroke="#120d2e"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
              )}
            </motion.g>
          </g>
        </motion.svg>
      </div>
    </MotionConfig>
  );

  if (interactive && onPet) {
    return (
      <button
        type="button"
        className="pet-interactive-btn"
        onClick={onPet}
        aria-label={`Погладить гусеницу (${skin.name})`}
      >
        {bodyContent}
      </button>
    );
  }

  return bodyContent;
}
