import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElevatorState } from '../types';

interface ElevatorShaftProps {
  elevatorState: ElevatorState;
  floor: number;
}

export const ElevatorShaft: React.FC<ElevatorShaftProps> = ({ elevatorState, floor }) => {
  const isMoving = elevatorState === 'MOVING';

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-slate-900">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}
      />

      {/* Moving Wall Elements (Simulating shaft walls) - Moving DOWN */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={isMoving ? { backgroundPositionY: ["0px", "200px"] } : {}}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
            backgroundImage: 'linear-gradient(90deg, transparent 0%, transparent 45%, #000 50%, transparent 55%, transparent 100%)',
            backgroundSize: '200px 100%'
        }}
      />

      {/* Vertical Motion Lines - Moving DOWN to simulate Upward Ascent */}
      {isMoving && (
        <motion.div 
            className="absolute inset-0"
            initial={{ backgroundPositionY: "0px" }}
            animate={{ backgroundPositionY: "1000px" }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            style={{
                backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                backgroundSize: '100% 200px'
            }}
        />
      )}

      {/* Floor Indicator passing by (Moving Down) */}
      <AnimatePresence>
        {isMoving && (
            <motion.div 
                key="passing-light"
                initial={{ top: '-10%', opacity: 0 }}
                animate={{ top: '110%', opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute left-0 right-0 h-4 bg-yellow-500/10 blur-xl"
            />
        )}
      </AnimatePresence>

      {/* Large Floor Number Display */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-white/[0.03] select-none leading-none z-[-1]">
        {floor}
      </div>
    </div>
  );
};