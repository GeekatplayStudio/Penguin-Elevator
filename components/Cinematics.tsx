import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, TargetAndTransition } from 'framer-motion';

/**
 * Cinematic sequences + sprite accessory overlays.
 *
 * The penguin art is a set of pre-rendered voxel PNGs, so new expressions are
 * built as chunky block-style SVG overlays in the exact same palette, sized to
 * the sprite's real aspect ratio (244x496 for the front view). Everything here
 * reads as part of the same voxel world: square blocks, no smooth curves.
 */

const PAL = {
  NAVY: '#2B3B60',
  NAVY_DARK: '#1B2642',
  WHITE: '#F8FAFC',
  ORANGE: '#F97316',
  ORANGE_DARK: '#C2410C',
  PINK: '#F472B6',
  RED: '#e2483d',
  LIME: '#84CC16',
  CYAN: '#38BDF8',
  GOLD: '#fbbf3c',
};

/** Anchors an overlay to the sprite's actual drawn area inside object-contain */
const SpriteAnchor: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute inset-0 flex justify-center pointer-events-none">
    <div className="relative h-full" style={{ aspectRatio: '244 / 496' }}>
      {children}
    </div>
  </div>
);

/** Closed sleeping eyelids, placed over the front sprite's open eyes */
export const ClosedEyesOverlay: React.FC<{ facing: 'DOWN' | 'LEFT' | 'RIGHT' | 'UP' }> = ({ facing }) => {
  if (facing === 'UP') return null; // back view - no face visible
  const lids =
    facing === 'DOWN'
      ? [{ x: 22, y: 38.5, w: 20 }, { x: 58, y: 38.5, w: 20 }]
      : facing === 'LEFT'
        ? [{ x: 14, y: 38.5, w: 20 }]
        : [{ x: 66, y: 38.5, w: 20 }];
  return (
    <SpriteAnchor>
      {lids.map((lid, i) => (
        <div key={i} className="absolute" style={{ left: `${lid.x}%`, top: `${lid.y}%`, width: `${lid.w}%` }}>
          {/* lid block + tiny lash blocks, voxel style */}
          <div style={{ height: 4, background: PAL.NAVY_DARK, borderRadius: 1 }} />
          <div className="flex justify-between px-[12%]" style={{ marginTop: 1 }}>
            <div style={{ width: 3, height: 3, background: PAL.NAVY_DARK }} />
            <div style={{ width: 3, height: 3, background: PAL.NAVY_DARK }} />
          </div>
        </div>
      ))}
    </SpriteAnchor>
  );
};

/** Angry V-shaped voxel eyebrows for grumpy pile penguins */
export const GrumpyBrowsOverlay: React.FC = () => (
  <SpriteAnchor>
    <div className="absolute" style={{ left: '20%', top: '33%', width: '24%', height: 5, background: PAL.NAVY_DARK, transform: 'rotate(18deg)' }} />
    <div className="absolute" style={{ left: '56%', top: '33%', width: '24%', height: 5, background: PAL.NAVY_DARK, transform: 'rotate(-18deg)' }} />
    {/* grumpy flush */}
    <div className="absolute" style={{ left: '38%', top: '48%', width: '24%', height: 4, background: PAL.RED, opacity: 0.35 }} />
  </SpriteAnchor>
);

/** Chunky voxel sunglasses for the rooftop party */
export const SunglassesOverlay: React.FC = () => (
  <SpriteAnchor>
    <div className="absolute flex items-center" style={{ left: '16%', top: '36.5%', width: '68%' }}>
      <div style={{ flex: 1, height: 11, background: PAL.NAVY_DARK, borderRadius: 2, boxShadow: `inset 0 2px 0 ${PAL.CYAN}55` }} />
      <div style={{ width: 5, height: 3, background: PAL.NAVY_DARK }} />
      <div style={{ flex: 1, height: 11, background: PAL.NAVY_DARK, borderRadius: 2, boxShadow: `inset 0 2px 0 ${PAL.CYAN}55` }} />
    </div>
  </SpriteAnchor>
);

