import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { GameState, Penguin, FloatingScore } from './types';
import { GRID_SIZE, TIMING, MAX_CAPACITY, SCORE_PER_FLOOR } from './constants';
import { getRandomDirection, checkDropSafety, rotateAllPenguins, findEmptyCell, getMonitoredCells, getRandomPenguinType, getMoveTime, getBoardingTime, getSpawnDirection, getWallFacingDirection, shouldBoardThisFloor } from './utils/gameLogic';
import { audioManager } from './utils/audio'; 
import { Grid } from './components/Grid';
import { ElevatorShaft } from './components/ElevatorShaft';
import { Header, GameOverScreen, StartScreen, MobileControls, MobileSimulatorFrame } from './components/UI';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PENGUINS_MIN = 3; // Game starts with 3-4 penguins in their own sections

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
    combo: 0,
    fishTreat: null,
    fishCount: 1,
    showVisionCones: false,
    isMuted: false,
    viewMode: Capacitor.isNativePlatform() ? 'FULLSCREEN' : 'MOBILE_SIM',
  });

  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  const monitoredCells = getMonitoredCells(gameState.penguins, gameState.fishTreat);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load High Score (Preferences with localStorage fallback)
  useEffect(() => {
    Preferences.get({ key: 'penguin-elevator-hs' }).then(({ value }) => {
      if (value) {
        setGameState(prev => ({ ...prev, highScore: parseInt(value, 10) }));
      } else {
        const saved = localStorage.getItem('penguin-elevator-hs');
        if (saved) {
          setGameState(prev => ({ ...prev, highScore: parseInt(saved, 10) }));
        }
      }
    });
  }, []);

  // Handle native app lifecycle background/foreground audio pause & resume
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        audioManager.pauseMusic();
      } else if (!gameState.isMuted) {
        audioManager.resumeMusic();
      }
    });
    return () => {
      sub.then(s => s.remove());
    };
  }, [gameState.isMuted]);

  // Android hardware back button: return to the menu from a game in
  // progress rather than silently killing the app; exit only from the menu.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener('backButton', () => {
      setGameState(prev => {
        if (prev.phase === 'PLAYING' || prev.phase === 'GAME_OVER') {
          return { ...prev, phase: 'START_MENU' };
        }
        CapApp.exitApp();
        return prev;
      });
    });
    return () => {
      sub.then(s => s.remove());
    };
  }, []);

  // Web Audio Touch Unlock - also kicks off ambient background music on the first gesture
  const musicStartedRef = useRef(false);
  useEffect(() => {
    const handleGesture = () => {
      audioManager.unlock();
      if (!musicStartedRef.current) {
        musicStartedRef.current = true;
        audioManager.playMusic();
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setGameState(prev => ({ ...prev, isMuted: muted }));
  };

  const addFloatingScore = (x: number, y: number, text: string, color: string = '#F59E0B') => {
    const id = uuidv4();
    setFloatingScores(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(item => item.id !== id));
    }, 900);
  };

  const startGame = () => {
    audioManager.unlock();
    const newPenguins: Penguin[] = [];
    const initialCount = INITIAL_PENGUINS_MIN + Math.floor(Math.random() * 2); // 3 or 4

    // Easy, readable opening: penguins start in the corners, each staring at
    // the nearest wall so their backs are exposed to the open floor.
    const corners = [
      { x: 0, y: 0 }, { x: GRID_SIZE - 1, y: 0 },
      { x: 0, y: GRID_SIZE - 1 }, { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
    ].sort(() => Math.random() - 0.5);

    for (let i = 0; i < initialCount; i++) {
      const pos = corners[i];
      newPenguins.push({
        id: uuidv4(),
        x: pos.x,
        y: pos.y,
        direction: getWallFacingDirection(pos),
        type: getRandomPenguinType(),
        appearanceVariant: Math.floor(Math.random() * 4)
      });
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
      gameOverReason: undefined,
      combo: 0,
      fishTreat: null,
      fishCount: 1
    }));
    
    audioManager.playMusic();
    startFloorCycle();
  };

  const startFloorCycle = () => {
    timerRef.current = setTimeout(() => {
      audioManager.playChime();
      setGameState(prev => ({ ...prev, elevatorState: 'BOARDING', combo: 0 }));
      handleBoarding();
    }, TIMING.STOP_DELAY);
  };

  const handleBoarding = () => {
    let gameOver = false;

    setGameState(prev => {
      if (prev.phase !== 'PLAYING') return prev;

      if (prev.penguins.length >= MAX_CAPACITY) {
         // The floor is completely full - no room for anyone else. Instant game over.
         gameOver = true;
         audioManager.playGameOverMusic();
         audioManager.playPanic();
         const newHigh = Math.max(prev.score, prev.highScore);
         localStorage.setItem('penguin-elevator-hs', newHigh.toString());
         return {
             ...prev,
             phase: 'GAME_OVER',
             gameOverReason: 'BANKRUPT',
             highScore: newHigh
         };
      }

      // Early floors get "rest stops" where nobody boards - a gentle ramp-up
      const numToAdd = prev.penguins.length === 0
        ? 3
        : shouldBoardThisFloor(prev.floor, prev.penguins.length) ? 1 : 0;
      let nextPenguins: Penguin[] = prev.penguins.map(p => ({ ...p, isEntering: false, isPushed: false }));
      let added = false;
      const pushedIds = new Set<string>();

      for (let i = 0; i < numToAdd; i++) {
          if (nextPenguins.length >= MAX_CAPACITY) break;
          const emptyPos = findEmptyCell(nextPenguins);
          if (emptyPos) {
              // The newcomer shoves its orthogonal neighbors around, spinning them to face a new random side
              nextPenguins = nextPenguins.map(p => {
                const isNeighbor = Math.abs(p.x - emptyPos.x) + Math.abs(p.y - emptyPos.y) === 1;
                if (isNeighbor && !p.isFalling && Math.random() < 0.5) {
                  pushedIds.add(p.id);
                  return { ...p, isPushed: true, direction: getRandomDirection() };
                }
                return p;
              });
              nextPenguins.push({
                id: uuidv4(),
                x: emptyPos.x,
                y: emptyPos.y,
                direction: getSpawnDirection(emptyPos, prev.floor),
                type: getRandomPenguinType(),
                isEntering: true,
                appearanceVariant: Math.floor(Math.random() * 4)
              });
              added = true;
          }
      }

      if (added) audioManager.playEnter();
      return { ...prev, penguins: nextPenguins };
    });

    // Clear the one-shot boarding animation flags once they have played
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        penguins: prev.penguins.map(p => ({ ...p, isEntering: false, isPushed: false }))
      }));
    }, 900);

    if (gameOver) return;

    const boardingTime = getBoardingTime(gameState.floor);

    timerRef.current = setTimeout(() => {
        setGameState(prev => {
           if (prev.phase !== 'PLAYING') return prev; 
           return { ...prev, elevatorState: 'CLOSING' };
        });
        
        setTimeout(() => {
            handleMoving();
        }, TIMING.DOOR_ANIMATION);
    }, boardingTime);
  };

  const handleMoving = () => {
    const moveTime = getMoveTime(gameState.floor);
    const rotationEventTime = Math.floor(moveTime * 0.45);

    setGameState(prev => {
        if (prev.phase !== 'PLAYING') return prev;
        return { ...prev, elevatorState: 'MOVING' };
    });

    setTimeout(() => {
      setGameState(prev => {
        if (prev.phase !== 'PLAYING') return prev;
        // Every level the flock shuffles - at least one penguin always turns
        return {
          ...prev,
          penguins: rotateAllPenguins(prev.penguins, prev.floor)
        };
      });
    }, rotationEventTime);

    setTimeout(() => {
      setGameState(prev => {
         if (prev.phase !== 'PLAYING') return prev;
         const nextFloor = prev.floor + 1;
         const earnedFish = nextFloor % 10 === 0; // A fish reward every 10th floor
         if (earnedFish) audioManager.playCombo();
         return {
          ...prev,
          elevatorState: 'STOPPED',
          floor: nextFloor,
          score: prev.score + SCORE_PER_FLOOR,
          fishCount: earnedFish ? prev.fishCount + 1 : prev.fishCount,
         };
      });
      startFloorCycle();
    }, moveTime);
  };

  // Places a fish on a random empty tile (for the quick-use button / F key)
  const placeFishAuto = () => {
    const empty = findEmptyCell(gameState.penguins.filter(p => !p.isFalling));
    if (empty) triggerFishTreat(empty.x, empty.y);
  };

  const triggerFishTreat = (x: number = 1, y: number = 1) => {
    if (gameState.fishCount < 1 || (gameState.fishTreat && gameState.fishTreat.active)) return;
    // Fish can only be placed on an empty square
    if (gameState.penguins.some(p => p.x === x && p.y === y && !p.isFalling)) return;

    audioManager.playSplash();
    setGameState(prev => ({
      ...prev,
      fishTreat: { x, y, active: true },
      fishCount: prev.fishCount - 1
    }));

    if (fishTimerRef.current) clearTimeout(fishTimerRef.current);
    fishTimerRef.current = setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        fishTreat: prev.fishTreat ? { ...prev.fishTreat, active: false } : null
      }));
    }, TIMING.FISH_DISTRACTION);
  };

  const handleDrop = useCallback((id: string) => {
    if (gameState.phase !== 'PLAYING') return;

    audioManager.playTrapdoor();

    const targetPenguin = gameState.penguins.find(p => p.id === id);
    if (!targetPenguin) return;

    const { safe, witnesses } = checkDropSafety(id, gameState.penguins, gameState.fishTreat);

    if (safe) {
      audioManager.playDropOooh();
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }

      const newCombo = gameState.combo + 1;
      const basePoints = targetPenguin.type === 'VIP' ? 10 : 5;
      const totalPoints = basePoints * Math.min(newCombo, 4);

      if (newCombo > 1) {
        audioManager.playCombo();
      }

      addFloatingScore(
        targetPenguin.x, 
        targetPenguin.y, 
        newCombo > 1 ? `+${totalPoints} (${newCombo}x!)` : `+${totalPoints}`,
        targetPenguin.type === 'VIP' ? '#F59E0B' : '#38BDF8'
      );

      // Funny pre-drop: the penguin gets dizzy and wobbles before the trapdoor opens
      setGameState(prev => ({
        ...prev,
        penguins: prev.penguins.map(p => p.id === id ? { ...p, isDizzy: true } : p),
        score: prev.score + totalPoints,
        combo: newCombo,
        lastDroppedId: id
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          penguins: prev.penguins.map(p => p.id === id ? { ...p, isDizzy: false, isFalling: true } : p),
        }));
      }, TIMING.DIZZY_ANIMATION);

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          penguins: prev.penguins.filter(p => p.id !== id),
          lastDroppedId: null
        }));
      }, TIMING.DIZZY_ANIMATION + TIMING.DROP_ANIMATION);

    } else {
      audioManager.stopMusic();
      audioManager.playScream();
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      }

      setGameState(prev => ({
        ...prev,
        witnessIds: witnesses,
        penguins: prev.penguins.map(p => {
            if (p.id === id) return { ...p, isFalling: true }; 
            return { ...p, isPanic: witnesses.includes(p.id) }; 
        })
      }));
      
      if (timerRef.current) clearTimeout(timerRef.current);
      
      setTimeout(() => {
        setGameState(prev => {
           const newHigh = Math.max(prev.score, prev.highScore);
           localStorage.setItem('penguin-elevator-hs', newHigh.toString());
           Preferences.set({ key: 'penguin-elevator-hs', value: newHigh.toString() }).catch(() => {});
           return {
             ...prev,
             phase: 'GAME_OVER',
             gameOverReason: 'CAUGHT',
             highScore: newHigh
           };
        });
      }, TIMING.PANIC_DELAY);
    }
  }, [gameState.penguins, gameState.phase, gameState.fishTreat, gameState.combo]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState.phase === 'START_MENU' || gameState.phase === 'GAME_OVER') {
          startGame();
        }
      }
      if (e.code === 'KeyF' && gameState.phase === 'PLAYING') {
        placeFishAuto();
      }
      if (e.code === 'KeyV' && gameState.phase === 'PLAYING') {
        setGameState(prev => ({ ...prev, showVisionCones: !prev.showVisionCones }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fishTimerRef.current) clearTimeout(fishTimerRef.current);
      audioManager.stopMusic();
    };
  }, []);

  return (
    <MobileSimulatorFrame isEnabled={gameState.viewMode === 'MOBILE_SIM'}>
      <div className="relative w-full h-full bg-slate-950 overflow-hidden font-sans select-none flex flex-col justify-between">
        <ElevatorShaft elevatorState={gameState.elevatorState} floor={gameState.floor} />

        <AnimatePresence>
          {gameState.phase === 'START_MENU' && (
            <StartScreen
              key="start"
              onStart={startGame}
              highScore={gameState.highScore}
              isMuted={gameState.isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {gameState.phase === 'PLAYING' && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="w-full h-full flex flex-col items-center justify-between relative z-0"
            >
              <Header 
                floor={gameState.floor} 
                score={gameState.score} 
                combo={gameState.combo}
                isMuted={gameState.isMuted}
                showVisionCones={gameState.showVisionCones}
                viewMode={gameState.viewMode}
                onToggleMute={handleToggleMute}
                onToggleVision={() => {
                  setGameState(prev => ({ ...prev, showVisionCones: !prev.showVisionCones }));
                }}
                onToggleViewMode={() => {
                  setGameState(prev => ({ 
                    ...prev, 
                    viewMode: prev.viewMode === 'MOBILE_SIM' ? 'FULLSCREEN' : 'MOBILE_SIM' 
                  }));
                }}
              />

              <div className="flex-1 w-full flex items-center justify-center">
                 <Grid 
                    gameState={gameState} 
                    onDrop={handleDrop} 
                    onTileClick={(x, y) => triggerFishTreat(x, y)}
                    monitoredCells={monitoredCells} 
                    floatingScores={floatingScores}
                  />
              </div>

              <MobileControls
                fishCount={gameState.fishCount}
                isFishActive={!!(gameState.fishTreat && gameState.fishTreat.active)}
                onUseFish={placeFishAuto}
                elevatorState={gameState.elevatorState}
              />
            </motion.div>
          )}

          {gameState.phase === 'GAME_OVER' && (
             <GameOverScreen
               key="gameover"
               score={gameState.score}
               floor={gameState.floor}
               onRestart={startGame}
               reason={gameState.gameOverReason}
               isMuted={gameState.isMuted}
               onToggleMute={handleToggleMute}
             />
          )}
        </AnimatePresence>
      </div>
    </MobileSimulatorFrame>
  );
}

export default App;
