import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Smartphone, Monitor, EyeOff, Eye, Pause, Play } from './Icons';
import { APP_VERSION, STUDIO_NAME, AUTHOR_NAME, COPYRIGHT_NOTICE } from '../constants';
import { PenguinIcon } from './Penguin';
import { PileReveal } from './Cinematics';
import { getBoardingTime, getMoveTime, getDifficultyLevel } from '../utils/gameLogic';
import { audioManager } from '../utils/audio';

/** Small floating mute toggle reused on the Start and Game Over screens */
const MuteButton: React.FC<{ isMuted: boolean; onToggleMute: () => void }> = ({ isMuted, onToggleMute }) => (
  <motion.button
    onClick={onToggleMute}
    className="absolute top-4 right-4 z-10 p-2.5 bg-[#24406b] hover:bg-[#2d4d80] border-b-4 border-[#16294a] rounded-xl shadow-lg active:scale-90 transition-all"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
  >
    {isMuted ? <VolumeX size={18} className="text-[#e2483d]" /> : <Volume2 size={18} className="text-[#efece2]" />}
  </motion.button>
);

interface HeaderProps {
  floor: number;
  score: number;
  combo: number;
  isMuted: boolean;
  isPaused: boolean;
  elevatorState: string;
  showVisionCones: boolean;
  viewMode: 'MOBILE_SIM' | 'FULLSCREEN';
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleVision: () => void;
  onToggleViewMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  floor,
  score,
  combo,
  isMuted,
  isPaused,
  elevatorState,
  showVisionCones,
  viewMode,
  onToggleMute,
  onTogglePause,
  onToggleVision,
  onToggleViewMode
}) => (
  <div className="absolute top-0 left-0 w-full p-3 flex flex-col gap-2 z-30 pointer-events-none">
   <div className="w-full flex justify-between items-start gap-2">
    {/* LEFT HUD: TITLE & FLOOR */}
    <div className="flex flex-col gap-2 pointer-events-auto min-w-0">
      <div className="flex items-center gap-2 bg-[#1d3358] px-4 py-2 rounded-2xl border-b-4 border-[#12213c] shadow-lg">
        <motion.div
          className=""
          animate={{ rotate: [0, 5, -5, 0], y: [0, -4, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <PenguinIcon size={32} />
        </motion.div>
        <div>
          <h1 className="text-sm font-pixel font-bold tracking-tight text-[#efece2] leading-none">
            PENGUIN <span className="text-[#f2901f]">ELEVATOR</span>
          </h1>
          <div className="text-[10px] font-pixel text-[#8fa2c0]">Safety First!</div>
        </div>
      </div>

      <div className="bg-[#1d3358] px-3 py-2 rounded-2xl border-b-4 border-[#12213c] shadow-lg flex items-center flex-wrap gap-2.5 min-w-0">
        <div>
          <div className="text-[8px] uppercase font-pixel text-[#8fa2c0] leading-none mb-1.5 tracking-wider whitespace-nowrap">Floor</div>
          <motion.div
            className="text-2xl font-pixel font-bold text-[#fbbf3c] leading-none"
            key={floor}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
          >
             {floor.toString().padStart(3, '0')}
          </motion.div>
        </div>

        {/* DIFFICULTY LEVEL - steps up every 10 floors, matching the pacing tiers */}
        <div className="border-l-2 border-[#2d4d80] pl-2.5">
          <div className="text-[8px] uppercase font-pixel text-[#8fa2c0] leading-none mb-1.5 tracking-wider whitespace-nowrap">Level</div>
          <motion.div
            key={getDifficultyLevel(floor)}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="text-lg font-pixel font-bold text-[#f2901f] leading-none"
          >
            {getDifficultyLevel(floor)}
          </motion.div>
        </div>

        {combo > 1 && (
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: [1, 1.2, 1], rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="bg-[#f2901f] text-[#232a4a] font-pixel text-xs px-2.5 py-1 rounded-xl border-b-2 border-[#c26a10] shadow-lg tracking-widest font-bold"
          >
            {combo}x COMBO
          </motion.div>
        )}
      </div>
    </div>
    
    {/* RIGHT HUD: SCORE & QUICK TOGGLES */}
    <div className="flex flex-col items-end gap-2 pointer-events-auto shrink-0">
      {/* SCORE BADGE */}
      <div className="bg-[#1d3358] px-5 py-2.5 rounded-2xl border-b-4 border-[#12213c] shadow-lg text-right">
         <div className="text-[8px] uppercase font-pixel text-[#8fa2c0] leading-none mb-1.5 tracking-wider">Score</div>
         <motion.div
           className={`text-xl font-pixel font-bold ${score < 0 ? 'text-[#e2483d]' : 'text-[#efece2]'}`}
           key={score}
           initial={{ scale: 0.8 }}
           animate={{ scale: 1 }}
         >
           {score >= 0 ? '+' : ''}{score}
         </motion.div>
      </div>

      {/* QUICK TOGGLE BUTTONS */}
      <div className="flex items-center gap-2 bg-[#1d3358] p-2 rounded-2xl border-b-4 border-[#12213c] shadow-lg">
        {/* Pause / Resume */}
        <motion.button
          onClick={onTogglePause}
          className="p-2 bg-[#24406b] hover:bg-[#2d4d80] rounded-xl border-b-2 border-[#16294a] active:scale-90 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isPaused ? "Resume Game" : "Pause Game"}
        >
          {isPaused ? <Play size={18} className="text-[#fbbf3c]" /> : <Pause size={18} className="text-[#efece2]" />}
        </motion.button>

        {/* Mute Toggle */}
        <motion.button
          onClick={onToggleMute}
          className="p-2 bg-[#24406b] hover:bg-[#2d4d80] rounded-xl border-b-2 border-[#16294a] active:scale-90 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX size={18} className="text-[#e2483d]" /> : <Volume2 size={18} className="text-[#efece2]" />}
        </motion.button>

        {/* PC Simulator / Fullscreen View Switcher */}
        <motion.button
          onClick={onToggleViewMode}
          className="p-2 bg-[#24406b] hover:bg-[#2d4d80] rounded-xl border-b-2 border-[#16294a] active:scale-90 transition-all hidden sm:flex"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={viewMode === 'MOBILE_SIM' ? "Switch to Fullscreen" : "Switch to Mobile Sim Frame"}
        >
          {viewMode === 'MOBILE_SIM' ? <Monitor size={18} className="text-[#efece2]" /> : <Smartphone size={18} className="text-[#8fa2c0]" />}
        </motion.button>
      </div>
    </div>
   </div>

   {/* FLOOR TIMER - in normal flow below the HUD row, so it can never
       overlap the level info or the buttons regardless of screen size */}
   <div className="w-full flex justify-center">
     <FloorTimer elevatorState={isPaused ? 'PAUSED' : elevatorState} floor={floor} />
   </div>
  </div>
);

/**
 * Countdown bar for the elevator's rhythm: while the doors are open it drains
 * (time left to act before they close), while the elevator climbs it fills
 * (time until the next floor arrives). Both durations come from the same
 * difficulty functions the game engine uses, so the bar automatically gets
 * quicker as the elevator rises.
 */
export const FloorTimer: React.FC<{ elevatorState: string; floor: number }> = ({ elevatorState, floor }) => {
  const isBoarding = elevatorState === 'BOARDING';
  const isMoving = elevatorState === 'MOVING';
  if (!isBoarding && !isMoving) return null;

  const duration = (isBoarding ? getBoardingTime(floor) : getMoveTime(floor)) / 1000;

  return (
    <div className="w-48 pointer-events-none">
      <div className="flex justify-between items-baseline mb-1 px-0.5">
        <span className="font-pixel text-[8px] uppercase tracking-wider text-[#8fa2c0]">
          {isBoarding ? 'Doors close in' : 'Next floor in'}
        </span>
        <span className="font-pixel text-[8px] text-[#fbbf3c]">{duration.toFixed(1)}s</span>
      </div>
      <div className="h-2.5 bg-[#12213c] rounded-md border border-[#2d4d80] overflow-hidden">
        {/* scaleX, not width: width is a layout property, and animating it for
            the full 3-6s of every boarding/ride relayouts and repaints the HUD
            layer each frame - the "buttons flickering while rising" bug. */}
        <motion.div
          key={`${elevatorState}-${floor}`}
          className={`h-full w-full rounded-sm origin-left ${isBoarding ? 'bg-[#e2483d]' : 'bg-[#38bdf8]'}`}
          style={{ willChange: 'transform' }}
          initial={{ scaleX: isBoarding ? 1 : 0 }}
          animate={{ scaleX: isBoarding ? 0 : 1 }}
          transition={{ duration, ease: 'linear' }}
        />
      </div>
    </div>
  );
};

interface MobileControlsProps {
  fishCount: number;
  isFishActive: boolean;
  onUseFish: () => void;
  elevatorState: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  fishCount,
  isFishActive,
  onUseFish,
  elevatorState
}) => (
  <div className="absolute bottom-3 left-0 right-0 px-3 flex flex-col items-center gap-3 z-30 pointer-events-none">
    {/* STATUS BADGE */}
    {elevatorState === 'BOARDING' && (
      <motion.div
        className="bg-[#efece2] text-[#232a4a] font-pixel font-bold px-4 py-2 text-[10px] uppercase border-2 border-[#c3bfb2] shadow-lg rounded-xl pointer-events-auto tracking-wide"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      >
        PASSENGERS ENTERING
      </motion.div>
    )}
    {elevatorState === 'MOVING' && (
      <motion.div
        className="bg-[#24406b] text-[#efece2] font-pixel font-bold px-4 py-2 text-[10px] uppercase border-2 border-[#3d5a8c] shadow-lg rounded-xl pointer-events-auto tracking-wide"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        ELEVATOR ASCENDING
      </motion.div>
    )}

    {/* FISH TREAT DISTRACTION BUTTON */}
    <div className="pointer-events-auto flex items-center gap-3">
      <motion.button
        onClick={onUseFish}
        disabled={fishCount < 1 || isFishActive}
        className={`relative px-7 py-3 font-pixel text-sm flex items-center justify-center gap-2.5 border-b-4 rounded-2xl font-bold uppercase tracking-wide transition-all ${
          isFishActive
            ? 'bg-[#fbbf3c] text-[#232a4a] border-[#d97b12] shadow-lg'
            : fishCount >= 1
              ? 'bg-[#f2901f] hover:bg-[#fbbf3c] text-[#232a4a] border-[#d97b12] shadow-lg'
              : 'bg-[#2c3a61] text-[#6b7aa0] cursor-not-allowed border-[#1d2b4d]'
        }`}
        whileHover={fishCount >= 1 && !isFishActive ? { scale: 1.05 } : {}}
        whileTap={fishCount >= 1 && !isFishActive ? { scale: 0.95 } : {}}
        animate={isFishActive ? { rotate: [0, 6, -6, 0] } : {}}
        transition={isFishActive ? { repeat: Infinity, duration: 0.4 } : {}}
      >
        {/* Voxel fish icon, drawn in the same cube style as the penguins */}
        <svg viewBox="0 0 12 8" className="w-7 h-5 relative z-10">
          {[
            [4, 2], [5, 2], [6, 2], [7, 2],
            [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [1, 3], [2, 3],
            [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [1, 4], [2, 4],
            [4, 5], [5, 5], [6, 5], [7, 5],
          ].map(([fx, fy], i) => (
            <rect key={i} x={fx + 0.04} y={fy + 0.04} width={0.92} height={0.92} rx={0.18} fill={fx < 3 ? '#e2483d' : '#38bdf8'} />
          ))}
          <rect x={6.04} y={3.04} width={0.92} height={0.92} rx={0.18} fill="#f7f6f2" />
        </svg>
        <span className="relative z-10 whitespace-nowrap">{isFishActive ? 'YUMMY!' : `FISH x${fishCount}`}</span>
      </motion.button>
    </div>
    <div className="text-[8px] font-pixel text-[#8fa2c0] uppercase tracking-wider bg-[#12213c]/80 px-3 py-1 rounded-lg pointer-events-none">
      Earn a fish every 10 floors - Tap an empty tile to place it
    </div>
  </div>
);

interface GameOverScreenProps {
  score: number;
  floor: number;
  highScore: number;
  bestFloor: number;
  onRestart: () => void;
  reason?: 'CAUGHT' | 'BANKRUPT';
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, floor, highScore, bestFloor, onRestart, reason, isMuted, onToggleMute }) => {
  // Stage 1: the shaft streaks past and the pile of grumpy dropped penguins
  // rises into view (with the sad trombone). Stage 2: the score card.
  const [stage, setStage] = React.useState<'REVEAL' | 'CARD'>('REVEAL');

  React.useEffect(() => {
    audioManager.playSadTrombone();
    const t = setTimeout(() => setStage('CARD'), 3600);
    return () => clearTimeout(t);
  }, []);

  const isNewHighScore = score >= highScore && score > 0;
  const isNewBestFloor = floor >= bestFloor && floor > 1;
  const floorsShort = bestFloor - floor;

  return (
  <div
    className="absolute inset-0 z-50 bg-slate-950 select-none overflow-hidden"
    onClick={() => stage === 'REVEAL' && setStage('CARD')}
  >
    <PileReveal />

    <AnimatePresence>
      {stage === 'REVEAL' && (
        <motion.div
          key="reveal-label"
          exit={{ opacity: 0 }}
          className="absolute top-16 inset-x-0 text-center pointer-events-none"
        >
          <motion.h2
            initial={{ scale: 0, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
            className="font-pixel font-bold text-3xl text-[#e2483d] uppercase tracking-tight"
            style={{ textShadow: '0 4px 0 #12213c' }}
          >
            {reason === 'BANKRUPT' ? 'Elevator Full!' : 'Busted!'}
          </motion.h2>
          <div className="mt-3 font-pixel text-[9px] text-white/40 uppercase tracking-widest">Tap to continue</div>
        </motion.div>
      )}
    </AnimatePresence>

    {stage === 'CARD' && (
      // Anchored to the TOP: the trampoline and the bouncing penguins own the
      // bottom of the frame, so keeping the card up here leaves the show visible
      <div className="absolute inset-0 flex items-start justify-center bg-gradient-to-b from-black/85 via-black/40 to-transparent p-3 pt-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative bg-[#1d3358] px-5 py-4 border-b-[6px] border-[#12213c] shadow-2xl max-w-sm w-full text-center rounded-3xl"
        >
          <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
          <motion.div
            className="inline-flex items-center justify-center mb-1"
            animate={{ rotate: [-4, 4, -4], y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <PenguinIcon size={52} isPanic type="STANDARD" />
          </motion.div>

          <h2 className="text-lg font-pixel font-bold text-white mb-1.5 tracking-tight">
             {reason === 'BANKRUPT' ? 'ELEVATOR FULL!' : 'BUSTED!'}
          </h2>
          <p className="text-slate-400 mb-3 text-[10px] font-pixel leading-relaxed">
            {reason === 'BANKRUPT' ? 'No room left - the floor filled up completely!' : 'A penguin caught you dropping a passenger!'}
          </p>

          {/* NEW RECORD banner, or how close this run came to the record */}
          {(isNewHighScore || isNewBestFloor) ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="mb-3 py-1.5 px-3 bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold text-[11px] rounded-xl border-b-4 border-[#d97b12] uppercase tracking-wider"
            >
              &#9733; NEW {isNewBestFloor && !isNewHighScore ? 'BEST FLOOR' : 'RECORD'}! &#9733;
            </motion.div>
          ) : floorsShort > 0 && floorsShort <= 15 ? (
            <div className="mb-3 py-1.5 px-3 bg-[#16294a] text-[#38bdf8] font-pixel text-[10px] rounded-xl border border-[#2d4d80] leading-relaxed">
              Only <strong className="text-[#fbbf3c]">{floorsShort} floor{floorsShort === 1 ? '' : 's'}</strong> short of your record!
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className="bg-[#16294a] px-2 py-1.5 rounded-xl border-b-4 border-[#0f1d36]">
              <div className="text-[8px] text-[#8fa2c0] uppercase font-pixel mb-0.5">FLOOR REACHED</div>
              <div className="text-xl font-pixel font-bold text-[#efece2]">{floor}</div>
            </div>
            <div className="bg-[#16294a] px-2 py-1.5 rounded-xl border-b-4 border-[#0f1d36]">
              <div className="text-[8px] text-[#8fa2c0] uppercase font-pixel mb-0.5">SCORE</div>
              <div className="text-xl font-pixel font-bold text-[#fbbf3c]">{score}</div>
            </div>
            <div className="bg-[#16294a] px-2 py-1.5 rounded-xl border-b-4 border-[#0f1d36]">
              <div className="text-[8px] text-[#8fa2c0] uppercase font-pixel mb-0.5">BEST FLOOR</div>
              <div className={`text-xl font-pixel font-bold ${isNewBestFloor ? 'text-[#fbbf3c]' : 'text-[#8fa2c0]'}`}>{Math.max(bestFloor, floor)}</div>
            </div>
            <div className="bg-[#16294a] px-2 py-1.5 rounded-xl border-b-4 border-[#0f1d36]">
              <div className="text-[8px] text-[#8fa2c0] uppercase font-pixel mb-0.5">BEST SCORE</div>
              <div className={`text-xl font-pixel font-bold ${isNewHighScore ? 'text-[#fbbf3c]' : 'text-[#8fa2c0]'}`}>{Math.max(highScore, score)}</div>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-[#f2901f] hover:bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold rounded-2xl border-b-[6px] border-[#c26a10] active:translate-y-1 active:border-b-2 text-sm uppercase tracking-widest transition-all"
          >
            TRY AGAIN
          </button>
          <div className="mt-2 text-[#6b7aa0] text-[8px] font-pixel uppercase tracking-wider">{COPYRIGHT_NOTICE}</div>
        </motion.div>
      </div>
    )}
  </div>
  );
};

/* ============================================================
   ILLUSTRATED HOW-TO-PLAY SLIDES
   Mini board diagrams drawn with the real tile palette + sprites
   ============================================================ */

const MT = 40; // mini-tile size in the tutorial diagrams

/** One mini checkerboard tile, optionally tinted (danger/safe). */
const MiniTile: React.FC<{ x: number; y: number; tint?: 'danger' | 'side' | 'safe'; hole?: boolean }> = ({ x, y, tint, hole }) => {
  const isAlt = (x + y) % 2 === 1;
  return (
    <g>
      <rect x={x * MT} y={y * MT} width={MT} height={MT} fill={hole ? '#0a1024' : isAlt ? '#33322e' : '#efece2'} stroke={isAlt ? '#211f1d' : '#d6d2c5'} strokeWidth="1" />
      {hole && <ellipse cx={x * MT + MT / 2} cy={y * MT + MT / 2} rx={11} ry={7} fill="#38bdf8" opacity={0.45} />}
      {tint === 'danger' && <rect x={x * MT + 2} y={y * MT + 2} width={MT - 4} height={MT - 4} rx={3} fill="#e2483d" opacity={0.45} />}
      {tint === 'side' && <rect x={x * MT + 2} y={y * MT + 2} width={MT - 4} height={MT - 4} rx={3} fill="#f2901f" opacity={0.45} />}
      {tint === 'safe' && <rect x={x * MT + 2} y={y * MT + 2} width={MT - 4} height={MT - 4} rx={3} fill="#4ade80" opacity={0.45} />}
    </g>
  );
};

/** A reference-sheet penguin sprite standing on a mini tile. */
const MiniPenguin: React.FC<{ x: number; y: number; sprite: 'front' | 'back' | 'left' | 'right' }> = ({ x, y, sprite }) => (
  <image
    href={`/sprites/${sprite}.png`}
    x={x * MT + 4}
    y={y * MT - 12}
    width={MT - 8}
    height={MT + 6}
    preserveAspectRatio="xMidYMax meet"
    style={{ imageRendering: 'pixelated' } as React.CSSProperties}
  />
);

interface TutorialSlide {
  title: string;
  caption: React.ReactNode;
  diagram: React.ReactNode;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: 'TAP TO DROP',
    caption: <>Tap a penguin to open its trapdoor and clear a spot. <strong className="text-[#e2483d]">If the floor fills up completely - game over!</strong></>,
    diagram: (
      <svg viewBox={`-6 -18 ${MT * 4 + 12} ${MT * 2 + 26}`} className="w-full h-full">
        {[0, 1, 2, 3].map(x => <MiniTile key={x} x={x} y={0} hole={x === 2} />)}
        {[0, 1, 2, 3].map(x => <MiniTile key={x} x={x} y={1} />)}
        <MiniPenguin x={0} y={0} sprite="front" />
        <MiniPenguin x={1} y={1} sprite="right" />
        <text x={2 * MT + MT / 2} y={-6} textAnchor="middle" fontSize="13" fill="#fbbf3c" fontWeight="bold">+5</text>
        <text x={2 * MT + MT / 2} y={MT * 2 + 4} textAnchor="middle" fontSize="15">ðŸ‘†</text>
      </svg>
    ),
  },
  {
    title: 'PENGUIN VISION',
    caption: <>A penguin sees <strong className="text-[#e2483d]">3 tiles ahead & diagonally forward</strong>, <strong className="text-[#f2901f]">2 to each side</strong> - and <strong className="text-[#4ade80]">nothing behind</strong>. Drop from behind!</>,
    diagram: (
      <svg viewBox={`-6 -18 ${MT * 5 + 12} ${MT * 5 + 24}`} className="w-full h-full">
        {Array.from({ length: 5 }).map((_, y) => Array.from({ length: 5 }).map((_, x) => {
          let tint: 'danger' | 'side' | 'safe' | undefined;
          if (x === 2 && y > 1) tint = 'danger';                    // 3 straight ahead (facing down)
          else if (y - 1 === Math.abs(x - 2) && y > 1) tint = 'danger'; // forward diagonals
          else if (y === 1 && x !== 2) tint = 'side';               // 2 each side
          else if (y === 0) tint = 'safe';                          // behind + back diagonals: blind
          return <MiniTile key={`${x}-${y}`} x={x} y={y} tint={tint} />;
        }))}
        <MiniPenguin x={2} y={1} sprite="front" />
        {[1, 2, 3].map(x => (
          <text key={x} x={x * MT + MT / 2} y={0.5 * MT + 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#166534">&#10003;</text>
        ))}
      </svg>
    ),
  },
  {
    title: 'FRIENDS BLOCK THE VIEW',
    caption: <>Vision stops at the first penguin in the way. <strong className="text-[#4ade80]">Hide behind a bystander</strong> and drop safely - even right in front of a watcher!</>,
    diagram: (
      <svg viewBox={`-6 -18 ${MT * 3 + 12} ${MT * 4 + 24}`} className="w-full h-full">
        {Array.from({ length: 4 }).map((_, y) => Array.from({ length: 3 }).map((_, x) => {
          let tint: 'danger' | 'safe' | undefined;
          if (x === 1 && y === 1) tint = 'danger'; // watcher sees only up to the blocker
          else if (x === 1 && (y === 2 || y === 3)) tint = 'safe'; // hidden behind the blocker
          return <MiniTile key={`${x}-${y}`} x={x} y={y} tint={tint} />;
        }))}
        <MiniPenguin x={1} y={0} sprite="front" />
        <MiniPenguin x={1} y={1} sprite="back" />
        <MiniPenguin x={1} y={2} sprite="front" />
        <text x={1 * MT + MT / 2} y={2 * MT - 14} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#166534">&#10003; HIDDEN</text>
      </svg>
    ),
  },
  {
    title: 'FISH = DISTRACTION',
    caption: <>Earn a <strong className="text-[#f2901f]">FISH every 10 floors</strong>. Tap an empty tile to place it - every penguin turns to stare at the snack, leaving their backs wide open!</>,
    diagram: (
      <svg viewBox={`-6 -18 ${MT * 4 + 12} ${MT * 2 + 26}`} className="w-full h-full">
        {[0, 1].map(y => [0, 1, 2, 3].map(x => <MiniTile key={`${x}-${y}`} x={x} y={y} tint={x === 3 && y === 0 ? undefined : undefined} />))}
        <MiniPenguin x={0} y={0} sprite="right" />
        <MiniPenguin x={1} y={1} sprite="right" />
        {/* the fish everyone stares at */}
        <g transform={`translate(${3 * MT + 6}, ${0 * MT + 10})`}>
          <rect x={4} y={6} width={20} height={8} rx={2} fill="#38bdf8" />
          <rect x={0} y={4} width={6} height={12} rx={1} fill="#f59e0b" />
          <circle cx={19} cy={9} r={1.6} fill="#0f172a" />
        </g>
        <text x={2 * MT + MT / 2} y={0.5 * MT + 4} textAnchor="middle" fontSize="12" fill="#f2901f">&#128064; &#8594;</text>
      </svg>
    ),
  },
];

export const StartScreen: React.FC<{ onStart: () => void; highScore: number; bestFloor: number; isMuted: boolean; onToggleMute: () => void }> = ({ onStart, highScore, bestFloor, isMuted, onToggleMute }) => {
  const [slide, setSlide] = React.useState(0);

  // Rotating slideshow - advances on its own; tapping a dot jumps to a slide
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % TUTORIAL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = TUTORIAL_SLIDES[slide];

  return (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-4 select-none overflow-y-auto">
    <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
    <motion.div
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       className="text-center max-w-md w-full"
    >
      <div className="flex justify-center mb-2">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
          <PenguinIcon size={72} />
        </motion.div>
      </div>
      <h1 className="text-2xl font-pixel font-bold text-[#efece2] mb-1 tracking-tight leading-normal">
        PENGUIN <span className="text-[#f2901f]">ELEVATOR</span>
      </h1>
      <div className="text-[#6b7aa0] font-pixel text-[9px] mb-4 tracking-widest uppercase">
        {APP_VERSION}
      </div>

      {/* ROTATING ILLUSTRATED HOW-TO-PLAY */}
      <div className="bg-[#1d3358] p-4 rounded-2xl border-b-[6px] border-[#12213c] mb-4 text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-[#fbbf3c] font-pixel text-[11px] mb-2 uppercase text-center tracking-wider">{current.title}</h3>
            <div className="h-40 flex items-center justify-center mb-2 bg-[#16294a] rounded-xl p-2">
              {current.diagram}
            </div>
            <p className="text-[#d8dce8] text-[10px] font-pixel leading-relaxed text-center min-h-[3.5rem]">
              {current.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* SLIDE DOTS */}
        <div className="flex justify-center gap-2 mt-1">
          {TUTORIAL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-[#f2901f] scale-125' : 'bg-[#2d4d80] hover:bg-[#3d5a8c]'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {highScore > 0 && (
         <div className="mb-4 flex justify-center gap-2">
           <div className="px-4 py-2 bg-[#1d3358] rounded-xl border-b-4 border-[#12213c] text-[#fbbf3c] font-pixel font-bold text-xs shadow-md">
              BEST SCORE: {highScore}
           </div>
           {bestFloor > 1 && (
             <div className="px-4 py-2 bg-[#1d3358] rounded-xl border-b-4 border-[#12213c] text-[#38bdf8] font-pixel font-bold text-xs shadow-md">
                BEST FLOOR: {bestFloor}
             </div>
           )}
         </div>
      )}

      {/* PLAY IS ALWAYS AVAILABLE - the show keeps rotating behind it */}
      <button
        onClick={onStart}
        className="w-full py-4 bg-[#f2901f] hover:bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold rounded-2xl border-b-[6px] border-[#c26a10] text-base active:translate-y-1 active:border-b-2 uppercase tracking-widest transition-all shadow-xl"
      >
        &#9654; PLAY
      </button>

      <div className="mt-3 text-[#8fa2c0] font-pixel text-[9px] tracking-wider uppercase opacity-90">
        {STUDIO_NAME} &bull; {AUTHOR_NAME}
      </div>
    </motion.div>
  </div>
  );
};

/**
 * Mobile Simulator Frame Wrapper for PC Testing
 */
export const MobileSimulatorFrame: React.FC<{ children: React.ReactNode; isEnabled: boolean }> = ({ children, isEnabled }) => {
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      {/* PHONE BEZEL */}
      <div className="relative w-full max-w-[420px] h-full max-h-[860px] bg-slate-900 rounded-[32px] p-3 border-8 border-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* PHONE TOP NOTCH / CAMERA */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-3.5 bg-slate-950 rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* SCREEN VIEWPORT */}
        <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-slate-950 flex flex-col">
          {children}
        </div>

        {/* PHONE HOME INDICATOR BAR */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-50 opacity-60" />
      </div>
    </div>
  );
};