/** A little voxel margarita glass held at flipper height */
export const MargaritaOverlay: React.FC<{ side?: 'left' | 'right' }> = ({ side = 'right' }) => (
  <SpriteAnchor>
    <div className="absolute" style={{ [side === 'right' ? 'right' : 'left']: '-14%', top: '52%', width: '30%' }}>
      <svg viewBox="0 0 14 18" className="w-full" style={{ shapeRendering: 'crispEdges' }}>
        {/* drink */}
        <rect x={2} y={2} width={10} height={3} fill={PAL.LIME} />
        <rect x={3} y={5} width={8} height={2} fill={PAL.LIME} />
        {/* glass rim + bowl */}
        <rect x={1} y={1} width={12} height={1} fill={PAL.WHITE} opacity={0.9} />
        <rect x={2} y={5} width={1} height={2} fill={PAL.WHITE} opacity={0.7} />
        <rect x={11} y={5} width={1} height={2} fill={PAL.WHITE} opacity={0.7} />
        {/* stem + base */}
        <rect x={6} y={7} width={2} height={6} fill={PAL.WHITE} opacity={0.8} />
        <rect x={4} y={13} width={6} height={2} fill={PAL.WHITE} opacity={0.9} />
        {/* lime wedge on the rim */}
        <rect x={11} y={0} width={3} height={3} fill={PAL.LIME} />
        <rect x={12} y={1} width={1} height={1} fill={PAL.WHITE} />
        {/* tiny umbrella */}
        <rect x={0} y={0} width={4} height={1} fill={PAL.PINK} />
        <rect x={1} y={1} width={2} height={1} fill={PAL.PINK} />
      </svg>
    </div>
  </SpriteAnchor>
);

/** Three bright-red voxel exclamation marks - the witness alarm */
export const ExclamationMarks: React.FC = () => (
  <div className="flex gap-1 items-end">
    {[0, 1, 2].map(i => (
      <motion.svg
        key={i}
        viewBox="0 0 6 14"
        className="w-3 h-7 sm:w-3.5 sm:h-8"
        style={{ shapeRendering: 'crispEdges' }}
        animate={{ y: [0, -5, 0], scale: [1, 1.25, 1] }}
        transition={{ repeat: Infinity, duration: 0.32, delay: i * 0.08 }}
      >
        <rect x={1} y={0} width={4} height={8} fill={PAL.RED} stroke="#fff" strokeWidth={0.6} />
        <rect x={1} y={10} width={4} height={4} fill={PAL.RED} stroke="#fff" strokeWidth={0.6} />
      </motion.svg>
    ))}
  </div>
);

/* ============================================================
   INTRO: rooftop party -> fast drop down the shaft -> doors open
   ============================================================ */

type IntroStage = 'ROOF' | 'DIVE' | 'DOORS';

const PartyPenguin: React.FC<{
  sprite: string;
  size: number;
  anim: 'dance' | 'spin' | 'hop' | 'toast' | 'bath';
  accessory?: React.ReactNode;
  flip?: boolean;
  delay?: number;
}> = ({ sprite, size, anim, accessory, flip, delay = 0 }) => {
  const animations: Record<'dance' | 'spin' | 'hop' | 'toast' | 'bath', TargetAndTransition> = {
    // proper dance moves: big jumps, body twists, landing squashes
    dance: {
      y: [0, -22, 0, -8, 0],
      rotate: [-10, 10, -10],
      scaleY: [1, 1.06, 0.92, 1],
      transition: { repeat: Infinity, duration: 0.9, delay },
    },
    // twirling dancer - flips its facing left/right like it's spinning around
    spin: {
      scaleX: [1, 1, -1, -1, 1],
      y: [0, -16, 0, -16, 0],
      transition: { repeat: Infinity, duration: 1.4, delay },
    },
    // pogo-hopper with a little kick tilt at the top
    hop: {
      y: [0, -28, 0],
      rotate: [0, flip ? -14 : 14, 0],
      scaleY: [0.94, 1.08, 0.94],
      transition: { repeat: Infinity, duration: 0.7, delay },
    },
    toast: { rotate: [0, 7, 0, 7, 0], y: [0, -5, 0, -5, 0], transition: { repeat: Infinity, duration: 1.6, delay } },
    bath: { rotate: [86, 90, 86], transition: { repeat: Infinity, duration: 2.2, delay } },
  };
  return (
    <motion.div className="relative" style={{ width: size, height: size * 1.14 }} animate={animations[anim]}>
      <img
        src={sprite}
        alt=""
        className="w-full h-full object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      />
      {accessory}
    </motion.div>
  );
};

