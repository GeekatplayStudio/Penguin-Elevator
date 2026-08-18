import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, FloatingScore } from '../types';
import { GRID_SIZE } from '../constants';
import { Penguin } from './Penguin';

interface GridProps {
  gameState: GameState;
  onDrop: (id: string) => void;
  onTileClick?: (x: number, y: number) => void;
  monitoredCells?: Set<string>;
  floatingScores?: FloatingScore[];
}

// 2.5D ISOMETRIC DIAMOND TILE DIMENSIONS (2:1 classic isometric ratio)
const TILE_WIDTH = 110; 
const TILE_HEIGHT = 55;
const TILE_SLAB_DEPTH = 16;

/**
 * Converts 2D grid coordinates (x, y) into 2.5D Isometric screen coordinates (left, top)
 */
export const getIsometricPos = (x: number, y: number) => {
  return {
    left: (x - y) * (TILE_WIDTH / 2),
    top: (x + y) * (TILE_HEIGHT / 2),
  };
};

interface SquareTileProps {
  x: number;
  y: number;
  isOpen: boolean;
  isMonitored: boolean;
  showVision: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

/**
 * 8-BIT ISOMETRIC DIAMOND TILE COMPONENT
 * Rendered with pure SVG pixel art paths - zero CSS distortion!
 */
const SquareTile: React.FC<SquareTileProps> = ({ 
  x, 
  y, 
  isOpen, 
  isMonitored,
  onClick,
  children 
}) => {
  const pos = getIsometricPos(x, y);
  const zIndex = (x + y) * 10;
  const isAlt = (x + y) % 2 === 1;
  const holeGradId = `tileHole-${x}-${y}`;

  // Checkerboard palette straight off the platform reference: cream and
  // charcoal tops, each with darker matching side faces for the cube depth.
  const topColor = isAlt ? '#33322e' : '#efece2';
  const leftColor = isAlt ? '#1d1c1a' : '#c3bfb2';
  const rightColor = isAlt ? '#282723' : '#d9d5c8';
  const seamColor = isAlt ? '#1a1917' : '#cbc7ba';

  // The reference tiles are visibly built from a grid of small cubes, so the
  // top face is subdivided with seam lines along both isometric axes.
  const STUDS = 4;
  const studPoint = (u: number, v: number) => ({
    x: TILE_WIDTH / 2 + (u * TILE_WIDTH) / 2 - (v * TILE_WIDTH) / 2,
    y: (u * TILE_HEIGHT) / 2 + (v * TILE_HEIGHT) / 2,
  });
  const seams: string[] = [];
  for (let i = 1; i < STUDS; i++) {
    const t = i / STUDS;
    const a = studPoint(t, 0);
    const b = studPoint(t, 1);
    seams.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    const c = studPoint(0, t);
    const d = studPoint(1, t);
    seams.push(`M ${c.x} ${c.y} L ${d.x} ${d.y}`);
  }

  // Per-stud lit faces: studs nearer the light (upper-left of the diamond)
  // are brighter, giving the tile genuine cube relief instead of flat colour.
  const shiftTileHex = (hex: string, amount: number) => {
    const n = parseInt(hex.slice(1), 16);
    const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    const r = cl(((n >> 16) & 255) + amount);
    const g = cl(((n >> 8) & 255) + amount);
    const b = cl((n & 255) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  const studFaces: { path: string; fill: string }[] = [];
  for (let u = 0; u < STUDS; u++) {
    for (let v = 0; v < STUDS; v++) {
      const p0 = studPoint(u / STUDS, v / STUDS);
      const p1 = studPoint((u + 1) / STUDS, v / STUDS);
      const p2 = studPoint((u + 1) / STUDS, (v + 1) / STUDS);
      const p3 = studPoint(u / STUDS, (v + 1) / STUDS);
      // brighter toward the top corner of the diamond, darker toward the bottom
      const depth = (u + v) / (2 * STUDS - 2);
      const amount = Math.round(14 - depth * 26);
      studFaces.push({
        path: `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`,
        fill: shiftTileHex(topColor, amount),
      });
    }
  }

  return (
    <div
      className="absolute select-none touch-manipulation transition-transform duration-100"
      style={{
        left: `calc(50% + ${pos.left}px)`,
        top: `calc(50% + ${pos.top - 80}px)`, // Centered vertically in layout
        width: TILE_WIDTH,
        height: TILE_HEIGHT + TILE_SLAB_DEPTH + 40,
        transform: 'translate(-50%, -50%)',
        zIndex: zIndex,
        pointerEvents: 'none', // the div's rectangular box must never steal clicks meant for a neighboring tile
      }}
    >
      {/* ISOMETRIC TILE SVG - pointer events are re-enabled only on the actual
          painted shapes below, so hit-testing follows the diamond/slab
          outline instead of this element's bounding rectangle. */}
      <svg
        viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT + TILE_SLAB_DEPTH}`}
        className="w-full h-full overflow-visible drop-shadow-[0_10px_14px_rgba(0,0,0,0.75)]"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <radialGradient id={holeGradId} cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#1b3550" />
            <stop offset="55%" stopColor="#0a1024" />
            <stop offset="100%" stopColor="#05070f" />
          </radialGradient>
        </defs>

        {/* Everything below is the actual clickable tile - click hits only
            register within these painted shapes, so overlapping tiles never
            block each other and clicking the platform (top face or the two
            side walls) always works. */}
        <g
          className="group cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {/* 1. LEFT 3D SLAB WALL */}
          <path
            d={`M 0 ${TILE_HEIGHT / 2} L ${TILE_WIDTH / 2} ${TILE_HEIGHT} L ${TILE_WIDTH / 2} ${TILE_HEIGHT + TILE_SLAB_DEPTH} L 0 ${TILE_HEIGHT / 2 + TILE_SLAB_DEPTH} Z`}
            fill={leftColor}
          />

          {/* 2. RIGHT 3D SLAB WALL */}
          <path
            d={`M ${TILE_WIDTH / 2} ${TILE_HEIGHT} L ${TILE_WIDTH} ${TILE_HEIGHT / 2} L ${TILE_WIDTH} ${TILE_HEIGHT / 2 + TILE_SLAB_DEPTH} L ${TILE_WIDTH / 2} ${TILE_HEIGHT + TILE_SLAB_DEPTH} Z`}
            fill={rightColor}
          />

          {/* 3. TRAPDOOR / TOP TILE SURFACE */}
          {!isOpen ? (
            <g>
              {/* Top Surface Diamond */}
              <path
                d={`M ${TILE_WIDTH / 2} 0 L ${TILE_WIDTH} ${TILE_HEIGHT / 2} L ${TILE_WIDTH / 2} ${TILE_HEIGHT} L 0 ${TILE_HEIGHT / 2} Z`}
                fill={topColor}
                className="group-hover:brightness-110 transition-all"
              />

              {/* Each stud gets its own lit top face so the tile reads as a
                  block of 3D cubes rather than a flat painted diamond. */}
              {studFaces.map((d, i) => (
                <path key={i} d={d.path} fill={d.fill} />
              ))}

              {/* Cube seams between studs */}
              <path d={seams.join(' ')} stroke={seamColor} strokeWidth="1.1" fill="none" strokeLinecap="round" />


            </g>
          ) : (
            /* OPEN TRAPDOOR ABYSS HOLE */
            <g>
              {/* Dark Abyss Hole */}
              <path
                d={`M ${TILE_WIDTH / 2} 0 L ${TILE_WIDTH} ${TILE_HEIGHT / 2} L ${TILE_WIDTH / 2} ${TILE_HEIGHT} L 0 ${TILE_HEIGHT / 2} Z`}
                fill={`url(#${holeGradId})`}
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Glowing inner abyss effect */}
              <ellipse cx={TILE_WIDTH / 2} cy={TILE_HEIGHT / 2} rx="20" ry="10" fill="#38bdf8" opacity="0.3" className="animate-ping" />
              <ellipse cx={TILE_WIDTH / 2} cy={TILE_HEIGHT / 2} rx="10" ry="5" fill="#7dd3fc" opacity="0.5" />

              {/* Left Opened Trapdoor Leaf */}
              <path
                d={`M 0 ${TILE_HEIGHT / 2} L ${TILE_WIDTH / 4} ${TILE_HEIGHT / 4} L ${TILE_WIDTH / 4 - 8} ${TILE_HEIGHT / 2} Z`}
                fill="#475569"
                stroke="#0f172a"
              />

              {/* Right Opened Trapdoor Leaf */}
              <path
                d={`M ${TILE_WIDTH} ${TILE_HEIGHT / 2} L ${TILE_WIDTH * 0.75} ${TILE_HEIGHT * 0.75} L ${TILE_WIDTH * 0.75 + 8} ${TILE_HEIGHT / 2} Z`}
                fill="#475569"
                stroke="#0f172a"
              />
            </g>
          )}
        </g>
      </svg>

      {/* CHILDREN (PENGUIN / FISH ITEM) - anchored so feet rest on the tile's top face, not its center */}
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center pointer-events-none z-10"
        style={{ height: TILE_HEIGHT + TILE_SLAB_DEPTH + 40, paddingBottom: TILE_SLAB_DEPTH + 34 }}
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

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* NAVY VOXEL BASE PLATFORM - the raised rim the checkerboard sits in,
            traced from the platform reference: navy cubes, two courses deep. */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{ top: '50%', transform: 'translate(-50%, -50%)', marginTop: 22 }}
        >
          <svg viewBox="0 0 560 340" className="w-[560px] h-[340px] drop-shadow-[0_22px_34px_rgba(0,0,0,0.75)]">
            {(() => {
              // The 4x4 grid occupies a diamond of halfW 220 / halfH 110 centred
              // on the layout; the base is that diamond plus a one-cube rim.
              const cxp = 280;
              const cyp = 150;
              const halfW = 258;
              const halfH = 129;
              const depth = 30;
              const top = `${cxp},${cyp - halfH}`;
              const right = `${cxp + halfW},${cyp}`;
              const bottom = `${cxp},${cyp + halfH}`;
              const left = `${cxp - halfW},${cyp}`;

              // Cube seams across the rim's top face, matching the tile stud scale
              const N = 20;
              const pt = (u: number, v: number) => ({
                x: cxp + (u - v) * (halfW / N),
                y: cyp - halfH + (u + v) * (halfH / N),
              });
              const rimSeams: string[] = [];
              for (let i = 1; i < N; i++) {
                const a = pt(i, 0);
                const b = pt(i, N);
                rimSeams.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
                const c = pt(0, i);
                const d = pt(N, i);
                rimSeams.push(`M ${c.x} ${c.y} L ${d.x} ${d.y}`);
              }

              return (
                <>
                  {/* Left side face of the base */}
                  <path
                    d={`M ${cxp - halfW} ${cyp} L ${cxp} ${cyp + halfH} L ${cxp} ${cyp + halfH + depth} L ${cxp - halfW} ${cyp + depth} Z`}
                    fill="#16294a"
                  />
                  {/* Right side face of the base */}
                  <path
                    d={`M ${cxp} ${cyp + halfH} L ${cxp + halfW} ${cyp} L ${cxp + halfW} ${cyp + depth} L ${cxp} ${cyp + halfH + depth} Z`}
                    fill="#1e3760"
                  />
                  {/* Base top face */}
                  <polygon points={`${top} ${right} ${bottom} ${left}`} fill="#24406b" />
                  {/* Cube seams on the rim */}
                  <path d={rimSeams.join(' ')} stroke="#1d3358" strokeWidth="1.25" fill="none" opacity="0.85" />
                </>
              );
            })()}
          </svg>
        </div>

