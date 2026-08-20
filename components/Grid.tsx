import React, { useState } from 'react';
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

interface SquareTileProps {
  x: number;
  y: number;
  isOpen: boolean;
  isMonitored: boolean;
  showVision: boolean;
  teachOpacity: number; // training-wheels tint strength, fades out by floor 50
  onClick: () => void;
  children?: React.ReactNode;
}

const SquareTile: React.FC<SquareTileProps> = ({
  x,
  y,
  isOpen,
  isMonitored,
  showVision,
  teachOpacity,
  onClick,
  children
}) => {
  const pos = getGridPos(x, y);
  const isAlt = (x + y) % 2 === 1;
  const holeGradId = `tileHole-${x}-${y}`;

  // Checkerboard palette from the platform reference: cream and charcoal tops
  const topColor = isAlt ? '#33322e' : '#efece2';
  const lipColor = isAlt ? '#1d1c1a' : '#c3bfb2';
  const seamColor = isAlt ? '#211f1d' : '#d6d2c5';

  return (
    <div
      className="absolute select-none touch-manipulation"
      style={{
        left: pos.left,
        top: pos.top,
        width: TILE_W,
        height: TILE_H + TILE_LIP,
        zIndex: y * 10,
      }}
    >
      <svg
        viewBox={`0 0 ${TILE_W} ${TILE_H + TILE_LIP}`}
        className="w-full h-full cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <defs>
          <radialGradient id={holeGradId} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#1b3550" />
            <stop offset="55%" stopColor="#0a1024" />
            <stop offset="100%" stopColor="#05070f" />
          </radialGradient>
        </defs>

        {/* FRONT LIP - the block's visible depth edge */}
        <rect x={0} y={TILE_H} width={TILE_W} height={TILE_LIP} fill={lipColor} />

        {!isOpen ? (
          <g className="hover:brightness-110">
            {/* TOP FACE */}
            <rect x={0} y={0} width={TILE_W} height={TILE_H} fill={topColor} />
            {/* Cube stud seams - 4x4 sub-grid like the reference platform */}
            {Array.from({ length: 3 }).map((_, i) => (
              <g key={i}>
                <line x1={((i + 1) * TILE_W) / 4} y1={0} x2={((i + 1) * TILE_W) / 4} y2={TILE_H} stroke={seamColor} strokeWidth="1.2" />
                <line x1={0} y1={((i + 1) * TILE_H) / 4} x2={TILE_W} y2={((i + 1) * TILE_H) / 4} stroke={seamColor} strokeWidth="1.2" />
              </g>
            ))}
            {/* Soft top-light: brighter at the far (top) edge for the camera tilt */}
            <rect x={0} y={0} width={TILE_W} height={TILE_H} fill="url(#gridTileLight)" opacity={0.18} style={{ mixBlendMode: 'overlay' }} />
            {/* Tile border */}
            <rect x={0.5} y={0.5} width={TILE_W - 1} height={TILE_H - 1} fill="none" stroke={seamColor} strokeWidth="1.5" />

            {/* WATCHED-CELL TINT - teaches vision on the first ~25 floors,
                fades away by floor 50; the V overlay brings it back strong */}
            {isMonitored && (showVision || teachOpacity > 0.01) && (
              <rect x={2} y={2} width={TILE_W - 4} height={TILE_H - 4} fill="#e2483d" opacity={showVision ? 0.35 : teachOpacity} rx={4} />
            )}
          </g>
        ) : (
          /* OPEN TRAPDOOR HOLE */
          <g>
            <rect x={0} y={0} width={TILE_W} height={TILE_H} fill={`url(#${holeGradId})`} stroke="#0f172a" strokeWidth="2" />
            <ellipse cx={TILE_W / 2} cy={TILE_H / 2} rx="20" ry="12" fill="#38bdf8" opacity="0.3" className="animate-ping" />
            <ellipse cx={TILE_W / 2} cy={TILE_H / 2} rx="10" ry="6" fill="#7dd3fc" opacity="0.5" />
            {/* Opened trapdoor leaves swung to the sides */}
            <rect x={0} y={0} width={10} height={TILE_H} fill="#475569" stroke="#0f172a" />
            <rect x={TILE_W - 10} y={0} width={10} height={TILE_H} fill="#475569" stroke="#0f172a" />
          </g>
        )}
      </svg>

      {/* CHILDREN (PENGUIN / FISH) - feet anchored on the tile top face */}
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center pointer-events-none z-10"
        style={{ height: TILE_H, paddingBottom: 6 }}
      >
        {children}
      </div>
    </div>
  );
};