/** Falling voxel confetti - little colored squares tumbling down the scene */
const Confetti: React.FC = () => (
  <>
    {Array.from({ length: 18 }).map((_, i) => {
      const left = (i * 137) % 100; // scattered but deterministic
      const color = [PAL.CYAN, PAL.PINK, PAL.GOLD, PAL.LIME, PAL.ORANGE][i % 5];
      const dur = 2.2 + (i % 4) * 0.5;
      return (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${left}%`, top: '-4%', width: i % 3 === 0 ? 8 : 6, height: i % 3 === 0 ? 8 : 6, background: color }}
          animate={{ y: ['0vh', '75vh'], rotate: [0, i % 2 ? 360 : -360], x: [0, i % 2 ? 18 : -18, 0] }}
          transition={{ repeat: Infinity, duration: dur, delay: (i % 6) * 0.4, ease: 'linear' }}
        />
      );
    })}
  </>
);

/** Voxel balloons drifting up past the rooftop */
const Balloons: React.FC = () => (
  <>
    {[
      { left: 8, color: PAL.PINK, delay: 0 },
      { left: 88, color: PAL.CYAN, delay: 1.1 },
      { left: 72, color: PAL.GOLD, delay: 2.0 },
    ].map((b, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${b.left}%`, bottom: '20%' }}
        animate={{ y: [0, -260], x: [0, i % 2 ? 14 : -14, 0], opacity: [0, 1, 1, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, delay: b.delay, ease: 'easeOut' }}
      >
        <svg viewBox="0 0 10 16" className="w-6 h-10" style={{ shapeRendering: 'crispEdges' }}>
          <rect x={2} y={1} width={6} height={6} fill={b.color} />
          <rect x={1} y={2} width={8} height={4} fill={b.color} />
          <rect x={3} y={2} width={2} height={2} fill="#ffffff" opacity={0.5} />
          <rect x={4} y={7} width={2} height={1} fill={b.color} />
          <rect x={4.6} y={8} width={0.8} height={7} fill="#ffffff" opacity={0.5} />
        </svg>
      </motion.div>
    ))}
  </>
);

/** Spinning voxel disco ball with glints, hung from the string lights */
const DiscoBall: React.FC = () => (
  <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '20%' }}>
    <div className="w-0.5 h-8 bg-[#1B2642] mx-auto" />
    <motion.svg
      viewBox="0 0 12 12"
      className="w-10 h-10"
      style={{ shapeRendering: 'crispEdges' }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
    >
      <rect x={3} y={1} width={6} height={10} fill="#94a3b8" />
      <rect x={1} y={3} width={10} height={6} fill="#94a3b8" />
      <rect x={2} y={2} width={2} height={2} fill="#e2e8f0" />
      <rect x={7} y={4} width={2} height={2} fill="#f8fafc" />
      <rect x={4} y={7} width={2} height={2} fill="#e2e8f0" />
      <rect x={8} y={8} width={2} height={2} fill="#cbd5e1" />
    </motion.svg>
    {/* glints thrown off the ball */}
    {[[-30, 10], [34, 4], [-18, 30], [26, 26]].map(([x, y], i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `calc(50% + ${x}px)`, top: 40 + y, width: 5, height: 5, background: '#f8fafc' }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
        transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.35 }}
      />
    ))}
  </div>
);

