import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { GameState, Penguin, FloatingScore, ElevatorState } from './types';
import { GRID_SIZE, TIMING, MAX_CAPACITY, SCORE_PER_FLOOR, OVERLOAD_GRACE_FLOORS, ROTATION_TELEGRAPH_MS } from './constants';
import { checkDropSafety, findEmptyCell, getMonitoredCells, getRandomPenguinType, getMoveTime, getBoardingTime, getWallFacingDirection, shouldBoardThisFloor } from './utils/gameLogic';
import { chooseSpawnPlacement, smartRotatePenguins, isClearable } from './utils/solver';
import { audioManager } from './utils/audio'; 
import { Grid } from './components/Grid';
import { ElevatorShaft } from './components/ElevatorShaft';
import { Header, GameOverScreen, StartScreen, MobileControls, MobileSimulatorFrame, FloorTimer } from './components/UI';
import { IntroSequence } from './components/Cinematics';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_PENGUINS_MIN = 3; // Game starts with 3-4 penguins in their own sections

function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'START_MENU',
    floor: 1,
    score: 0,
    highScore: 0,
    bestFloor: 1,
    elevatorState: 'STOPPED',
    penguins: [],
    lastDroppedId: null,
    witnessIds: [],
    combo: 0,
    fishTreat: null,
    fishCount: 1,
    overloadCountdown: null,
    showVisionCones: false,
    isMuted: false,
    isPaused: false,
    viewMode: Capacitor.isNativePlatform() ? 'FULLSCREEN' : 'MOBILE_SIM',
  });

  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Memoized: a fresh Set identity every render would defeat the tile
  // overlays' React.memo and re-render all 16 tiles on every state change.
  const monitoredCells = useMemo(
    () => getMonitoredCells(gameState.penguins, gameState.fishTreat),
    [gameState.penguins, gameState.fishTreat]
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationPlanRef = useRef<Penguin[] | null>(null);

  // Every timer that drives the elevator cycle is tracked here so PAUSE can
  // freeze the whole machine (rotation, arrival, door-close) in one sweep.
  const cycleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    cycleTimersRef.current.push(id);
    return id;
  };
  const clearCycleTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cycleTimersRef.current.forEach(id => clearTimeout(id));
    cycleTimersRef.current = [];
  };

  // Load High Score + Best Floor (Preferences with localStorage fallback)
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
    Preferences.get({ key: 'penguin-elevator-bf' }).then(({ value }) => {
      const fallback = value ?? localStorage.getItem('penguin-elevator-bf');
      if (fallback) {
        setGameState(prev => ({ ...prev, bestFloor: parseInt(fallback, 10) }));
      }
    });
  }, []);

  // Persists both records at the end of a run and returns the new values
  const saveRecords = (score: number, floor: number, prevHigh: number, prevBestFloor: number) => {
    const newHigh = Math.max(score, prevHigh);
    const newBestFloor = Math.max(floor, prevBestFloor);
    localStorage.setItem('penguin-elevator-hs', newHigh.toString());
    localStorage.setItem('penguin-elevator-bf', newBestFloor.toString());
    Preferences.set({ key: 'penguin-elevator-hs', value: newHigh.toString() }).catch(() => {});
    Preferences.set({ key: 'penguin-elevator-bf', value: newBestFloor.toString() }).catch(() => {});
    return { newHigh, newBestFloor };
  };

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
        if (prev.phase === 'PLAYING' || prev.phase === 'GAME_OVER' || prev.phase === 'INTRO') {
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

  // From the menu, a fresh game opens with the rooftop-party intro; the
  // actual run begins when the intro finishes (or is tapped through).
  const requestStart = () => {
    audioManager.unlock();
    setGameState(prev => ({ ...prev, phase: 'INTRO' }));
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
      fishCount: 1,
      overloadCountdown: null,
      isPaused: false
    }));

    clearCycleTimers();
    audioManager.playMusic();
    startFloorCycle();
  };

  const startFloorCycle = () => {
    timerRef.current = schedule(() => {
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
         // FULL ELEVATOR: no longer an instant loss. The solver-backed
         // generator guarantees even a full board is still clearable, so the
         // player gets a short, honest countdown to dig themselves out.
         const remaining = (prev.overloadCountdown ?? OVERLOAD_GRACE_FLOORS + 1) - 1;
         if (remaining <= 0) {
           gameOver = true;
           audioManager.stopMusic();
           audioManager.playPanic();
           const { newHigh, newBestFloor } = saveRecords(prev.score, prev.floor, prev.highScore, prev.bestFloor);
           return {
               ...prev,
               phase: 'GAME_OVER',
               gameOverReason: 'BANKRUPT',
               highScore: newHigh,
               bestFloor: newBestFloor
           };
         }
         audioManager.playPanic();
         return { ...prev, overloadCountdown: remaining };
      }

      // Early floors get "rest stops" where nobody boards - a gentle ramp-up
      const numToAdd = prev.penguins.length === 0
        ? 3
        : shouldBoardThisFloor(prev.floor, prev.penguins.length) ? 1 : 0;
      let nextPenguins: Penguin[] = prev.penguins.map(p => ({ ...p, isEntering: false, isPushed: false }));
      let added = false;

      for (let i = 0; i < numToAdd; i++) {
          if (nextPenguins.length >= MAX_CAPACITY) break;
          // SMART BOARDING: the newcomer's cell and facing are chosen so the
          // whole board stays fully clearable - placement is literally based
          // on the existing positions and facings of everyone else.
          const placement = chooseSpawnPlacement(nextPenguins);
          if (placement) {
              // The newcomer shoves its orthogonal neighbors around; a shove
              // may spin them, but only into a facing the solver approves -
              // a push can never rotate the puzzle into a dead end.
              nextPenguins = nextPenguins.map(p => {
                const isNeighbor = Math.abs(p.x - placement.pos.x) + Math.abs(p.y - placement.pos.y) === 1;
                if (isNeighbor && !p.isFalling && Math.random() < 0.5) {
                  return { ...p, isPushed: true };
                }
                return p;
              });
              nextPenguins.push({
                id: uuidv4(),
                x: placement.pos.x,
                y: placement.pos.y,
                direction: placement.direction,
                type: getRandomPenguinType(),
                isEntering: true,
                appearanceVariant: Math.floor(Math.random() * 4)
              });
              added = true;
          }
          // placement === null: no spot keeps the board solvable this floor,
          // so the doors simply let nobody on (never observed in simulation,
          // but handled gracefully).
      }

      if (added) audioManager.playEnter();
      // Leaving a full state resets the make-room countdown
      const overloadCountdown = nextPenguins.length >= MAX_CAPACITY ? prev.overloadCountdown : null;
      return { ...prev, penguins: nextPenguins, overloadCountdown };
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

    timerRef.current = schedule(() => {
        setGameState(prev => {
           if (prev.phase !== 'PLAYING') return prev;
           return { ...prev, elevatorState: 'CLOSING' };
        });

        schedule(() => {
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

    // TELEGRAPHED ROTATION: the turn is computed early (solver-verified so
    // it can never break clearability), the affected penguins show a wind-up
    // arrow for ROTATION_TELEGRAPH_MS, and only then do facings flip. No
    // more silent mid-ride spins deciding a drop you already committed to.
    schedule(() => {
      setGameState(prev => {
        if (prev.phase !== 'PLAYING') return prev;
        const rotated = smartRotatePenguins(prev.penguins, prev.floor);
        rotationPlanRef.current = rotated;
        const turningIds = new Set(
          rotated.filter((p, i) => p.direction !== prev.penguins[i]?.direction).map(p => p.id)
        );
        return {
          ...prev,
          penguins: prev.penguins.map(p => ({ ...p, isTurning: turningIds.has(p.id) }))
        };
      });
    }, Math.max(0, rotationEventTime - ROTATION_TELEGRAPH_MS));

    schedule(() => {
      setGameState(prev => {
        if (prev.phase !== 'PLAYING' || !rotationPlanRef.current) return prev;
        // Apply the planned facings to the penguins that still exist
        // (some may have been dropped during the telegraph)
        const planned = new Map(rotationPlanRef.current.map(p => [p.id, p.direction]));
        rotationPlanRef.current = null;
        const next = prev.penguins.map(p => ({
          ...p,
          direction: p.isFalling ? p.direction : (planned.get(p.id) ?? p.direction),
          isTurning: false,
        }));
        // A drop during the telegraph can invalidate the plan - keep the old
        // facings in that case rather than apply an unverified board
        return { ...prev, penguins: isClearable(next) ? next : prev.penguins.map(p => ({ ...p, isTurning: false })) };
      });
    }, rotationEventTime);

    schedule(() => {
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

  /**
   * Pause freezes the elevator machine by clearing every scheduled cycle
   * timer; resume re-enters the cycle at the current elevator state. The
   * boarding/travel countdown restarts from the top of its phase - a small,
   * player-friendly simplification.
   */
  const resumeCycle = (state: ElevatorState) => {
    switch (state) {
      case 'STOPPED':
        startFloorCycle();
        break;
      case 'BOARDING':
        timerRef.current = schedule(() => {
          setGameState(prev => prev.phase !== 'PLAYING' ? prev : { ...prev, elevatorState: 'CLOSING' });
          schedule(() => handleMoving(), TIMING.DOOR_ANIMATION);
        }, getBoardingTime(gameState.floor));
        break;
      case 'CLOSING':
        schedule(() => handleMoving(), TIMING.DOOR_ANIMATION);
        break;
      case 'MOVING':
        handleMoving();
        break;
    }
  };

  const togglePause = () => {
    if (gameState.phase !== 'PLAYING') return;
    if (!gameState.isPaused) {
      clearCycleTimers();
      audioManager.pauseMusic();
      setGameState(prev => ({ ...prev, isPaused: true }));
    } else {
      audioManager.resumeMusic();
      setGameState(prev => ({ ...prev, isPaused: false }));
      resumeCycle(gameState.elevatorState);
    }
  };

  // Places a fish on a random empty tile (for the quick-use button / F key)
  const placeFishAuto = () => {
    const empty = findEmptyCell(gameState.penguins.filter(p => !p.isFalling));
    if (empty) triggerFishTreat(empty.x, empty.y);
  };

  const triggerFishTreat = (x: number = 1, y: number = 1) => {
    if (gameState.isPaused) return;
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
    if (gameState.phase !== 'PLAYING' || gameState.isPaused) return;

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
           const { newHigh, newBestFloor } = saveRecords(prev.score, prev.floor, prev.highScore, prev.bestFloor);
           return {
             ...prev,
             phase: 'GAME_OVER',
             gameOverReason: 'CAUGHT',
             highScore: newHigh,
             bestFloor: newBestFloor
           };
        });
      }, TIMING.PANIC_DELAY);
    }
  }, [gameState.penguins, gameState.phase, gameState.fishTreat, gameState.combo, gameState.isPaused]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState.phase === 'START_MENU') {
          requestStart(); // menu start runs the rooftop intro first
        } else if (gameState.phase === 'GAME_OVER') {
          startGame();    // quick restart skips straight into the run
        }
      }
      if (e.code === 'KeyF' && gameState.phase === 'PLAYING') {
        placeFishAuto();
      }
      if (e.code === 'KeyV' && gameState.phase === 'PLAYING') {
        setGameState(prev => ({ ...prev, showVisionCones: !prev.showVisionCones }));
      }
      if ((e.code === 'KeyP' || e.code === 'Escape') && gameState.phase === 'PLAYING') {
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, gameState.isPaused, gameState.elevatorState]);

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
              onStart={requestStart}
              highScore={gameState.highScore}
              bestFloor={gameState.bestFloor}
              isMuted={gameState.isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {gameState.phase === 'INTRO' && (
            <IntroSequence key="intro" onComplete={startGame} />
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
                isPaused={gameState.isPaused}
                elevatorState={gameState.elevatorState}
                showVisionCones={gameState.showVisionCones}
                viewMode={gameState.viewMode}
                onToggleMute={handleToggleMute}
                onTogglePause={togglePause}
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

              {/* PAUSE OVERLAY - blocks the board and freezes the run */}
              {gameState.isPaused && (
                <div
                  // Solid scrim, no backdrop-blur: the board behind keeps its
                  // idle animations while paused, and a backdrop filter would
                  // re-blur it every frame.
                  className="absolute inset-0 z-40 bg-slate-950/90 flex flex-col items-center justify-center gap-5"
                  onClick={togglePause}
                >
                  <div className="font-pixel font-bold text-3xl text-[#efece2] tracking-widest" style={{ textShadow: '0 4px 0 #12213c' }}>PAUSED</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePause(); }}
                    className="px-8 py-3 bg-[#f2901f] hover:bg-[#fbbf3c] text-[#232a4a] font-pixel font-bold rounded-2xl border-b-[6px] border-[#c26a10] active:translate-y-1 active:border-b-2 text-sm uppercase tracking-widest transition-all"
                  >
                    ▶ Resume
                  </button>
                  <div className="font-pixel text-[9px] text-[#8fa2c0] uppercase tracking-wider">P or ESC to resume</div>
                </div>
              )}

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
                overloadCountdown={gameState.overloadCountdown}
              />
            </motion.div>
          )}

          {gameState.phase === 'GAME_OVER' && (
             <GameOverScreen
               key="gameover"
               score={gameState.score}
               floor={gameState.floor}
               highScore={gameState.highScore}
               bestFloor={gameState.bestFloor}
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
