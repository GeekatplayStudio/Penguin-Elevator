import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Penguin as PenguinType, Direction } from '../types';
import { AlertTriangle } from './Icons';
import { ClosedEyesOverlay, ExclamationMarks } from './Cinematics';
import clsx from 'clsx';

interface PenguinProps {
  penguin: PenguinType;
  isHovered: boolean;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  isWitness?: boolean;
  showVisionCone?: boolean;
}

/**
 * VOXEL COLOR PALETTE - Exact colors from the reference character sheet
 */
const PALETTE = {
  NAVY_MAIN: '#2B3B60',
  NAVY_DARK: '#1B2642',
  NAVY_LIGHT: '#3A4E7A',
  WHITE_MAIN: '#F8FAFC',
  WHITE_SHADOW: '#CBD5E1',
  ORANGE_MAIN: '#F97316',
  ORANGE_DARK: '#C2410C',
  PINK_BLUSH: '#F472B6',
  EYE_PUPIL: '#0F172A',
  GOLD_CROWN: '#F59E0B',
  CYAN_SLEEP: '#38BDF8',
};

/**
 * Gets the exact PNG sprite path based on direction, type, state, and appearance variant.
 * Includes the requested sat-front pose ('sit.png') and character sheet turnaround views.
 */
const getSpriteInfo = (
  facingDir: Direction,
  type: PenguinType['type'],
  isPanic?: boolean,
  appearanceVariant: number = 0
): { src: string; flip?: boolean } => {
  // Direct Turnaround Directional Sprites from the specially designed sheet
  switch (facingDir) {
    case 'DOWN':
      return { src: '/sprites/front.png' };
    case 'RIGHT':
      return { src: '/sprites/right.png' };
    case 'LEFT':
      return { src: '/sprites/left.png' };
    case 'UP':
      return { src: '/sprites/back.png' };
  }
};

