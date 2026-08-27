import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, FloatingScore } from '../types';
import { GRID_SIZE } from '../constants';
import { Penguin } from './Penguin';
import { getDirectionTowards } from '../utils/gameLogic';

interface GridProps {
  gameState: GameState;
  onDrop: (id: string) => void;
  onTileClick?: (x: number, y: number) => void;
  monitoredCells?: Set<string>;
  floatingScores?: FloatingScore[];
}

// STRAIGHT-ON 3D GRID - squares face the camera, viewed slightly from above.
// Penguins stand on flat square tiles and face the SIDES (up/down/left/right),
// never the corners. Depth is conveyed with a front lip on each tile row.
const TILE_W = 92;       // tile width on screen
const TILE_H = 74;       // tile top-face height (compressed = camera tilt)
const TILE_LIP = 14;     // visible front edge of each tile block

export const getGridPos = (x: number, y: number) => ({
  left: x * TILE_W,
  top: y * TILE_H,
});

const BOARD_W = GRID_SIZE * TILE_W;
const BOARD_H = GRID_SIZE * TILE_H + TILE_LIP;

// The navy base slab the checkerboard sits on. The rim is the SAME on all
// four sides so the board is actually centred on its platform - an earlier
// version padded the bottom by 22 against 18 everywhere else, which read as
// the checkerboard sitting too high with a gap underneath.
const PLATFORM_RIM = 18;
const PLATFORM_W = BOARD_W + PLATFORM_RIM * 2;
const PLATFORM_H = BOARD_H + PLATFORM_RIM * 2;

// Voxel texture on the slab. The cell size is derived so a WHOLE number of
// cells spans the slab in each axis: a fixed 18px cell left a clipped half
// cell along the bottom and right edges, so the little grid looked shifted
// and cut off exactly where the rim is visible.
const VOXEL_TARGET = 18;
const VOXEL_W = PLATFORM_W / Math.round(PLATFORM_W / VOXEL_TARGET);
const VOXEL_H = PLATFORM_H / Math.round(PLATFORM_H / VOXEL_TARGET);

/* ------------------------------------------------------------------ *
 * RENDERING ARCHITECTURE (WebView performance)
 *
 * The board is split into three layers so a state change repaints the
 * least possible area. This replaced a version where all 16 tiles were
 * full SVGs re-rendered on every game tick, each with a mix-blend-mode
 * overlay - mid-range Android composited them tile by tile, which the
 * player saw as squares flickering in one at a time.
 *
 *   1. StaticBoard  - every tile face, seam, lip and lighting baked
 *                     into ONE SVG that never re-renders (React.memo
 *                     with no props). No blend modes, no filters.
 *   2. TileOverlay  - per-tile dynamic bits only: the watched tint,
 *                     the open trapdoor hole, and the tap target.
 *                     Memoized; most ticks change none of them.
 *   3. Actor layer  - penguins, fish, floating scores. Re-renders
 *                     follow gameplay, never touch layers 1-2.
 * ------------------------------------------------------------------ */

/** Layer 0: the navy slab under the board. Static - painted once. */
const BasePlatform = React.memo(() => (
  <div
    className="absolute rounded-lg pointer-events-none overflow-hidden"
    style={{
      left: -PLATFORM_RIM,
      top: -PLATFORM_RIM,
      width: PLATFORM_W,
      height: PLATFORM_H,
      background: '#24406b',
      boxShadow: `0 26px 40px rgba(0,0,0,0.75), inset 0 -${PLATFORM_RIM}px 0 #16294a, inset 0 2px 0 #2d4d80`,
    }}
  >
    {/* Texture sits ABOVE the inset shading, so the voxel grid carries across
        the slab's darker front face instead of stopping short of the bottom. */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(20,35,66,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,35,66,0.55) 1px, transparent 1px)',
        backgroundSize: `${VOXEL_W}px ${VOXEL_H}px`,
      }}
    />
  </div>
));
BasePlatform.displayName = 'BasePlatform';