        {/* SHAKE EFFECT ON PANIC OR ELEVATOR MOVEMENT */}
        <motion.div 
            className="relative w-0 h-0" 
            animate={
              gameState.witnessIds.length > 0 
                ? { x: [-10, 10, -8, 8, -4, 4, 0], y: [-5, 5, -3, 3, 0] } 
                : isMoving 
                  ? { y: [0, 5, 0] } 
                  : {}
            }
            transition={gameState.witnessIds.length > 0 ? { duration: 0.5 } : { repeat: Infinity, duration: 0.12 }}
        >
            {/* 4x4 SQUARE GRID ISOMETRIC TILES */}
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
                                animate={{ scale: 1.2, y: -10 }}
                                className="absolute z-20 pointer-events-none flex flex-col items-center"
                              >
                                <svg viewBox="0 0 16 16" className="w-8 h-8 drop-shadow-[0_4px_8px_rgba(56,189,248,0.8)] animate-bounce" style={{ shapeRendering: 'crispEdges' }}>
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
                                    penguin={penguin}
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

            {/* FLOATING SCORE POPUPS IN 8-BIT FONT */}
            <AnimatePresence>
              {floatingScores.map(score => {
                const pos = getIsometricPos(score.x, score.y);
                return (
                  <motion.div
                    key={score.id}
                    initial={{ opacity: 1, y: pos.top - 90, x: pos.left, scale: 0.8 }}
                    animate={{ opacity: 0, y: pos.top - 150, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: "easeOut" }}
                    className="absolute font-pixel font-bold text-lg sm:text-xl drop-shadow-[0_3px_6px_#000000] pointer-events-none z-50 tracking-tighter whitespace-nowrap"
                    style={{
                      left: `calc(50% + ${pos.left}px)`,
                      color: score.color
                    }}
                  >
                    {score.text}
                  </motion.div>
                );
              })}
            </AnimatePresence>
        </motion.div>
    </div>
  );
};
