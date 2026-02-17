import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Penguin as PenguinType } from '../types';
import { AlertTriangle } from './Icons';
import clsx from 'clsx';
import { GRID_SIZE } from '../constants';

interface PenguinProps {
  penguin: PenguinType;
  isHovered: boolean;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  isWitness?: boolean;
}

export const Penguin: React.FC<PenguinProps> = ({
  penguin,
  isHovered,
  onClick,
  onHoverStart,
  onHoverEnd,
  isWitness
}) => {
  // STRICT ISOMETRIC MAPPING
  // RIGHT (x+) -> Visual Down-Right (SE) -> Side View
  // DOWN (y+)  -> Visual Down-Left (SW)  -> Side View Mirrored
  // UP (y-)    -> Visual Up-Right (NE)   -> Back View
  // LEFT (x-)  -> Visual Up-Left (NW)    -> Back View Mirrored

  const isSE = penguin.direction === 'RIGHT';
  const isSW = penguin.direction === 'DOWN';
  const isNE = penguin.direction === 'UP';
  const isNW = penguin.direction === 'LEFT';

  const isFacingCamera = isSE || isSW;
  const isMirrored = isSW || isNW;

  const centerX = (GRID_SIZE - 1) / 2;
  const centerY = (GRID_SIZE - 1) / 2;
  const dirX = penguin.x - centerX; 
  const dirY = penguin.y - centerY;
  
  const runDistance = 300;
  const runScreenX = (dirX - dirY) * runDistance * 0.5;
  const runScreenY = (dirX + dirY) * runDistance * 0.25;

  return (
    <div
      className="absolute bottom-0 left-0 w-full flex justify-center items-end pointer-events-none"
      style={{ height: '200%', bottom: '25%' }}
    >
      <AnimatePresence mode="wait">
        {!penguin.isFalling && (
          <motion.div
            key="penguin-body"
            initial={{ opacity: 0, scale: 0, y: -50 }}
            animate={penguin.isPanic ? {
               x: runScreenX,
               y: runScreenY - 50,
               opacity: 0,
               scale: 0.8,
               rotate: isMirrored ? -10 : 10,
               transition: { duration: 0.8, ease: "backIn" }
            } : { 
              opacity: 1, 
              scale: 1, 
              y: 0,
              rotate: 0,
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
            exit={{ 
              y: 150,
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            className="relative pointer-events-auto cursor-pointer" 
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            <motion.div 
                className={clsx(
                    "w-24 h-24 origin-bottom transition-transform duration-200",
                    isHovered && !penguin.isPanic ? "scale-110 brightness-110" : ""
                )}
                style={{ scaleX: isMirrored ? -1 : 1 }}
            >
               <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-xl">
                  <g transform="translate(50 90)"> 
                    
                    <g>
                        <path d="M-5 -2 L5 2 L12 2 L2 -2 Z" fill="#D97706" /> 
                        <path d="M-8 0 L2 5 L10 5 L0 0 Z" fill="#F59E0B" /> 
                    </g>

                    {/* BODY */}
                    <path d={isFacingCamera ? "M-12 -60 L12 -60 L16 -10 L-16 -10 Z" : "M-12 -60 L12 -60 L16 -10 L-16 -10 Z"} 
                          fill={isFacingCamera ? "#1E293B" : "#0F172A"} />
                    
                    {/* HEAD */}
                    <path d="M-12 -60 L12 -60 L8 -85 L-8 -85 Z" fill={isFacingCamera ? "#0F172A" : "#020617"} />

                    {isFacingCamera && (
                        <>
                            <path d="M2 -50 L12 -50 L14 -10 L4 -10 Z" fill="#F8FAFC" />
                            <path d="M10 -64 L22 -58 L10 -52 Z" fill="#F59E0B" />
                            <g transform="translate(4, -65)">
                                {penguin.isPanic ? (
                                     <path d="M0 0 L4 4 M4 0 L0 4" stroke="white" strokeWidth="2" />
                                ) : (
                                    <g>
                                        <circle cx="2" cy="2" r="3" fill="white" />
                                        <circle cx="3" cy="2" r="1" fill="black" />
                                    </g>
                                )}
                            </g>
                        </>
                    )}

                    {!isFacingCamera && (
                        <path d="M-5 -10 L5 -10 L0 -2 Z" fill="#0F172A" />
                    )}

                    <g transform="translate(0, -45)">
                        <motion.path 
                            d="M-20 0 L-35 15 L-20 20 Z" 
                            fill="#0F172A"
                            animate={penguin.isPanic ? { 
                                rotate: [0, 60, 0],
                                x: [-2, -10, -2]
                            } : { rotate: 0, x: 0 }}
                            transition={penguin.isPanic ? { repeat: Infinity, duration: 0.15 } : {}}
                            style={{ originX: 0, originY: 0 }} 
                        />
                        <motion.path 
                            d="M-5 0 L-20 15 L-5 20 Z" 
                            fill="#1E293B"
                            animate={penguin.isPanic ? { 
                                rotate: [0, -60, 0],
                                x: [2, 10, 2]
                            } : { rotate: 0, x: 0 }}
                            transition={penguin.isPanic ? { repeat: Infinity, duration: 0.15 } : {}}
                            style={{ originX: 0, originY: 0 }}
                        />
                    </g>

                    {penguin.appearanceVariant === 1 && isFacingCamera && (
                        <path d="M-5 -50 L5 -50 L7 -45 L-7 -45 Z" fill="#EF4444" />
                    )}
                    {penguin.appearanceVariant === 2 && (
                        <path d="M-10 -85 L10 -85 L0 -95 Z" fill="#EAB308" />
                    )}
                  </g>
               </svg>
            </motion.div>

            {penguin.isPanic && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1, y: -10 }}
                    transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
                    className="absolute top-0 text-cyan-300 font-bold text-2xl"
                >
                    !
                </motion.div>
            )}

            {isWitness && !penguin.isPanic && (
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: -60 }}
                className="absolute left-1/2 -translate-x-1/2 drop-shadow-md"
              >
                <AlertTriangle size={32} fill="#EF4444" stroke="white" strokeWidth={2} />
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};