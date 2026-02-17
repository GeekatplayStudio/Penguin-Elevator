import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT, DEBUG_MODE } from '../constants';
import { Penguin } from './Penguin';

interface GridProps {
  gameState: GameState;
  onDrop: (id: string) => void;
  monitoredCells?: Set<string>;
}

const getIsoPos = (x: number, y: number) => {
  return {
    left: (x - y) * (TILE_WIDTH / 2),
    top: (x + y) * (TILE_HEIGHT / 2)
  };
};

interface IsoTileProps {
  x: number;
  y: number;
  isOpen: boolean;
  isMonitored: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const IsoTile: React.FC<IsoTileProps> = ({ 
  x, 
  y, 
  isOpen, 
  isMonitored,
  onClick,
  children 
}) => {
  const pos = getIsoPos(x, y);
  const zIndex = 100 + x + y; 

  const isAlt = (x + y) % 2 === 1;
  const topColor = isAlt ? '#475569' : '#334155';
  const sideColorLeft = '#1e293b';
  const sideColorRight = '#0f172a';
  
  return (
    <div 
      className="absolute flex justify-center items-center cursor-pointer group"
      onClick={(e) => {
         e.stopPropagation();
         onClick();
      }}
      style={{
        left: `calc(50% + ${pos.left}px)`,
        top: `calc(15% + ${pos.top}px)`,
        width: TILE_WIDTH,
        height: TILE_HEIGHT * 2,
        zIndex: zIndex,
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <svg width={TILE_WIDTH} height={TILE_HEIGHT * 2} viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT * 2}`} className="drop-shadow-xl">
            <path d={`M0 ${TILE_HEIGHT/2} L${TILE_WIDTH/2} ${TILE_HEIGHT} L${TILE_WIDTH/2} ${TILE_HEIGHT + 20} L0 ${TILE_HEIGHT/2 + 20} Z`} fill={sideColorLeft} />
            <path d={`M${TILE_WIDTH/2} ${TILE_HEIGHT} L${TILE_WIDTH} ${TILE_HEIGHT/2} L${TILE_WIDTH} ${TILE_HEIGHT/2 + 20} L${TILE_WIDTH/2} ${TILE_HEIGHT + 20} Z`} fill={sideColorRight} />
            
            {!isOpen ? (
                <>
                    <path 
                        d={`M0 ${TILE_HEIGHT/2} L${TILE_WIDTH/2} 0 L${TILE_WIDTH} ${TILE_HEIGHT/2} L${TILE_WIDTH/2} ${TILE_HEIGHT} Z`} 
                        fill={topColor} 
                        className="transition-colors duration-200 group-hover:fill-slate-500"
                    />
                    {DEBUG_MODE && isMonitored && (
                         <path 
                            d={`M0 ${TILE_HEIGHT/2} L${TILE_WIDTH/2} 0 L${TILE_WIDTH} ${TILE_HEIGHT/2} L${TILE_WIDTH/2} ${TILE_HEIGHT} Z`} 
                            fill="rgba(239, 68, 68, 0.4)" 
                            className="animate-pulse"
                        />
                    )}
                </>
            ) : (
                <path d={`M0 ${TILE_HEIGHT/2} L${TILE_WIDTH/2} 0 L${TILE_WIDTH} ${TILE_HEIGHT/2} L${TILE_WIDTH/2} ${TILE_HEIGHT} Z`} fill="#000000" />
            )}
            
            {!isOpen && (
                 <path d={`M0 ${TILE_HEIGHT/2} L${TILE_WIDTH/2} 0 L${TILE_WIDTH} ${TILE_HEIGHT/2} L${TILE_WIDTH/2} ${TILE_HEIGHT} Z`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            )}
         </svg>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         {children}
      </div>
    </div>
  );
};

export const Grid: React.FC<GridProps> = ({ gameState, onDrop, monitoredCells }) => {
  const [hoveredPenguinId, setHoveredPenguinId] = useState<string | null>(null);
  const isMoving = gameState.elevatorState === 'MOVING';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <motion.div 
            className="relative w-0 h-0" 
            animate={isMoving ? { y: [0, 4, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
        >
            {Array.from({ length: GRID_SIZE }).map((_, y) => (
                Array.from({ length: GRID_SIZE }).map((_, x) => {
                    const penguin = gameState.penguins.find(p => p.x === x && p.y === y);
                    const isTrapdoorOpen = penguin?.isFalling || false;
                    const isMonitored = monitoredCells?.has(`${x},${y}`) || false;

                    return (
                        <IsoTile 
                            key={`${x}-${y}`} 
                            x={x} 
                            y={y} 
                            isOpen={isTrapdoorOpen}
                            isMonitored={isMonitored}
                            onClick={() => {
                                if (penguin) onDrop(penguin.id);
                            }}
                        >
                             {penguin && (
                                <Penguin
                                    penguin={penguin}
                                    isHovered={hoveredPenguinId === penguin.id}
                                    onClick={() => onDrop(penguin.id)}
                                    onHoverStart={() => setHoveredPenguinId(penguin.id)}
                                    onHoverEnd={() => setHoveredPenguinId(null)}
                                    isWitness={gameState.witnessIds.includes(penguin.id)}
                                />
                             )}
                        </IsoTile>
                    );
                })
            ))}
        </motion.div>
    </div>
  );
};