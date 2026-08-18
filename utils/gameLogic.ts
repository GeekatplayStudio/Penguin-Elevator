import { Direction, Penguin, GridPos, PenguinTypeVariant, FishTreat } from '../types';
import { GRID_SIZE } from '../constants';

export const getVector = (dir: Direction): GridPos => {
  switch (dir) {
    case 'DOWN': return { x: 0, y: 1 };
    case 'LEFT': return { x: -1, y: 0 };
    case 'RIGHT': return { x: 1, y: 0 };
    case 'UP': return { x: 0, y: -1 };
  }
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const ALL_DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/**
 * A penguin watches 3 of the 4 cardinal rays from its cell - every direction
 * except straight behind it (the opposite of where it's facing). It cannot
 * see anything happening directly at its back.
 */
export const getVisibleDirections = (facingDir: Direction): Direction[] => {
  const blindSpot = OPPOSITE_DIRECTION[facingDir];
  return ALL_DIRECTIONS.filter(dir => dir !== blindSpot);
};

/**
 * Calculates direction towards a target coordinate (e.g. fish treat)
 * Returns all 4 isometric directions: UP, DOWN, LEFT, RIGHT
 */
export const getDirectionTowards = (from: GridPos, to: GridPos): Direction => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'RIGHT' : 'LEFT';
  } else {
    return dy >= 0 ? 'DOWN' : 'UP';
  }
};

/**
 * Determines which directions an observer is actively casting vision rays
 * down right now: 3 directions (everything but its blind spot behind it)
 * normally, or a single direction locked onto an active fish treat.
 */
const getActiveVisionDirections = (observer: Penguin, fishTreat?: FishTreat | null): Direction[] => {
  if (fishTreat && fishTreat.active) {
    return [getDirectionTowards(observer, fishTreat)];
  }
  return getVisibleDirections(observer.direction);
};

/**
 * Checks if 'target' is visible to 'observer'. A penguin watches 3 of the 4
 * cardinal directions from its cell (every ray except straight behind it),
 * each ray blocked by the first standing penguin it hits.
 */
export const isVisible = (observer: Penguin, target: Penguin, allPenguins: Penguin[], fishTreat?: FishTreat | null): boolean => {
  if (observer.id === target.id) return false;
  if (observer.isFalling || target.isFalling) return false;

  // SLEEPY penguins do not observe anything while in elevator
  if (observer.type === 'SLEEPY') return false;

  const dx = target.x - observer.x;
  const dy = target.y - observer.y;

  // Must be perfectly aligned on one axis
  if (dx !== 0 && dy !== 0) return false;

  return getActiveVisionDirections(observer, fishTreat).some(dir => {
    const vector = getVector(dir);

    // Must be in this ray's direction
    if (vector.x !== 0 && Math.sign(dx) !== vector.x) return false;
    if (vector.y !== 0 && Math.sign(dy) !== vector.y) return false;

    // Walk the ray, stopping at the first obstacle
    let cx = observer.x + vector.x;
    let cy = observer.y + vector.y;
    while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
      if (cx === target.x && cy === target.y) return true;
      const blocker = allPenguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
      if (blocker) return false;
      cx += vector.x;
      cy += vector.y;
    }
    return false;
  });
};

/**
 * Returns all cells currently being watched by penguins, across all of
 * each observer's active vision rays.
 */
export const getMonitoredCells = (penguins: Penguin[], fishTreat?: FishTreat | null): Set<string> => {
    const monitored = new Set<string>();

    penguins.forEach(observer => {
        if (observer.isFalling || observer.isPanic || observer.type === 'SLEEPY') return;

        getActiveVisionDirections(observer, fishTreat).forEach(dir => {
            const vector = getVector(dir);
            let cx = observer.x + vector.x;
            let cy = observer.y + vector.y;

            while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
                monitored.add(`${cx},${cy}`);

                // Vision blocked by other standing penguins
                const blocker = penguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
                if (blocker) break;

                cx += vector.x;
                cy += vector.y;
            }
        });
    });

    return monitored;
};

export const checkDropSafety = (targetId: string, penguins: Penguin[], fishTreat?: FishTreat | null): { safe: boolean; witnesses: string[] } => {
  const target = penguins.find(p => p.id === targetId);
  if (!target) return { safe: true, witnesses: [] };

  const witnesses: string[] = [];

  penguins.forEach(observer => {
    if (observer.id === targetId) return;
    if (isVisible(observer, target, penguins, fishTreat)) {
      witnesses.push(observer.id);
    }
  });

  return {
    safe: witnesses.length === 0,
    witnesses
  };
};

export const getRandomDirection = (): Direction => {
  const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  return dirs[Math.floor(Math.random() * dirs.length)];
};

export const getRandomPenguinType = (): PenguinTypeVariant => {
  const rand = Math.random();
  if (rand < 0.60) return 'STANDARD';
  if (rand < 0.78) return 'SLEEPY';
  if (rand < 0.90) return 'VIP';
  return 'JITTERY';
};

export const rotatePenguin = (currentDir: Direction, pType: PenguinTypeVariant): Direction => {
  const dirs: Direction[] = ['DOWN', 'RIGHT', 'UP', 'LEFT']; // Clockwise isometric sequence around 4 sides
  const currentIndex = dirs.indexOf(currentDir);
  
  // JITTERY rotates twice as often, SLEEPY stays still 50% of time
  if (pType === 'SLEEPY' && Math.random() < 0.5) return currentDir;

  // Rotate to next direction randomly clockwise or counter-clockwise
  const turn = Math.random() > 0.5 ? 1 : -1;
  let newIndex = (currentIndex + turn + dirs.length) % dirs.length;
  return dirs[newIndex];
};

export const findEmptyCell = (penguins: Penguin[]): GridPos | null => {
  const occupied = new Set(penguins.map(p => `${p.x},${p.y}`));
  const empty: GridPos[] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }

  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};