/** Layer 1: the whole checkerboard painted once. */
const StaticBoard = React.memo(() => {
  const tiles: React.ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isAlt = (x + y) % 2 === 1;
      const topColor = isAlt ? '#33322e' : '#efece2';
      const lipColor = isAlt ? '#1d1c1a' : '#c3bfb2';
      const seamColor = isAlt ? '#211f1d' : '#d6d2c5';
      const ox = x * TILE_W;
      const oy = y * TILE_H;
      // Only the last row's front lip is actually visible - every other row's
      // lip is covered by the tile below it. Where it IS visible, the block's
      // face has to be finished: the vertical seams and the outline run down
      // over it, or the bottom row reads as a half-drawn square.
      const lipShows = y === GRID_SIZE - 1;
      const faceH = TILE_H + (lipShows ? TILE_LIP : 0);
      const seams: React.ReactNode[] = [];
      for (let i = 1; i < 4; i++) {
        seams.push(<line key={'v' + i} x1={ox + (i * TILE_W) / 4} y1={oy} x2={ox + (i * TILE_W) / 4} y2={oy + faceH} stroke={seamColor} strokeWidth="1.2" />);
        seams.push(<line key={'h' + i} x1={ox} y1={oy + (i * TILE_H) / 4} x2={ox + TILE_W} y2={oy + (i * TILE_H) / 4} stroke={seamColor} strokeWidth="1.2" />);
      }
      tiles.push(
        <g key={x + '-' + y}>
          {/* front lip only shows where the row below does not cover it,
              but drawing it everywhere is harmless and keeps this simple */}
          <rect x={ox} y={oy + TILE_H} width={TILE_W} height={TILE_LIP} fill={lipColor} />
          <rect x={ox} y={oy} width={TILE_W} height={TILE_H} fill={topColor} />
          {seams}
          {/* baked top-light: plain alpha gradient, NO mix-blend-mode */}
          <rect x={ox} y={oy} width={TILE_W} height={TILE_H} fill="url(#tileLight)" />
          <rect x={ox + 0.5} y={oy + 0.5} width={TILE_W - 1} height={faceH - 1} fill="none" stroke={seamColor} strokeWidth="1.5" />
        </g>
      );
    }
  }
  return (
    <svg
      width={BOARD_W}
      height={BOARD_H}
      viewBox={'0 0 ' + BOARD_W + ' ' + BOARD_H}
      className="absolute left-0 top-0 pointer-events-none"
    >
      <defs>
        <linearGradient id="tileLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
        </linearGradient>
        <radialGradient id="tileHole" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#1b3550" />
          <stop offset="55%" stopColor="#0a1024" />
          <stop offset="100%" stopColor="#05070f" />
        </radialGradient>
      </defs>
      {tiles}
    </svg>
  );
});
StaticBoard.displayName = 'StaticBoard';

/** Layer 2: one tile's dynamic overlay - tint, hole, tap target. */
interface TileOverlayProps {
  x: number;
  y: number;
  isOpen: boolean;
  isMonitored: boolean;
  showVision: boolean;
  teachOpacity: number; // training-wheels tint strength, fades out by floor 50
  onTilePress: (x: number, y: number) => void;
}

