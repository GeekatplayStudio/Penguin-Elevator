import React from 'react';
import { motion } from 'framer-motion';
import { Eye, AlertTriangle } from './Icons';
import { APP_VERSION } from '../constants';

export const Header: React.FC<{ floor: number; score: number }> = ({ floor, score }) => (
  <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-black tracking-tighter text-white drop-shadow-md flex items-center gap-2">
        <span>🐧</span> 
        <span className="text-slate-100">ELEVATOR</span>
      </h1>
      <div className="bg-slate-800/80 backdrop-blur px-3 py-1 rounded border border-slate-600 shadow-lg text-white">
        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Floor</div>
        <div className="text-3xl font-mono font-bold text-yellow-400 tabular-nums leading-none">
           {floor.toString().padStart(3, '0')}
        </div>
      </div>
    </div>
    
    <div className="bg-slate-800/80 backdrop-blur px-3 py-1 rounded border border-slate-600 shadow-lg text-white text-right">
       <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Score</div>
       <div className={`text-2xl font-mono font-bold tabular-nums ${score < 0 ? 'text-red-400' : 'text-white'}`}>{score}</div>
    </div>
  </div>
);

export const GameOverScreen: React.FC<{ score: number; floor: number; onRestart: () => void; reason?: 'CAUGHT' | 'BANKRUPT' }> = ({ score, floor, onRestart, reason }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full text-center"
    >
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${reason === 'BANKRUPT' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
        {reason === 'BANKRUPT' ? <AlertTriangle size={48} /> : <Eye size={48} />}
      </div>
      
      <h2 className="text-3xl font-black text-white mb-2">
         {reason === 'BANKRUPT' ? 'OVERCROWDED!' : 'BUSTED!'}
      </h2>
      <p className="text-slate-400 mb-8 font-medium">
        {reason === 'BANKRUPT' ? 'Score dropped too low.' : 'Someone saw the drop!'}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-black/20 p-3 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Floor</div>
          <div className="text-2xl font-bold text-white">{floor}</div>
        </div>
        <div className="bg-black/20 p-3 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Score</div>
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg transition-colors active:scale-95 uppercase tracking-wide"
      >
        Try Again
      </button>
    </motion.div>
  </div>
);

export const StartScreen: React.FC<{ onStart: () => void; highScore: number }> = ({ onStart, highScore }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 p-4">
    <motion.div
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       className="text-center max-w-md w-full"
    >
      <div className="text-6xl mb-4">🐧</div>
      <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
        PENGUIN<br/>ELEVATOR
      </h1>
      <div className="text-slate-600 font-mono text-xs mb-6 tracking-widest uppercase opacity-50">
        {APP_VERSION}
      </div>
      
      <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 mb-8 text-left">
        <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-sm border-b border-slate-700 pb-2">How to Play</h3>
        <ul className="text-slate-400 text-sm space-y-2 list-disc list-inside">
          <li>Penguins enter at each floor.</li>
          <li><strong>Drop them</strong> through trapdoors to clear space.</li>
          <li><span className="text-red-400 font-bold">RULE 1:</span> Don't let anyone see you drop another penguin! Watch their eyes (Front, Back, Left, Right).</li>
          <li><span className="text-orange-400 font-bold">RULE 2:</span> If the elevator is full, you lose <strong>2 Points</strong>.</li>
          <li><span className="text-yellow-400 font-bold">RULE 3:</span> If Score hits -10, Game Over.</li>
        </ul>
      </div>

      {highScore > 0 && (
         <div className="mb-8 inline-block px-4 py-2 bg-slate-800 rounded text-yellow-500 font-mono font-bold text-sm tracking-wider">
            BEST: {highScore}
         </div>
      )}

      <button 
        onClick={onStart}
        className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-lg transition-all shadow-xl active:scale-95 uppercase tracking-widest"
      >
        Start Game
      </button>
    </motion.div>
  </div>
);