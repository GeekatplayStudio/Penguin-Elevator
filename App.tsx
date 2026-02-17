import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Penguin, ElevatorState, GamePhase } from './types';
import { GRID_SIZE, TIMING, MAX_CAPACITY, SCORE_PER_FLOOR, PENALTY_FULL_ELEVATOR, MIN_SCORE_THRESHOLD, DEBUG_MODE } from './constants';
import { getRandomDirection, checkDropSafety, rotatePenguin, findEmptyCell, getMonitoredCells } from './utils/gameLogic';
import { audioManager } from './utils/audio'; 
import { Grid } from './components/Grid';
import { ElevatorShaft } from './components/ElevatorShaft';
import { Header, GameOverScreen, StartScreen } from './components/UI';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PENGUINS_COUNT = 4;

function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'START_MENU',
    floor: 1,
    score: 0,
    highScore: 0,
    elevatorState: 'STOPPED',
    penguins: [],
    lastDroppedId: null,
    witnessIds: [],
  });

  const monitoredCells = DEBUG_MODE ? getMonitoredCells(gameState.penguins) : undefined;

  useEffect(() => {
    const saved = localStorage.getItem('penguin-elevator-hs');
    if (saved) {
      setGameState(prev => ({ ...prev, highScore: parseInt(saved, 10) }));
    }
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = () => {
    const newPenguins: Penguin[] = [];
    const usedPositions = new Set<string>();

    while (newPenguins.length < INITIAL_PENGUINS_COUNT) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const key = `${x},${y}`;
      if (!usedPositions.has(key)) {
        usedPositions.add(key);
        newPenguins.push({
          id: uuidv4(),
          x,
          y,
          direction: getRandomDirection(),
          appearanceVariant: Math.floor(Math.random() * 4)
        });
      }
    }

    setGameState(prev => ({
      ...prev,
      phase: 'PLAYING',
      floor: 1,
      score: 0,
      elevatorState: 'STOPPED',
      penguins: newPenguins,
      lastDroppedId: null,
      witnessIds: [],
      gameOverReason: undefined
    }));
    
    audioManager.playMusic();
    startFloorCycle();
  };

  const startFloorCycle = () => {
    timerRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, elevatorState: 'BOARDING' }));
      handleBoarding();
    }, TIMING.STOP_DELAY);
  };

  const handleBoarding = () => {
    let gameOver = false;

    setGameState(prev => {
      if (prev.phase !== 'PLAYING') return prev;

      if (prev.penguins.length >= MAX_CAPACITY) {
         const newScore = prev.score - PENALTY_FULL_ELEVATOR;
         if (newScore <= MIN_SCORE_THRESHOLD) {
             gameOver = true;
             audioManager.stopMusic();
             audioManager.playPanic();
             const newHigh = Math.max(newScore, prev.highScore);
             localStorage.setItem('penguin-elevator-hs', newHigh.toString());
             return {
                 ...prev,
                 score: newScore,
                 phase: 'GAME_OVER',
                 gameOverReason: 'BANKRUPT',
                 highScore: newHigh
             };
         }
         return { ...prev, score: newScore };
      }

      const numToAdd = prev.penguins.length === 0 ? 3 : 1;
      let nextPenguins = [...prev.penguins];
      let added = false;

      for (let i = 0; i < numToAdd; i++) {
          if (nextPenguins.length >= MAX_CAPACITY) break;
          const emptyPos = findEmptyCell(nextPenguins);
          if (emptyPos) {
              nextPenguins.push({
                id: uuidv4(),
                x: emptyPos.x,
                y: emptyPos.y,
                direction: getRandomDirection(),
                appearanceVariant: Math.floor(Math.random() * 4)
              });
              added = true;
          }
      }
      
      if (added) audioManager.playEnter();
      return { ...prev, penguins: nextPenguins };
    });

    if (gameOver) return;

    timerRef.current = setTimeout(() => {
        setGameState(prev => {
           if (prev.phase !== 'PLAYING') return prev; 
           return { ...prev, elevatorState: 'CLOSING' };
        });
        
        setTimeout(() => {
            handleMoving();
        }, TIMING.DOOR_ANIMATION);
    }, TIMING.BOARDING_TIME);
  };

  const handleMoving = () => {
    setGameState(prev => {
        if (prev.phase !== 'PLAYING') return prev;
        return { ...prev, elevatorState: 'MOVING' };
    });

    setTimeout(() => {
      setGameState(prev => {
        if (prev.phase !== 'PLAYING') return prev;
        return {
          ...prev,
          penguins: prev.penguins.map(p => ({
            ...p,
            direction: rotatePenguin(p.direction)
          }))
        };
      });
    }, TIMING.ROTATION_EVENT);

    setTimeout(() => {
      setGameState(prev => {
         if (prev.phase !== 'PLAYING') return prev;
         return {
          ...prev,
          elevatorState: 'STOPPED',
          floor: prev.floor + 1,
          score: prev.score + SCORE_PER_FLOOR,
         };
      });
      startFloorCycle();
    }, TIMING.MOVE_TIME);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      audioManager.stopMusic();
    };
  }, []);

  const handleDrop = useCallback((id: string) => {
    if (gameState.phase !== 'PLAYING') return;

    audioManager.playTrapdoor();

    const { safe, witnesses } = checkDropSafety(id, gameState.penguins);

    if (safe) {
      audioManager.playFall();
      setGameState(prev => ({
        ...prev,
        penguins: prev.penguins.map(p => p.id === id ? { ...p, isFalling: true } : p),
        score: prev.score + 5,
        lastDroppedId: id
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          penguins: prev.penguins.filter(p => p.id !== id),
          lastDroppedId: null
        }));
      }, TIMING.DROP_ANIMATION);

    } else {
      audioManager.stopMusic();
      audioManager.playPanic();

      setGameState(prev => ({
        ...prev,
        witnessIds: witnesses,
        penguins: prev.penguins.map(p => {
            if (p.id === id) return { ...p, isFalling: true }; 
            if (witnesses.includes(p.id)) return { ...p, isPanic: true }; 
            return { ...p, isPanic: true }; 
        })
      }));
      
      if (timerRef.current) clearTimeout(timerRef.current);
      
      setTimeout(() => {
        setGameState(prev => {
           const newHigh = Math.max(prev.score, prev.highScore);
           localStorage.setItem('penguin-elevator-hs', newHigh.toString());
           return {
             ...prev,
             phase: 'GAME_OVER',
             gameOverReason: 'CAUGHT',
             highScore: newHigh
           };
        });
      }, TIMING.PANIC_DELAY);
    }
  }, [gameState.penguins, gameState.phase]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
      <ElevatorShaft elevatorState={gameState.elevatorState} floor={gameState.floor} />

      <AnimatePresence>
        {gameState.phase === 'START_MENU' && (
          <StartScreen key="start" onStart={startGame} highScore={gameState.highScore} />
        )}

        {gameState.phase === 'PLAYING' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full flex flex-col items-center justify-center relative z-0"
          >
            <Header floor={gameState.floor} score={gameState.score} />
            <div className="flex-1 w-full flex items-center justify-center">
               <Grid gameState={gameState} onDrop={handleDrop} monitoredCells={monitoredCells} />
            </div>
            <div className="absolute bottom-8 text-slate-400 text-sm font-medium bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-700/50">
              {DEBUG_MODE ? 'DEBUG: Red tiles are being watched!' : 'Watch their eyes. Click to drop.'}
            </div>
             {gameState.elevatorState === 'BOARDING' && (
               <div className="absolute top-1/4 text-green-400 font-bold animate-pulse tracking-widest uppercase text-xs">
                 BOARDING...
               </div>
             )}
          </motion.div>
        )}

        {gameState.phase === 'GAME_OVER' && (
           <GameOverScreen 
             key="gameover"
             score={gameState.score} 
             floor={gameState.floor} 
             onRestart={startGame}
             reason={gameState.gameOverReason}
           />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;