const PixelPenguinSprite: React.FC<{
  facingDir: Direction;
  type: PenguinType['type'];
  isPanic?: boolean;
  isHovered?: boolean;
  appearanceVariant?: number;
  sizeClass?: string;
}> = React.memo(({ facingDir, type, isPanic, appearanceVariant = 0, sizeClass }) => {
  const { src, flip } = getSpriteInfo(facingDir, type, isPanic, appearanceVariant);

  return (
    <div className={clsx('relative flex items-end justify-center select-none', sizeClass ?? 'w-[62px] h-[70px] sm:w-[72px] sm:h-[80px]')}>
      <img
        src={src}
        alt="Pixel Penguin"
        className="w-full h-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]"
        style={{
          transform: flip ? 'scaleX(-1)' : undefined,
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
});
PixelPenguinSprite.displayName = 'PixelPenguinSprite';

/**
 * Standalone version using the front view transparent PNG sprite for UI chrome and splash screen.
 */
export const PenguinIcon: React.FC<{
  size?: number;
  type?: PenguinType['type'];
  facingDir?: Direction;
  isPanic?: boolean;
  className?: string;
}> = ({ size = 64, className }) => (
  <div style={{ width: size, height: size }} className={clsx('inline-flex items-center justify-center', className)}>
    <img
      src="/sprites/front.png"
      alt="Pixel Penguin Front View"
      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
    />
  </div>
);

export const Penguin: React.FC<PenguinProps> = ({
  penguin,
  isHovered,
  onClick,
  onHoverStart,
  onHoverEnd,
  isWitness,
  showVisionCone = false
}) => {
  const facingDir: Direction = penguin.isDistracted && penguin.distractionDir
    ? penguin.distractionDir
    : penguin.direction;

  // The badge shows the BLIND SPOT (opposite of facing) - the one direction
  // this penguin can't see, since that's the actionable info for the player.
  const BLIND_SPOT: Record<Direction, Direction> = { DOWN: 'UP', UP: 'DOWN', LEFT: 'RIGHT', RIGHT: 'LEFT' };
  const getDirectionInfo = (dir: Direction) => {
    switch (dir) {
      case 'DOWN':  return { arrow: '↓', label: 'FRONT' };
      case 'LEFT':  return { arrow: '←', label: 'LEFT' };
      case 'RIGHT': return { arrow: '→', label: 'RIGHT' };
      case 'UP':    return { arrow: '↑', label: 'BACK' };
    }
  };

  const blindInfo = getDirectionInfo(BLIND_SPOT[facingDir]);

  return (
    <div className="relative w-full h-full flex justify-center items-center pointer-events-none z-10">

      {/* MAIN PENGUIN ANIMATED CONTAINER */}
      <AnimatePresence mode="wait">
        {!penguin.isFalling && (
          <motion.div
            key="penguin-pixel-body"
            initial={penguin.isEntering ? { opacity: 0, scale: 0.3, y: -60, rotate: -20 } : { opacity: 0, scale: 0 }}
            animate={penguin.isPanic ? {
               // Exactly 6 alarm jumps (1 cycle + 5 repeats), slow enough to
               // read clearly. opacity/scale MUST be present here: values
               // omitted from an animate target snap back to `initial`
               // (opacity 0, scale 0) and the witness turns invisible.
               opacity: 1,
               scale: [1, 1.1, 0.95, 1],
               y: [0, -38, 0],
               rotate: [0, -4, 4, 0],
               transition: { repeat: 5, duration: 0.6, ease: "easeInOut" }
            } : penguin.isDizzy ? {
               // Funny dizzy wobble right before the trapdoor opens
               opacity: 1,
               rotate: [0, -18, 18, -12, 12, -6, 6, 0],
               scale: [1, 1.1, 0.95, 1.05, 1],
               y: [0, -6, 0, -4, 0],
               transition: { duration: 0.45, ease: "easeInOut" }
            } : penguin.isPushed ? {
               // Got shoved by a boarding penguin - quick nudge and spin
               opacity: 1,
               scale: 1,
               x: [0, 8, -6, 3, 0],
               rotate: [0, 12, -10, 5, 0],
               y: [0, -8, 0],
               transition: { duration: 0.6, ease: "easeOut" }
            } : penguin.isEntering ? {
               // Waddle-in bounce when boarding the elevator
               opacity: 1,
               scale: [0.3, 1.15, 0.95, 1],
               y: [-60, 0, -10, 0],
               rotate: [-20, 8, -4, 0],
               transition: { duration: 0.7, ease: "easeOut" }
            } : {
              opacity: 1,
              scale: 1,
              y: penguin.type === 'JITTERY' ? [0, -3, 3, -2, 0] : [0, -4, 0],
              transition: {
                y: { repeat: Infinity, duration: penguin.type === 'JITTERY' ? 0.35 : 1.8, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 350, damping: 22 }
              }
            }}
            exit={{
              y: 100,
              opacity: 0,
              scale: 0.4,
              rotate: 180,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            className="relative pointer-events-auto cursor-pointer z-10 flex flex-col items-center justify-center group"
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >

            {/* BLIND SPOT BADGE - the one direction this penguin can't see */}
            {(showVisionCone || isHovered) && !penguin.isPanic && penguin.type !== 'SLEEPY' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-7 px-1.5 py-0.5 bg-[#1a2744]/95 border border-[#f2901f]/70 rounded-md text-[#fbbf3c] font-pixel text-[9px] flex items-center gap-0.5 shadow-md z-30"
                title="Blind spot - safe approach direction"
              >
                <span className="font-bold">{blindInfo.arrow}</span>
                <span className="text-[8px] opacity-80">{blindInfo.label}</span>
              </motion.div>
            )}

            {/* TYPE BADGES */}
            {penguin.type === 'VIP' && !penguin.isPanic && (
              <div className="absolute -top-10 bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold text-[8px] px-1.5 py-0.5 rounded-md border-2 border-[#d97b12] shadow-lg animate-bounce z-30">
                ★ VIP
              </div>
            )}

            {penguin.type === 'SLEEPY' && !penguin.isPanic && (
              <motion.div
                animate={{ y: [-2, -8, -2], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-10 text-[#38bdf8] font-pixel font-bold text-[10px] z-30"
              >
                Zzz...
              </motion.div>
            )}

            {/* GROUND CONTACT SHADOW */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 sm:w-12 sm:h-3.5 rounded-full bg-black/45 blur-[3px] pointer-events-none" />

            {/* SPRITE WRAPPER */}
            <div className={clsx(
              "transition-transform duration-150 relative",
              isHovered && !penguin.isPanic ? "scale-115 brightness-125 drop-shadow-[0_0_12px_rgba(242,144,31,0.85)]" : "",
              penguin.isPanic ? "drop-shadow-[0_0_20px_rgba(226,72,61,1)]" : ""
            )}>
              <PixelPenguinSprite
                facingDir={facingDir}
                type={penguin.type}
                isPanic={penguin.isPanic}
                isHovered={isHovered}
                appearanceVariant={penguin.appearanceVariant}
              />
              {/* Sleeping penguins get proper closed eyelids over the render */}
              {penguin.type === 'SLEEPY' && !penguin.isPanic && (
                <ClosedEyesOverlay facing={facingDir} />
              )}
            </div>

            {/* PANIC ALARM - three bright red exclamation marks over the witness's head */}
            {penguin.isPanic && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-10 z-40 drop-shadow-[0_0_10px_rgba(226,72,61,0.9)]"
              >
                <ExclamationMarks />
              </motion.div>
            )}

            {/* WITNESS WARNING */}
            {isWitness && !penguin.isPanic && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1.2, y: -50 }}
                className="absolute text-[#e2483d] drop-shadow-md z-40"
              >
                <AlertTriangle size={32} fill="#e2483d" stroke="white" strokeWidth={2} className="animate-pulse" />
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
