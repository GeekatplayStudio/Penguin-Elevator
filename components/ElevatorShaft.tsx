import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElevatorState } from '../types';

interface ElevatorShaftProps {
  elevatorState: ElevatorState;
  floor: number;
}

/**
 * Seamless vertical scroller that stays on the GPU.
 *
 * The previous shaft animated `backgroundPositionY` on several FULL-SCREEN
 * layers. background-position is a paint property: Android's WebView had to
 * re-rasterize the whole screen every frame while the elevator moved, and any
 * game-state change on top (a drop, a witness scream) restarted those
 * animations - the player saw it as the entire screen flashing. This renders
 * the repeating pattern on an oversized child and animates `transform`
 * instead, which composites without repainting.
 *
 * `distance` must be a whole multiple of the pattern's vertical period for
 * the loop to be seamless.
 */
const ScrollLayer: React.FC<{
  running: boolean;
  distance: number;   // px per loop, positive = content moves up
  duration: number;   // seconds per loop
  down?: boolean;     // reverse: content moves down
  className?: string;
  patternStyle: React.CSSProperties;
}> = ({ running, distance, duration, down, className, patternStyle }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ''}`}>
    <motion.div
      className="absolute left-0 right-0"
      style={{
        top: -distance,
        height: `calc(100% + ${distance * 2}px)`,
        willChange: 'transform',
        ...patternStyle,
      }}
      animate={running ? { y: down ? [-distance, 0] : [0, -distance] } : { y: 0 }}
      transition={running ? { repeat: Infinity, duration, ease: 'linear' } : { duration: 0 }}
    />
  </div>
);

const ElevatorShaftInner: React.FC<ElevatorShaftProps> = ({ elevatorState, floor }) => {
  const isMoving = elevatorState === 'MOVING';
  const isDoorOpen = elevatorState === 'BOARDING';

  // `absolute`, not `fixed`: fixed escapes the phone-simulator frame and
  // renders the shaft across the whole browser window, throwing every wall,
  // door and background number out of alignment with the play area.
  return (
    <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between">
      {/* ISOMETRIC 3D ELEVATOR SHAFT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 via-70% to-slate-950 opacity-90" />

      {/* GLOWING GRID PATTERN BACKGROUND - static, painted once */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(56, 189, 248, 0.3) 39px, rgba(56, 189, 248, 0.3) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(56, 189, 248, 0.3) 39px, rgba(56, 189, 248, 0.3) 40px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(800px) rotateX(15deg)',
        }}
      />

      {/* SHAFT RAIL TRACKS */}
      <div className="absolute top-0 bottom-0 left-8 w-2 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent" />
      <div className="absolute top-0 bottom-0 right-8 w-2 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent" />

      {/* SCROLLING FLOOR MARKERS - the "passing floors" illusion, GPU-composited */}
      <ScrollLayer
        running={isMoving}
        distance={260}
        duration={0.65}
        patternStyle={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 118px,
            rgba(148, 163, 184, 0.35) 118px, rgba(148, 163, 184, 0.35) 122px,
            transparent 122px, transparent 130px
          )`,
          backgroundSize: '100% 130px',
        }}
      />

      {/* WEST LEFT WALL */}
      <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 border-r-8 border-cyan-400/40 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="absolute left-0 right-0 top-0 h-1 bg-cyan-400/50" />
        {/* Vertical guide rail with moving cable-car pulley marks */}
        <div className="absolute left-6 top-0 bottom-0 w-1.5 overflow-hidden">
          <ScrollLayer
            running={isMoving}
            distance={360}
            duration={1}
            down
            patternStyle={{
              backgroundImage: 'repeating-linear-gradient(to bottom, rgba(56,189,248,0.5) 0px, rgba(56,189,248,0.5) 6px, transparent 6px, transparent 18px)',
            }}
          />
        </div>
        <div className="absolute left-4 top-8 w-1 h-12 bg-cyan-400/30 rounded-full" />
        <div className="absolute left-4 top-24 w-1 h-12 bg-cyan-400/30 rounded-full" />
      </div>

      {/* EAST RIGHT WALL */}
      <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 border-l-8 border-cyan-400/40 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="absolute left-0 right-0 top-0 h-1 bg-cyan-400/50" />
        <div className="absolute right-6 top-0 bottom-0 w-1.5 overflow-hidden">
          <ScrollLayer
            running={isMoving}
            distance={360}
            duration={1}
            down
            patternStyle={{
              backgroundImage: 'repeating-linear-gradient(to bottom, rgba(56,189,248,0.5) 0px, rgba(56,189,248,0.5) 6px, transparent 6px, transparent 18px)',
            }}
          />
        </div>
        <div className="absolute right-4 top-8 w-1 h-12 bg-cyan-400/30 rounded-full" />
        <div className="absolute right-4 top-24 w-1 h-12 bg-cyan-400/30 rounded-full" />
      </div>

      {/* The old STATUS/LEVEL wall panel lived here - removed: it sat directly
          behind the HUD header and timer, stacking three layers of level info
          on top of each other. The HUD is now the single source of that info. */}

      {/* SPEED LINES WHEN MOVING - one layer, transform-scrolled. The second
          full-screen layer this used to have bought little visually and
          doubled the compositing load, so it's gone. */}
      {isMoving && (
        <ScrollLayer
          running
          down
          distance={600}
          duration={0.35}
          patternStyle={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, rgba(56,189,248,0.25) 20px, transparent 40px)',
            backgroundSize: '100% 60px',
          }}
        />
      )}

      {/* PASSING FLOOR LIGHT FLASH STRIP - transform-driven */}
      <AnimatePresence>
        {isMoving && (
            <motion.div
                key="passing-light"
                initial={{ y: '-15vh', opacity: 0 }}
                animate={{ y: '115vh', opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                style={{ willChange: 'transform' }}
                className="absolute top-0 left-20 right-20 h-24 bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-transparent blur-xl"
            />
        )}
      </AnimatePresence>

      {/* LARGE BACKGROUND FLOOR NUMBER.
          Deliberately plain: this previously had a drop-shadow-2xl plus a
          duplicate copy under blur-3xl - a 64px blur over roughly a third of
          the screen. Both re-rasterize on every state change, which reads as
          a full-screen flash on mid-range Android. At 8% opacity the glow
          bought nothing visually. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1]">
        <div className="text-[50vw] font-pixel font-bold text-cyan-400/[0.08] select-none leading-none tracking-tighter">
          {floor.toString().padStart(3, '0')}
        </div>
      </div>

      {/* SLIDING ELEVATOR DOORS */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-r-4 border-cyan-400/60 shadow-2xl flex items-center justify-end z-30 overflow-hidden"
        initial={{ x: 0 }}
        animate={{ x: isDoorOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ willChange: 'transform' }}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
        </div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-3 h-16 bg-slate-600 rounded-full shadow-lg border border-slate-500" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-500/30 via-amber-500/10 to-transparent" />
      </motion.div>

      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-slate-800 via-slate-800 to-slate-900 border-l-4 border-cyan-400/60 shadow-2xl flex items-center justify-start z-30 overflow-hidden"
        initial={{ x: 0 }}
        animate={{ x: isDoorOpen ? '100%' : '0%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ willChange: 'transform' }}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
        </div>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 w-3 h-16 bg-slate-600 rounded-full shadow-lg border border-slate-500" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-500/30 via-amber-500/10 to-transparent" />
      </motion.div>

      {/* DOOR OPENING GLOW EFFECT */}
      {isDoorOpen && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-emerald-400/20 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}
    </div>
  );
};

/**
 * Memoized so App-level state churn (drops, witnesses, scores, pauses) cannot
 * re-render the full-screen background at all - it only updates when the
 * elevator state or the floor number actually changes.
 */
export const ElevatorShaft = React.memo(ElevatorShaftInner);