const TileOverlay = React.memo<TileOverlayProps>(({ x, y, isOpen, isMonitored, showVision, teachOpacity, onTilePress }) => {
  const pos = getGridPos(x, y);
  const showTint = !isOpen && isMonitored && (showVision || teachOpacity > 0.01);
  // Match StaticBoard: on the last row the front lip is exposed, so the
  // watched-tile marking has to cover it as well - otherwise the bottom row's
  // red squares look clipped compared to every other row. It widens the tap
  // target by the same 14px, which is no loss on a phone.
  const cellH = TILE_H + (y === GRID_SIZE - 1 ? TILE_LIP : 0);

  return (
    <div
      className="absolute select-none touch-manipulation cursor-pointer"
      style={{ left: pos.left, top: pos.top, width: TILE_W, height: cellH, zIndex: 5 }}
      onClick={(e) => { e.stopPropagation(); onTilePress(x, y); }}
    >
      {/* WATCHED-CELL MARKING - a fill plus a border ring. The ring matters:
          on an occupied tile the penguin sprite covers most of the fill, and
          the occupied tile is exactly the one the player is judging before a
          drop. The ring stays visible around the sprite's feet. Plain divs -
          no SVG repaint involved. */}
      {showTint && (
        <>
          <div
            className="absolute rounded"
            style={{
              left: 2, top: 2, right: 2, bottom: 2,
              background: '#e2483d',
              opacity: showVision ? 0.35 : teachOpacity,
            }}
          />
          <div
            className="absolute rounded"
            style={{
              left: 2, top: 2, right: 2, bottom: 2,
              border: '2px solid #e2483d',
              opacity: showVision ? 0.9 : Math.min(0.7, teachOpacity * 3.5),
            }}
          />
        </>
      )}

      {/* OPEN TRAPDOOR HOLE - only exists while a penguin is falling */}
      {isOpen && (
        <svg width={TILE_W} height={TILE_H} viewBox={'0 0 ' + TILE_W + ' ' + TILE_H} className="absolute left-0 top-0">
          <rect x={0} y={0} width={TILE_W} height={TILE_H} fill="url(#tileHole)" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={TILE_W / 2} cy={TILE_H / 2} rx="20" ry="12" fill="#38bdf8" opacity="0.3" />
          <ellipse cx={TILE_W / 2} cy={TILE_H / 2} rx="10" ry="6" fill="#7dd3fc" opacity="0.5" />
          <rect x={0} y={0} width={10} height={TILE_H} fill="#475569" stroke="#0f172a" />
          <rect x={TILE_W - 10} y={0} width={10} height={TILE_H} fill="#475569" stroke="#0f172a" />
        </svg>
      )}
    </div>
  );
});
TileOverlay.displayName = 'TileOverlay';

