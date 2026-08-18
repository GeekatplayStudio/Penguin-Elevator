import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElevatorState } from '../types';

interface ElevatorShaftProps {
  elevatorState: ElevatorState;
  floor: number;
}

export const ElevatorShaft: React.FC<ElevatorShaftProps> = ({ elevatorState, floor }) => {
  const isMoving = elevatorState === 'MOVING';
  const isDoorOpen = elevatorState === 'BOARDING';

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between" style={{ perspective: '1200px' }}>
      {/* ISOMETRIC 3D ELEVATOR SHAFT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 via-70% to-slate-950 opacity-90" style={{ transform: 'translateZ(0)' }} />

      {/* GLOWING GRID PATTERN BACKGROUND */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(56, 189, 248, 0.3) 39px,
              rgba(56, 189, 248, 0.3) 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgba(56, 189, 248, 0.3) 39px,
              rgba(56, 189, 248, 0.3) 40px
            )
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(800px) rotateX(15deg)'
        }}
      />

      {/* SHAFT RAIL TRACKS - give the sense of vertical travel through a real shaft */}
      <div className="absolute top-0 bottom-0 left-8 w-2 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent" />
      <div className="absolute top-0 bottom-0 right-8 w-2 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent" />

      {/* SCROLLING FLOOR MARKERS ON THE SHAFT WALLS - the "passing floors" illusion */}
      <motion.div
        className="absolute inset-0"
        animate={isMoving ? { backgroundPositionY: ['0px', '-260px'] } : {}}
        transition={{ repeat: Infinity, duration: 0.65, ease: 'linear' }}
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 118px,
            rgba(148, 163, 184, 0.35) 118px,
            rgba(148, 163, 184, 0.35) 122px,
            transparent 122px,
            transparent 130px
          )`,
          backgroundSize: '100% 130px'
        }}
      />

      {/* WEST LEFT WALL - IMPROVED */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 border-r-8 border-cyan-400/40 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Wall panels */}
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 bg-gradient-to-b from-slate-700/20 to-transparent" />
        {/* Wall details */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-cyan-400/50" />
        {/* Vertical guide rail with moving cable-car pulley marks */}
        <motion.div
          className="absolute left-6 top-0 bottom-0 w-1.5"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, rgba(56,189,248,0.5) 0px, rgba(56,189,248,0.5) 6px, transparent 6px, transparent 18px)'
          }}
          animate={isMoving ? { backgroundPositionY: ['0px', '360px'] } : {}}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <div className="absolute left-4 top-8 w-1 h-12 bg-cyan-400/30 rounded-full" />
        <div className="absolute left-4 top-24 w-1 h-12 bg-cyan-400/30 rounded-full" />
      </motion.div>

      {/* EAST RIGHT WALL - IMPROVED */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 border-l-8 border-cyan-400/40 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Wall panels */}
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 border-b-4 border-slate-700 bg-gradient-to-b from-slate-700/20 to-transparent" />
        <div className="flex-1 bg-gradient-to-b from-slate-700/20 to-transparent" />
        {/* Wall details */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-cyan-400/50" />
        <motion.div
          className="absolute right-6 top-0 bottom-0 w-1.5"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, rgba(56,189,248,0.5) 0px, rgba(56,189,248,0.5) 6px, transparent 6px, transparent 18px)'
          }}
          animate={isMoving ? { backgroundPositionY: ['0px', '360px'] } : {}}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <div className="absolute right-4 top-8 w-1 h-12 bg-cyan-400/30 rounded-full" />
        <div className="absolute right-4 top-24 w-1 h-12 bg-cyan-400/30 rounded-full" />
      </motion.div>

      {/* NORTH BACK WALL HEADER PANEL - ENHANCED */}
      <div className="absolute top-12 left-20 right-20 h-28 bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-slate-950 shadow-2xl flex items-center justify-between px-8 z-10 rounded-lg">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-4 h-4 rounded-full bg-red-500"
            animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.8)", "0 0 0px rgba(239,68,68,0)"] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="font-pixel text-xs text-cyan-400 uppercase tracking-widest">STATUS</span>
        </div>
        <div className="text-center flex-1">
          <div className="text-[11px] font-pixel text-cyan-400 uppercase tracking-wider mb-2">Elevator</div>
          <div className="font-pixel text-lg text-amber-300 font-bold">{elevatorState}</div>
        </div>
        <div className="text-right">
          <div className="font-pixel text-[10px] text-slate-400 uppercase tracking-wider mb-2">Level</div>
          <div className="font-pixel text-2xl font-bold text-amber-400 bg-slate-950/60 px-4 py-2 border-2 border-cyan-400/40 rounded">
            {floor.toString().padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* VERTICAL SPEED LINES WHEN ELEVATOR MOVES - ENHANCED */}
      {isMoving && (
        <>
          <motion.div 
              className="absolute inset-0"
              initial={{ backgroundPositionY: "0px" }}
              animate={{ backgroundPositionY: "1200px" }}
              transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              style={{
                  backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, rgba(56,189,248,0.25) 20px, transparent 40px)',
                  backgroundSize: '100% 60px'
              }}
          />
          <motion.div 
              className="absolute inset-0"
              initial={{ backgroundPositionY: "0px" }}
              animate={{ backgroundPositionY: "-1200px" }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              style={{
                  backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, rgba(134,239,172,0.15) 25px, transparent 50px)',
                  backgroundSize: '100% 75px'
              }}
          />
        </>
      )}

      {/* PASSING FLOOR LIGHT FLASH STRIP - ENHANCED */}
      <AnimatePresence>
        {isMoving && (
            <motion.div 
                key="passing-light"
                initial={{ top: '-15%', opacity: 0 }}
                animate={{ top: '115%', opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                className="absolute left-20 right-20 h-24 bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-transparent blur-3xl"
            />
        )}
      </AnimatePresence>

      {/* LARGE BACKGROUND FLOOR NUMBER - ENHANCED GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1]">
        <div className="text-[50vw] font-pixel font-bold text-cyan-400/[0.08] select-none leading-none tracking-tighter filter drop-shadow-2xl">
          {floor.toString().padStart(3, '0')}
        </div>
        <div className="absolute inset-0 text-[50vw] font-pixel font-bold text-cyan-400/[0.02] select-none leading-none tracking-tighter blur-3xl -z-10">
          {floor.toString().padStart(3, '0')}
        </div>
      </div>

      {/* SLIDING ELEVATOR DOORS - ENHANCED WITH DETAILS */}
      {/* Left Door */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-r-4 border-cyan-400/60 shadow-2xl flex items-center justify-end z-30 overflow-hidden"
        initial={{ x: 0 }}
        animate={{ x: isDoorOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Door panels detail */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
        </div>
        {/* Door handle */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-3 h-16 bg-slate-600 rounded-full shadow-lg border border-slate-500" />
        {/* Right edge light */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-500/30 via-amber-500/10 to-transparent" />
      </motion.div>

      {/* Right Door */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-slate-800 via-slate-800 to-slate-900 border-l-4 border-cyan-400/60 shadow-2xl flex items-center justify-start z-30 overflow-hidden"
        initial={{ x: 0 }}
        animate={{ x: isDoorOpen ? '100%' : '0%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Door panels detail */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
          <div className="w-full h-0.5 bg-slate-700" />
        </div>
        {/* Door handle */}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 w-3 h-16 bg-slate-600 rounded-full shadow-lg border border-slate-500" />
        {/* Left edge light */}
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


