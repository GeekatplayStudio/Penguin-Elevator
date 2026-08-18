import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Penguin as PenguinType, Direction } from '../types';
import { AlertTriangle } from './Icons';
import { getVisibleDirections } from '../utils/gameLogic';
import clsx from 'clsx';

const BEAM_ROTATION: Record<Direction, string> = {
  DOWN: 'rotate(30deg) scaleX(1.2)',
  LEFT: 'rotate(150deg) scaleX(1.2)',
  RIGHT: 'rotate(-30deg) scaleX(1.2)',
  UP: 'rotate(-150deg) scaleX(1.2)',
};

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
 * PIXEL PENGUIN - voxel sprite transcribed directly from the character sheet.
 *
 * The artwork IS the data: every string below is one row of cubes and every
 * character is one cube. Nothing here is drawn procedurally, so the sprite is
 * a literal copy of the reference rather than an interpretation of it. To
 * restyle the character you edit the map, not the rendering code.
 *
 * Legend:
 *   .  empty                D  dark navy (outline/shade)   N  navy (body)
 *   L  light navy (flipper) W  white (belly/eye patch)     H  eye glint
 *   K  pupil                R  panic pupil                 P  pink blush
 *   O  orange (beak/feet)   o  deep orange (foot shade)
 *   Y  gold (crown)         C  cyan (nightcap)             S  scarf red
 */
const VOXEL_COLORS: Record<string, string> = {
  D: '#232a4a',
  N: '#333f68',
  L: '#42507f',
  W: '#f7f6f2',
  H: '#ffffff',
  K: '#1b2138',
  R: '#e2483d',
  P: '#f7c3cb',
  O: '#f2901f',
  o: '#d97b12',
  Y: '#fbbf3c',
  C: '#38bdf8',
  S: '#e2483d',
};

const SPRITE_W = 18;
const SPRITE_H = 21;