export const Grid: React.FC<GridProps> = ({
  gameState,
  onDrop,
  onTileClick,
  monitoredCells,
  floatingScores = []
}) => {
  const [hoveredPenguinId, setHoveredPenguinId] = useState<string | null>(null);
  const isMoving = gameState.elevatorState === 'MOVING';

  // Training wheels: watched tiles are clearly marked at FULL strength for
  // the entire first 50 floors (the whole learning arc of the difficulty
  // curve), then fade out between 51 and 70. The V overlay always works.
  const floor = gameState.floor;
  const teachOpacity = floor <= 50 ? 0.18 : floor <= 70 ? 0.18 * (1 - (floor - 50) / 20) : 0;

  // Stable across renders so TileOverlay's memo actually holds. Reads the
  // freshest penguins via the ref pattern rather than re-binding callbacks.
  const stateRef = React.useRef({ penguins: gameState.penguins, onDrop, onTileClick });
  stateRef.current = { penguins: gameState.penguins, onDrop, onTileClick };
  const handleTilePress = useCallback((x: number, y: number) => {
    const { penguins, onDrop: drop, onTileClick: tileClick } = stateRef.current;
    const penguin = penguins.find(p => p.x === x && p.y === y);
    if (penguin) drop(penguin.id);
    else if (tileClick) tileClick(x, y);
  }, []);

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) cells.push({ x, y });

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
     {/* Fit the board inside narrow phone screens */}
     <div className="scale-[0.8] sm:scale-90 origin-center">
      {/* SHAKE EFFECT ON PANIC OR ELEVATOR MOVEMENT */}
      <motion.div
        className="relative"
        style={{ width: BOARD_W, height: BOARD_H }}
        animate={
          gameState.witnessIds.length > 0
            ? { x: [-10, 10, -8, 8, -4, 4, 0], y: [-5, 5, -3, 3, 0] }
            : isMoving
              ? { y: [0, 4, 0] }
              : {}
        }
        transition={gameState.witnessIds.length > 0 ? { duration: 0.5 } : { repeat: Infinity, duration: 0.12 }}
      >
        {/* LAYER 0: navy voxel slab under the checkerboard */}
        <BasePlatform />

        {/* LAYER 1: static checkerboard, painted once */}
        <StaticBoard />

        {/* LAYER 2: per-tile dynamic overlays */}
        {cells.map(({ x, y }) => {
          const penguin = gameState.penguins.find(p => p.x === x && p.y === y);
          return (
            <TileOverlay
              key={x + '-' + y}
              x={x}
              y={y}
              isOpen={penguin?.isFalling || false}
              isMonitored={monitoredCells?.has(x + ',' + y) || false}
              showVision={gameState.showVisionCones}
              teachOpacity={teachOpacity}
              onTilePress={handleTilePress}
            />
          );
        })}

        {/* LAYER 3: actors - the fish and the penguins, placed by grid coords */}
        {gameState.fishTreat?.active && (
          <motion.div
            initial={{ scale: 0, y: -30 }}
            animate={{ scale: 1.2, y: -6 }}
            className="absolute z-20 pointer-events-none flex justify-center"
            style={{
              left: getGridPos(gameState.fishTreat.x, gameState.fishTreat.y).left,
              top: getGridPos(gameState.fishTreat.x, gameState.fishTreat.y).top,
              width: TILE_W,
              height: TILE_H,
            }}
          >
            <svg viewBox="0 0 16 16" className="w-9 h-9 animate-bounce" style={{ shapeRendering: 'crispEdges' }}>
              <rect x="3" y="6" width="10" height="4" fill="#38bdf8" />
              <rect x="5" y="4" width="6" height="8" fill="#0284c7" />
              <rect x="1" y="5" width="2" height="6" fill="#f59e0b" />
              <rect x="6" y="6" width="2" height="2" fill="#ffffff" />
              <rect x="7" y="7" width="1" height="1" fill="#000000" />
            </svg>
          </motion.div>
        )}

        {gameState.penguins.map(penguin => {
          const pos = getGridPos(penguin.x, penguin.y);
          const shown =
            gameState.fishTreat?.active && !penguin.isFalling && !penguin.isPanic && penguin.type !== 'SLEEPY'
              ? { ...penguin, isDistracted: true, distractionDir: getDirectionTowards(penguin, gameState.fishTreat) }
              : penguin;
          return (
            <div
              key={penguin.id}
              className="absolute flex items-end justify-center pointer-events-none"
              style={{ left: pos.left, top: pos.top, width: TILE_W, height: TILE_H, paddingBottom: 6, zIndex: 10 + penguin.y }}
            >
              <Penguin
                penguin={shown}
                isHovered={hoveredPenguinId === penguin.id}
                onClick={() => onDrop(penguin.id)}
                onHoverStart={() => setHoveredPenguinId(penguin.id)}
                onHoverEnd={() => setHoveredPenguinId(null)}
                isWitness={gameState.witnessIds.includes(penguin.id)}
                showVisionCone={gameState.showVisionCones}
              />
            </div>
          );
        })}

        {/* FLOATING SCORE POPUPS */}
        <AnimatePresence>
          {floatingScores.map(score => {
            const pos = getGridPos(score.x, score.y);
            return (
              <motion.div
                key={score.id}
                initial={{ opacity: 1, y: pos.top - 30, x: pos.left + TILE_W / 2 - 20, scale: 0.8 }}
                animate={{ opacity: 0, y: pos.top - 90, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className="absolute font-pixel font-bold text-lg sm:text-xl pointer-events-none z-50 tracking-tighter whitespace-nowrap"
                style={{ color: score.color, textShadow: '0 3px 6px #000000' }}
              >
                {score.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
     </div>
    </div>
  );
};