export const Grid: React.FC<GridProps> = ({
  gameState,
  onDrop,
  onTileClick,
  monitoredCells,
  floatingScores = []
}) => {
  const [hoveredPenguinId, setHoveredPenguinId] = useState<string | null>(null);
  const isMoving = gameState.elevatorState === 'MOVING';

  // Training wheels: watched tiles glow softly on early floors so players
  // learn how penguins see, then the hint fades out between floors 25-50.
  const floor = gameState.floor;
  const teachOpacity = floor <= 25 ? 0.14 : floor <= 50 ? 0.14 * (1 - (floor - 25) / 25) : 0;

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
        {/* NAVY VOXEL BASE PLATFORM - a rectangular rim of navy cubes under the checkerboard */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: -18,
            top: -18,
            width: BOARD_W + 36,
            height: BOARD_H + 40,
            background: '#24406b',
            boxShadow: '0 26px 40px rgba(0,0,0,0.75), inset 0 -22px 0 #16294a, inset 0 2px 0 #2d4d80',
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0px, transparent 17px, rgba(20,35,66,0.55) 17px, rgba(20,35,66,0.55) 18px), repeating-linear-gradient(90deg, transparent 0px, transparent 17px, rgba(20,35,66,0.55) 17px, rgba(20,35,66,0.55) 18px)',
          }}
        />

        {/* Shared far-edge light gradient used by all tiles */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="gridTileLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
        </svg>

        {/* 4x4 SQUARE GRID */}
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          Array.from({ length: GRID_SIZE }).map((_, x) => {
            const penguin = gameState.penguins.find(p => p.x === x && p.y === y);
            const isTrapdoorOpen = penguin?.isFalling || false;
            const isMonitored = monitoredCells?.has(`${x},${y}`) || false;
            const isFishHere = gameState.fishTreat && gameState.fishTreat.active && gameState.fishTreat.x === x && gameState.fishTreat.y === y;

            return (
              <SquareTile
                key={`${x}-${y}`}
                x={x}
                y={y}
                isOpen={isTrapdoorOpen}
                isMonitored={isMonitored}
                showVision={gameState.showVisionCones}
                teachOpacity={teachOpacity}
                onClick={() => {
                  if (penguin) {
                    onDrop(penguin.id);
                  } else if (onTileClick) {
                    onTileClick(x, y);
                  }
                }}
              >
                {/* 8-BIT FISH TREAT ICON */}
                {isFishHere && (
                  <motion.div
                    initial={{ scale: 0, y: -30 }}
                    animate={{ scale: 1.2, y: -6 }}
                    className="absolute z-20 pointer-events-none flex flex-col items-center"
                  >
                    <svg viewBox="0 0 16 16" className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(56,189,248,0.8)] animate-bounce" style={{ shapeRendering: 'crispEdges' }}>
                      <rect x="3" y="6" width="10" height="4" fill="#38bdf8" />
                      <rect x="5" y="4" width="6" height="8" fill="#0284c7" />
                      <rect x="1" y="5" width="2" height="6" fill="#f59e0b" />
                      <rect x="6" y="6" width="2" height="2" fill="#ffffff" />
                      <rect x="7" y="7" width="1" height="1" fill="#000000" />
                    </svg>
                  </motion.div>
                )}

                {penguin && (
                  <Penguin
                    penguin={
                      gameState.fishTreat?.active && !penguin.isFalling && !penguin.isPanic && penguin.type !== 'SLEEPY'
                        ? { ...penguin, isDistracted: true, distractionDir: getDirectionTowards(penguin, gameState.fishTreat) }
                        : penguin
                    }
                    isHovered={hoveredPenguinId === penguin.id}
                    onClick={() => onDrop(penguin.id)}
                    onHoverStart={() => setHoveredPenguinId(penguin.id)}
                    onHoverEnd={() => setHoveredPenguinId(null)}
                    isWitness={gameState.witnessIds.includes(penguin.id)}
                    showVisionCone={gameState.showVisionCones}
                  />
                )}
              </SquareTile>
            );
          })
        ))}

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
                className="absolute font-pixel font-bold text-lg sm:text-xl drop-shadow-[0_3px_6px_#000000] pointer-events-none z-50 tracking-tighter whitespace-nowrap"
                style={{ color: score.color }}
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