/* --- cube shading helpers: every voxel is lit like a real 3D block --- */
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const shiftHex = (hex: string, amount: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp255(((n >> 16) & 255) + amount);
  const g = clamp255(((n >> 8) & 255) + amount);
  const b = clamp255((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

/** Rows 0-5: head dome + the little feather tuft. Shared by every view. */
const TOP_ROWS = [
  '.......D..D.......',
  '........DD........',
  '.....DDDDDDDD.....',
  '...DDNNNNNNNNDD...',
  '..DNNNNNNNNNNNND..',
  '.DNNNNNNNNNNNNNND.',
];

/** Rows 6-9: the face, swapped per expression so each stays pixel-exact. */
const FRONT_FACE = {
  NORMAL: [
    '.DNWWWWWNNWWWWWND.',
    '.DNWHKKWNNWHKKWND.',
    '.DNWKKKWNNWKKKWND.',
    '.DNWWWWOOOOWWWWND.',
  ],
  PANIC: [
    '.DNWWWWWNNWWWWWND.',
    '.DNWHRRWNNWHRRWND.',
    '.DNWRRRWNNWRRRWND.',
    '.DNWWWWOOOOWWWWND.',
  ],
  SLEEPY: [
    '.DNWWWWWNNWWWWWND.',
    '.DNWWWWWNNWWWWWND.',
    '.DNKKKKWNNWKKKKND.',
    '.DNWWWWOOOOWWWWND.',
  ],
};

const SIDE_FACE = {
  NORMAL: [
    '.DNNNNNWWWWWWWNND.',
    '.DNNNNNWHKKWWWNND.',
    '.DNNNNNWKKKWWWOOD.',
    '.DNNNNNWWWWWWWOOD.',
  ],
  PANIC: [
    '.DNNNNNWWWWWWWNND.',
    '.DNNNNNWHRRWWWNND.',
    '.DNNNNNWRRRWWWOOD.',
    '.DNNNNNWWWWWWWOOD.',
  ],
  SLEEPY: [
    '.DNNNNNWWWWWWWNND.',
    '.DNNNNNWWWWWWWNND.',
    '.DNNNNNWKKKKWWOOD.',
    '.DNNNNNWWWWWWWOOD.',
  ],
};

/** Rows 10-20: torso, belly, flippers and feet - one set per view. */
const FRONT_BODY = [
  '.DPNNNNNOONNNNNPD.',
  '.DNNNWWWWWWWWNNND.',
  '.DNNWWWWWWWWWWNND.',
  '.DLNWWWWWWWWWWNLD.',
  '.DLNWWWWWWWWWWNLD.',
  '.DLNWWWWWWWWWWNLD.',
  '.DNNWWWWWWWWWWNND.',
  '..DNNWWWWWWWWNND..',
  '...DDNNNNNNNNDD...',
  '....OOOO..OOOO....',
  '....oooo..oooo....',
];

const SIDE_BODY = [
  '.DNNNNNWWWWWWWNND.',
  '.DNNNNWWWWWWWWNND.',
  '.DNLLNWWWWWWWWNND.',
  '.DNLLNWWWWWWWWNND.',
  '.DNLLNWWWWWWWWNND.',
  '.DNNNNWWWWWWWWNND.',
  '..DNNNWWWWWWWWND..',
  '..DNNNNWWWWWWNND..',
  '...DDNNNNNNNNDD...',
  '....OOOO..OOOO....',
  '....oooo..oooo....',
];

/** Back view: solid navy, no face - this penguin genuinely cannot see you. */
const BACK_ROWS = [
  '.DNNNNNNNNNNNNNND.',
  '.DNNNNNNNNNNNNNND.',
  '.DNNNNNNNNNNNNNND.',
  '.DNNNNNNNNNNNNNND.',
  '.DNLLNNNNNNNNLLND.',
  '.DNLLNNNNNNNNLLND.',
  '.DNLLNNNNNNNNLLND.',
  '.DNLLNNNNNNNNLLND.',
  '.DNLLNNNNNNNNLLND.',
  '.DNNNNNNNNNNNNNND.',
  '.DNNNNNNNNNNNNNND.',
  '..DNNNNNNNNNNNND..',
  '..DNNNNNNNNNNNND..',
  '...DDNNNNNNNNDD...',
  '....OOOO..OOOO....',
  '....oooo..oooo....',
];

/** Accessory overlays, painted on top of the body map at the same cube scale. */
const CROWN_ROWS = [
  '.....Y..Y..Y......',
  '.....YY.YY.YY.....',
  '.....YYYYYYYY.....',
  '.....YYYYYYYY.....',
];

const NIGHTCAP_ROWS = [
  '.........WWW......',
  '......CCCCCC......',
  '....CCCCCCCCCC....',
  '...CCCCCCCCCCCC...',
];

const SCARF_ROWS = [
  '.SSSSSSSSSSSSSSSS.',
  '.SSSSSSSSSSSSSSSS.',
  '..........SSS.....',
];

type EyeState = 'NORMAL' | 'PANIC' | 'SLEEPY';

/** Assembles the full 18x21 voxel map for a given view + expression. */
const buildSpriteMap = (facingDir: Direction, type: PenguinType['type'], isPanic?: boolean): string[] => {
  if (facingDir === 'UP') {
    return [...TOP_ROWS, ...BACK_ROWS].slice(0, SPRITE_H);
  }

  const eye: EyeState = isPanic ? 'PANIC' : type === 'SLEEPY' ? 'SLEEPY' : 'NORMAL';
  const isSide = facingDir === 'LEFT' || facingDir === 'RIGHT';
  const face = isSide ? SIDE_FACE[eye] : FRONT_FACE[eye];
  const body = isSide ? SIDE_BODY : FRONT_BODY;
  return [...TOP_ROWS, ...face, ...body].slice(0, SPRITE_H);
};

/** Paints an overlay map (crown, cap, scarf) into a map at a row offset. */
const applyOverlay = (map: string[], overlay: string[], rowOffset: number): string[] => {
  const out = [...map];
  overlay.forEach((row, i) => {
    const target = rowOffset + i;
    if (target < 0 || target >= out.length) return;
    const base = out[target];
    let merged = '';
    for (let c = 0; c < SPRITE_W; c++) {
      const ov = row[c];
      merged += ov && ov !== '.' ? ov : base[c];
    }
    out[target] = merged;
  });
  return out;
};

const PixelPenguinSprite: React.FC<{
  facingDir: Direction;
  type: PenguinType['type'];
  isPanic?: boolean;
  isHovered?: boolean;
  appearanceVariant?: number;
  sizeClass?: string;
}> = React.memo(({ facingDir, type, isPanic, appearanceVariant = 0, sizeClass }) => {
  // Unique per instance so the per-colour cube gradients never collide
  const uid = React.useId().replace(/:/g, '');
  const flip = facingDir === 'LEFT'; // the LEFT view is the RIGHT artwork mirrored

  let map = buildSpriteMap(facingDir, type, isPanic);
  if (type === 'VIP') map = applyOverlay(map, CROWN_ROWS, 0);
  if (type === 'SLEEPY') map = applyOverlay(map, NIGHTCAP_ROWS, 0);
  if (type === 'JITTERY') map = applyOverlay(map, SCARF_ROWS, 10);

  // Slight navy variation per penguin so a crowded floor doesn't look cloned
  const palette: Record<string, string> = { ...VOXEL_COLORS };
  if (appearanceVariant === 1) {
    palette.N = '#39466f';
    palette.L = '#4a5889';
  } else if (appearanceVariant === 2) {
    palette.N = '#2c3a61';
    palette.L = '#3b4a78';
  }

  // Every distinct colour gets a diagonal light->dark gradient so each voxel
  // reads as a lit 3D block (top-left face catching light, bottom-right in
  // shadow) rather than a flat 2D pixel.
  const used = new Set<string>();
  map.forEach(row => {
    for (let x = 0; x < SPRITE_W; x++) {
      const ch = row[x];
      if (ch && ch !== '.' && palette[ch]) used.add(ch);
    }
  });

  const cubes: React.ReactNode[] = [];
  map.forEach((row, y) => {
    for (let x = 0; x < SPRITE_W; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      if (!palette[ch]) continue;
      cubes.push(
        <rect
          key={`${x}-${y}`}
          x={x + 0.02}
          y={y + 0.02}
          width={0.96}
          height={0.96}
          rx={0.16}
          fill={`url(#${uid}-g${ch})`}
          stroke={shiftHex(palette[ch], -38)}
          strokeWidth={0.05}
        />
      );
    }
  });

  return (
    <div className={clsx('relative flex items-center justify-center select-none', sizeClass ?? 'w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]')}>
      <svg
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        className="w-full h-full drop-shadow-[0_5px_7px_rgba(0,0,0,0.5)]"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        <defs>
          {[...used].map(ch => {
            const base = palette[ch];
            return (
              <linearGradient key={ch} id={`${uid}-g${ch}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={shiftHex(base, 34)} />
                <stop offset="42%" stopColor={base} />
                <stop offset="100%" stopColor={shiftHex(base, -30)} />
              </linearGradient>
            );
          })}
        </defs>
        {cubes}
      </svg>
    </div>
  );
});
PixelPenguinSprite.displayName = 'PixelPenguinSprite';

/**
 * Standalone version of the exact same sprite for UI chrome (header logo,
 * start screen, game over screen) so the character is identical everywhere.
 */
export const PenguinIcon: React.FC<{
  size?: number;
  type?: PenguinType['type'];
  facingDir?: Direction;
  isPanic?: boolean;
  className?: string;
}> = ({ size = 64, type = 'STANDARD', facingDir = 'DOWN', isPanic = false, className }) => (
  <div style={{ width: size, height: size }} className={clsx('inline-flex items-center justify-center', className)}>
    <PixelPenguinSprite
      facingDir={facingDir}
      type={type}
      isPanic={isPanic}
      appearanceVariant={0}
      sizeClass="w-full h-full"
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
      case 'DOWN':  return { arrow: '↘', label: 'SE' };
      case 'LEFT':  return { arrow: '↙', label: 'SW' };
      case 'RIGHT': return { arrow: '↗', label: 'NE' };
      case 'UP':    return { arrow: '↖', label: 'NW' };
    }
  };

  const blindInfo = getDirectionInfo(BLIND_SPOT[facingDir]);

  return (
    <div className="relative w-full h-full flex justify-center items-center pointer-events-none z-10">

      {/* DIRECTIONAL VISION BEAMS - 3 rays (everything but straight behind), or a
          single ray locked onto the fish treat while distracted */}
      {(showVisionCone || isHovered) && !penguin.isFalling && !penguin.isPanic && penguin.type !== 'SLEEPY' && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
          {(penguin.isDistracted && penguin.distractionDir ? [facingDir] : getVisibleDirections(facingDir)).map(dir => (
            <div
              key={dir}
              className="absolute w-36 h-12 bg-gradient-to-r from-amber-400/40 via-amber-400/20 to-transparent border-t-2 border-b-2 border-amber-300/60 shadow-[0_0_15px_rgba(251,191,36,0.5)] pointer-events-none"
              style={{
                transformOrigin: '0% 50%',
                transform: BEAM_ROTATION[dir],
              }}
            />
          ))}
        </div>
      )}

      {/* MAIN PENGUIN ANIMATED CONTAINER */}
      <AnimatePresence mode="wait">
        {!penguin.isFalling && (
          <motion.div
            key="penguin-pixel-body"
            initial={{ opacity: 0, scale: 0 }}
            animate={penguin.isPanic ? {
               x: facingDir === 'LEFT' ? -30 : facingDir === 'RIGHT' ? 30 : 0,
               y: 40,
               opacity: 0,
               scale: 0.8,
               rotate: facingDir === 'LEFT' ? -15 : 15,
               transition: { duration: 0.5, ease: "easeIn" }
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

            {/* BLIND SPOT BADGE - the one direction this penguin can't see (only
                on hover / vision toggle, to keep the default board clean) */}
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
            {penguin.type === 'VIP' && (
              <div className="absolute -top-10 bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold text-[8px] px-1.5 py-0.5 rounded-md border-2 border-[#d97b12] shadow-lg animate-bounce z-30">
                ★ VIP
              </div>
            )}

            {penguin.type === 'SLEEPY' && (
              <motion.div
                animate={{ y: [-2, -8, -2], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-10 text-[#38bdf8] font-pixel font-bold text-[10px] z-30"
              >
                Zzz...
              </motion.div>
            )}

            {/* GROUND CONTACT SHADOW - anchors the penguin onto the tile */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 sm:w-12 sm:h-3.5 rounded-full bg-black/45 blur-[3px] pointer-events-none" />

            {/* SPRITE WRAPPER */}
            <div className={clsx(
              "transition-transform duration-150 relative",
              isHovered && !penguin.isPanic ? "scale-115 brightness-125 drop-shadow-[0_0_12px_rgba(242,144,31,0.85)]" : ""
            )}>
              <PixelPenguinSprite
                facingDir={facingDir}
                type={penguin.type}
                isPanic={penguin.isPanic}
                isHovered={isHovered}
                appearanceVariant={penguin.appearanceVariant}
              />
            </div>

            {/* PANIC EXCLAMATION */}
            {penguin.isPanic && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: 1, y: -15 }}
                transition={{ repeat: Infinity, duration: 0.25 }}
                className="absolute -top-6 text-[#e2483d] font-pixel font-bold text-2xl drop-shadow-[0_0_8px_rgba(226,72,61,1)] z-40"
              >
                !
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