/** Flashing checkerboard dance floor, cycling party colors */
const DanceFloor: React.FC = () => (
  <div className="absolute left-1/2 -translate-x-1/2 flex" style={{ top: -12, width: '78%', maxWidth: 360 }}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        className="flex-1 h-3"
        animate={{
          backgroundColor: [
            [PAL.CYAN, PAL.PINK, PAL.GOLD, PAL.LIME][i % 4],
            [PAL.PINK, PAL.GOLD, PAL.LIME, PAL.CYAN][i % 4],
            [PAL.GOLD, PAL.LIME, PAL.CYAN, PAL.PINK][i % 4],
            [PAL.CYAN, PAL.PINK, PAL.GOLD, PAL.LIME][i % 4],
          ],
          opacity: [0.85, 0.5, 0.85, 0.85],
        }}
        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
      />
    ))}
  </div>
);

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<IntroStage>('ROOF');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('DIVE'), 3300);
    const t2 = setTimeout(() => setStage('DOORS'), 4700);
    const t3 = setTimeout(onComplete, 5700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 select-none" onClick={onComplete}>

      {/* ROOFTOP PARTY SCENE - slides up and away during the dive */}
      <motion.div
        className="absolute inset-0"
        animate={stage === 'ROOF' ? { y: 0 } : { y: '-120%' }}
        transition={{ duration: 0.7, ease: [0.55, 0, 1, 0.45] }}
      >
        {/* warm sunset sky */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #1e3a8a 0%, #3b82a0 45%, #f2901f 85%, #fbbf3c 100%)' }} />

        {/* voxel sun */}
        <div className="absolute right-[12%] top-[10%]">
          <motion.svg viewBox="0 0 20 20" className="w-16 h-16 sm:w-20 sm:h-20" style={{ shapeRendering: 'crispEdges' }}
            animate={{ rotate: [0, 4, 0, -4, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <rect x={6} y={4} width={8} height={12} fill={PAL.GOLD} />
            <rect x={4} y={6} width={12} height={8} fill={PAL.GOLD} />
            <rect x={7} y={5} width={4} height={4} fill="#fde68a" />
            {[[9, 0], [9, 18], [0, 9], [18, 9], [2, 2], [16, 2], [2, 16], [16, 16]].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width={2} height={2} fill={PAL.GOLD} />
            ))}
          </motion.svg>
        </div>

        {/* sweeping party spotlights from the rooftop corners */}
        <motion.div
          className="absolute bottom-[30%] left-[12%] origin-bottom"
          style={{ width: 60, height: 300, background: `linear-gradient(to top, ${PAL.PINK}44, transparent)`, clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)' }}
          animate={{ rotate: [-24, 24, -24] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[30%] right-[12%] origin-bottom"
          style={{ width: 60, height: 300, background: `linear-gradient(to top, ${PAL.CYAN}44, transparent)`, clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)' }}
          animate={{ rotate: [22, -22, 22] }}
          transition={{ repeat: Infinity, duration: 3.1, ease: 'easeInOut' }}
        />

        {/* string lights across the top of the party - bulbs blink in sequence */}
        <svg className="absolute left-0 right-0 w-full" style={{ top: '30%' }} viewBox="0 0 100 8" preserveAspectRatio="none">
          <path d="M 0 2 Q 25 7 50 3 Q 75 0 100 4" stroke={PAL.NAVY_DARK} strokeWidth={0.5} fill="none" />
        </svg>
        <div className="absolute left-0 right-0" style={{ top: '30%' }}>
          {[8, 20, 33, 46, 60, 73, 86].map((x, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${x}%`, top: i % 2 === 0 ? 14 : 8, width: 7, height: 7, background: [PAL.CYAN, PAL.PINK, PAL.GOLD, PAL.LIME][i % 4] }}
              animate={{ opacity: [1, 0.25, 1], scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }}
            />
          ))}
        </div>

        <DiscoBall />
        <Confetti />
        <Balloons />

        {/* the rooftop slab - same navy voxel language as the game's base platform */}
        <div className="absolute left-0 right-0 bottom-0" style={{ height: '34%' }}>
          <div className="absolute inset-0" style={{
            background: '#24406b',
            boxShadow: 'inset 0 6px 0 #2d4d80, inset 0 -30px 0 #16294a',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 17px, rgba(20,35,66,0.55) 17px, rgba(20,35,66,0.55) 18px), repeating-linear-gradient(90deg, transparent 0px, transparent 17px, rgba(20,35,66,0.55) 17px, rgba(20,35,66,0.55) 18px)',
          }} />

          <DanceFloor />

          {/* beach towel for the sunbather */}
          <div className="absolute" style={{ left: '4%', top: -6, width: 110, height: 34, background: PAL.ORANGE, boxShadow: `inset 0 0 0 3px ${PAL.ORANGE_DARK}, inset 0 10px 0 ${PAL.GOLD}` }} />

          {/* the party - jumpers, spinners, hoppers and one committed sunbather */}
          <div className="absolute left-0 right-0 flex items-end justify-around px-3" style={{ top: -92 }}>
            <PartyPenguin sprite="/sprites/front.png" size={62} anim="bath" accessory={<SunglassesOverlay />} />
            <PartyPenguin sprite="/sprites/front.png" size={70} anim="spin" delay={0.2} />
            <PartyPenguin sprite="/sprites/front.png" size={80} anim="dance" accessory={<><SunglassesOverlay /><MargaritaOverlay /></>} />
            <PartyPenguin sprite="/sprites/right.png" size={68} anim="hop" delay={0.35} />
            <PartyPenguin sprite="/sprites/left.png" size={64} anim="dance" flip delay={0.5} accessory={<MargaritaOverlay side="left" />} />
          </div>
        </div>

        {/* music notes drifting up */}
        {[14, 30, 52, 70, 88].map((x, i) => (
          <motion.div key={i} className="absolute font-pixel text-lg" style={{ left: `${x}%`, bottom: '36%', color: [PAL.PINK, PAL.CYAN, PAL.GOLD][i % 3] }}
            animate={{ y: [-4, -54], x: [0, i % 2 ? 12 : -12], opacity: [0, 1, 0], rotate: [0, i % 2 ? 20 : -20] }}
            transition={{ repeat: Infinity, duration: 1.7, delay: i * 0.35 }}>
            {i % 2 ? '♪' : '♫'}
          </motion.div>
        ))}
      </motion.div>

      {/* THE DIVE - shaft walls whip upward as the camera drops to the ground floor */}
      {stage !== 'ROOF' && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <div className="absolute inset-0 bg-slate-950" />
          {/* passing floor slabs */}
          <motion.div
            className="absolute inset-0"
            animate={{ backgroundPositionY: ['0px', '-2600px'] }}
            transition={{ duration: 1.6, ease: 'easeIn' }}
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 90px, #24406b 90px, #24406b 104px, #16294a 104px, #16294a 110px)`,
            }}
          />
          {/* passing lit windows */}
          <motion.div
            className="absolute inset-0 opacity-70"
            animate={{ backgroundPositionY: ['0px', '-2600px'] }}
            transition={{ duration: 1.6, ease: 'easeIn' }}
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 30px, rgba(251,191,60,0.25) 30px, rgba(251,191,60,0.25) 46px, transparent 46px, transparent 110px)`,
              backgroundSize: '38% 110px',
              backgroundRepeat: 'repeat',
              backgroundPositionX: '31%',
            }}
          />
          {/* vertical guide rails on both shaft walls, dashes streaking upward */}
          {['6%', '12%'].map((left, i) => (
            <React.Fragment key={i}>
              <div className="absolute top-0 bottom-0" style={{ left, width: 6, background: '#1d3358' }} />
              <div className="absolute top-0 bottom-0" style={{ right: left, width: 6, background: '#1d3358' }} />
            </React.Fragment>
          ))}
          <motion.div
            className="absolute top-0 bottom-0"
            style={{
              left: '8.5%', width: 3,
              backgroundImage: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 22px, transparent 22px, transparent 70px)',
            }}
            animate={{ backgroundPositionY: ['0px', '-2800px'] }}
            transition={{ duration: 1.6, ease: 'easeIn' }}
          />
          <motion.div
            className="absolute top-0 bottom-0"
            style={{
              right: '8.5%', width: 3,
              backgroundImage: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 22px, transparent 22px, transparent 70px)',
            }}
            animate={{ backgroundPositionY: ['0px', '-2800px'] }}
            transition={{ duration: 1.6, ease: 'easeIn' }}
          />

          {/* the elevator's steel cables running up the middle of the shaft */}
          {['38%', '61%'].map((left, i) => (
            <motion.div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left, width: 4,
                backgroundImage: 'repeating-linear-gradient(to bottom, #475569 0px, #475569 34px, #64748b 34px, #64748b 40px)',
              }}
              animate={{ backgroundPositionY: ['0px', '-3200px'] }}
              transition={{ duration: 1.6, ease: 'easeIn', delay: i * 0.04 }}
            />
          ))}

          {/* short vertical speed streaks scattered across the frame */}
          {[22, 30, 48, 55, 72, 80].map((x, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${x}%`, top: '-10%', width: 3, height: 46, background: 'rgba(56,189,248,0.35)', borderRadius: 2 }}
              animate={{ y: ['0vh', '120vh'] }}
              transition={{ repeat: Infinity, duration: 0.4 + (i % 3) * 0.12, ease: 'linear', delay: i * 0.07 }}
            />
          ))}

          <div className="absolute inset-x-0 top-6 text-center font-pixel text-[10px] tracking-[0.3em] text-[#8fa2c0] uppercase">Going down...</div>
        </motion.div>
      )}

      {/* ELEVATOR DOORS - close over the dive, then part to reveal the game */}
      {stage === 'DOORS' && (
        <>
          <motion.div
            className="absolute top-0 bottom-0 left-0 w-1/2 z-10"
            style={{ background: 'linear-gradient(to right, #1d3358, #24406b)', borderRight: '4px solid #38bdf8aa', boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.4)' }}
            initial={{ x: '-100%' }}
            animate={{ x: ['-100%', '0%', '0%', '-100%'] }}
            transition={{ duration: 1.0, times: [0, 0.3, 0.55, 1], ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-0 bottom-0 right-0 w-1/2 z-10"
            style={{ background: 'linear-gradient(to left, #1d3358, #24406b)', borderLeft: '4px solid #38bdf8aa', boxShadow: 'inset 20px 0 30px rgba(0,0,0,0.4)' }}
            initial={{ x: '100%' }}
            animate={{ x: ['100%', '0%', '0%', '100%'] }}
            transition={{ duration: 1.0, times: [0, 0.3, 0.55, 1], ease: 'easeInOut' }}
          />
        </>
      )}

      <div className="absolute bottom-4 inset-x-0 text-center font-pixel text-[9px] text-white/40 uppercase tracking-widest z-20">
        Tap to skip
      </div>
    </div>
  );
};

/* ============================================================
   GAME OVER: the floor rides up and away, revealing the pile of
   grumpy dropped penguins at the bottom of the shaft
   ============================================================ */

interface PilePenguinSpec {
  x: number;      // % from left
  bottom: number; // px from pile base
  size: number;
  sprite: string;
  flip: boolean;
  tilt: number;
}

const PILE: PilePenguinSpec[] = [
  // bottom row - big and half-buried
  { x: 8, bottom: -8, size: 64, sprite: '/sprites/left.png', flip: false, tilt: -12 },
  { x: 24, bottom: -4, size: 68, sprite: '/sprites/front.png', flip: false, tilt: 6 },
  { x: 41, bottom: -8, size: 70, sprite: '/sprites/right.png', flip: true, tilt: -5 },
  { x: 58, bottom: -4, size: 66, sprite: '/sprites/front.png', flip: true, tilt: 10 },
  { x: 74, bottom: -8, size: 64, sprite: '/sprites/left.png', flip: true, tilt: 14 },
  // middle row
  { x: 16, bottom: 38, size: 60, sprite: '/sprites/right.png', flip: false, tilt: -18 },
  { x: 33, bottom: 44, size: 62, sprite: '/sprites/front.png', flip: false, tilt: 4 },
  { x: 51, bottom: 44, size: 60, sprite: '/sprites/left.png', flip: false, tilt: 12 },
  { x: 67, bottom: 38, size: 58, sprite: '/sprites/front.png', flip: true, tilt: -8 },
  // upper row
  { x: 27, bottom: 84, size: 54, sprite: '/sprites/front.png', flip: false, tilt: -6 },
  { x: 44, bottom: 90, size: 56, sprite: '/sprites/right.png', flip: false, tilt: 8 },
  { x: 58, bottom: 84, size: 52, sprite: '/sprites/left.png', flip: true, tilt: -14 },
  // king of the mountain
  { x: 42, bottom: 128, size: 50, sprite: '/sprites/front.png', flip: false, tilt: 3 },
];

/**
 * One penguin in the pile: drops in with the mound, sits there fuming, then
 * at its own moment climbs out and stomps off screen - so that by the time
 * the player is looking at the Try Again card, the whole pile is emptying
 * out around it, grumbling all the way.
 */
const PilePenguin: React.FC<{ p: PilePenguinSpec; index: number }> = ({ p, index }) => {
  const [walking, setWalking] = useState(false);
  const dir: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
  // first ones start leaving just as the card appears; the rest trickle out
  const leaveAt = 2600 + index * 480;

  useEffect(() => {
    const t = setTimeout(() => setWalking(true), leaveAt);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="absolute"
      style={{ left: `${p.x}%`, bottom: p.bottom, width: p.size, height: p.size * 1.14, zIndex: 20 - Math.floor(p.bottom / 40) }}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1, rotate: walking ? 0 : p.tilt }}
      transition={{ delay: 1.1 + index * 0.05, duration: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
    >
      {/* horizontal march off screen once it's this penguin's turn */}
      <motion.div
        className="w-full h-full"
        animate={walking ? { x: dir === 'left' ? -520 : 520 } : { x: 0 }}
        transition={walking ? { duration: 2.6, ease: 'linear' } : undefined}
      >
        {/* waddle bounce while walking, slow fume-wobble while sitting */}
        <motion.div
          className="w-full h-full relative"
          animate={walking ? { y: [0, -7, 0] } : { rotate: [0, index % 2 ? 2 : -2, 0] }}
          transition={walking ? { repeat: Infinity, duration: 0.3 } : { repeat: Infinity, duration: 1.6 + (index % 3) * 0.4 }}
        >
          <img
            src={walking ? (dir === 'left' ? '/sprites/left.png' : '/sprites/right.png') : p.sprite}
            alt=""
            className="w-full h-full object-contain"
            style={{ transform: !walking && p.flip ? 'scaleX(-1)' : undefined }}
          />
          <GrumpyBrowsOverlay />
          {/* grumble cloud while stomping off */}
          {walking && (
            <motion.div
              className="absolute -top-5 left-1/2 -translate-x-1/2 font-pixel text-[9px] text-[#8fa2c0] whitespace-nowrap"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
            >
              %&#!
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const PileReveal: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* shaft walls streaking upward - the long ride down in one second */}
    <motion.div
      className="absolute inset-0"
      animate={{ backgroundPositionY: ['0px', '-2200px'] }}
      transition={{ duration: 1.3, ease: 'easeOut' }}
      style={{
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 100px, #1d3358 100px, #1d3358 112px)',
      }}
    />

    {/* the bottom of the shaft rises into view */}
    <motion.div
      className="absolute inset-x-0 bottom-0"
      style={{ height: 300 }}
      initial={{ y: 320 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, delay: 0.9, ease: [0.2, 0.8, 0.3, 1] }}
    >
      {/* concrete pit floor, voxel-gridded like the game's base */}
      <div className="absolute inset-x-0 bottom-0 h-16" style={{
        background: '#16294a',
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 17px, rgba(13,21,38,0.7) 17px, rgba(13,21,38,0.7) 18px)',
        boxShadow: 'inset 0 4px 0 #1d3358',
      }} />

      {/* the mountain of grumpy penguins - every one eventually climbs out
          and stomps off screen while the Try Again card is showing */}
      <div className="absolute inset-x-0 bottom-10 h-56 max-w-md mx-auto">
        {PILE.map((p, i) => (
          <PilePenguin key={i} p={p} index={i} />
        ))}

        {/* angry steam puffs off the pile - fade out as the pile empties */}
        {[30, 50, 66].map((x, i) => (
          <motion.div key={i} className="absolute font-pixel text-xs text-[#8fa2c0]" style={{ left: `${x}%`, bottom: 150 }}
            animate={{ y: [-2, -26], opacity: [0, 0.8, 0] }}
            transition={{ repeat: 4, duration: 1.4, delay: 1.4 + i * 0.45 }}>
            &#x2668;
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);
