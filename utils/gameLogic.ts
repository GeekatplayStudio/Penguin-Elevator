import { Direction, Penguin, GridPos, PenguinTypeVariant, FishTreat } from '../types';
import { GRID_SIZE } from '../constants';

export const getVector = (dir: Direction): GridPos => {
  switch (dir) {
    case 'DOWN':  return { x: 1, y: 0 };  // SouthEast (Front)
    case 'LEFT':  return { x: 0, y: 1 };  // SouthWest (Left)
    case 'RIGHT': return { x: 0, y: -1 }; // NorthEast (Right)
    case 'UP':    return { x: -1, y: 0 }; // NorthWest (Back)
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
    return dx >= 0 ? 'DOWN' : 'UP';
  } else {
    return dy >= 0 ? 'LEFT' : 'RIGHT';
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

export const MAX_VISION_DISTANCE = 2; // Vision radius: max 2 steps away (3x3 box around penguin)

/**
 * Checks if 'target' is visible to 'observer'. A penguin watches 3 of the 4
 * cardinal directions from its cell (FRONT, LEFT, RIGHT - NO BACK VISION),
 * up to MAX_VISION_DISTANCE = 2 tiles (3x3 radius), each ray blocked by the first standing penguin it hits.
 */
export const isVisible = (observer: Penguin, target: Penguin, allPenguins: Penguin[], fishTreat?: FishTreat | null): boolean => {
  if (observer.id === target.id) return false;
  if (observer.isFalling || target.isFalling) return false;

  // SLEEPY penguins do not observe anything while in elevator
  if (observer.type === 'SLEEPY') return false;

  const dx = target.x - observer.x;
  const dy = target.y - observer.y;

  // Vision is strictly limited to 3x3 radius (max distance 2 steps)
  if (Math.abs(dx) > MAX_VISION_DISTANCE || Math.abs(dy) > MAX_VISION_DISTANCE) return false;

  // Must be perfectly aligned on one axis
  if (dx !== 0 && dy !== 0) return false;

  return getActiveVisionDirections(observer, fishTreat).some(dir => {
    const vector = getVector(dir);

    // Must be in this ray's direction
    if (vector.x !== 0 && Math.sign(dx) !== vector.x) return false;
    if (vector.y !== 0 && Math.sign(dy) !== vector.y) return false;

    // Walk ray up to MAX_VISION_DISTANCE (2 steps), stopping at first obstacle
    let step = 1;
    let cx = observer.x + vector.x;
    let cy = observer.y + vector.y;

    while (step <= MAX_VISION_DISTANCE && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
      if (cx === target.x && cy === target.y) return true;
      const blocker = allPenguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
      if (blocker) return false;

      cx += vector.x;
      cy += vector.y;
      step++;
    }
    return false;
  });
};

/**
 * Returns all cells currently being watched by penguins (FRONT, LEFT, RIGHT),
 * up to MAX_VISION_DISTANCE = 2 tiles (3x3 radius around penguin).
 */
export const getMonitoredCells = (penguins: Penguin[], fishTreat?: FishTreat | null): Set<string> => {
    const monitored = new Set<string>();

    penguins.forEach(observer => {
        if (observer.isFalling || observer.isPanic || observer.type === 'SLEEPY') return;

        getActiveVisionDirections(observer, fishTreat).forEach(dir => {
            const vector = getVector(dir);
            let step = 1;
            let cx = observer.x + vector.x;
            let cy = observer.y + vector.y;

            while (step <= MAX_VISION_DISTANCE && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
                monitored.add(`${cx},${cy}`);

                // Vision blocked by other standing penguins
                const blocker = penguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
                if (blocker) break;

                cx += vector.x;
                cy += vector.y;
                step++;
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

/**
 * Calculates rotation probability, move time, and boarding time based on floor tier.
 * Increases slightly every 10th level.
 */
export const getFloorTier = (floor: number): number => {
  return Math.floor(Math.max(0, floor - 1) / 10);
};

export const getRotationChance = (floor: number, pType: PenguinTypeVariant): number => {
  const tier = getFloorTier(floor);
  let baseChance = 0.25 + (tier * 0.08); // 25% base on levels 1-10 + 8% per 10 levels
  baseChance = Math.min(0.70, baseChance);

  if (pType === 'SLEEPY') return baseChance * 0.25;
  if (pType === 'JITTERY') return Math.min(0.85, baseChance * 1.5);

  return baseChance;
};

export const getMoveTime = (floor: number): number => {
  const tier = getFloorTier(floor);
  const baseTime = 5500; // 5.5s for levels 1-10 (Slow, comfortable transition)
  const reduced = baseTime - (tier * 400);
  return Math.max(3000, reduced); // Minimum 3.0s
};

export const getBoardingTime = (floor: number): number => {
  const tier = getFloorTier(floor);
  const baseTime = 4500; // 4.5s for levels 1-10 (Generous time to plan & click)
  const reduced = baseTime - (tier * 300);
  return Math.max(2500, reduced); // Minimum 2.5s
};

export const rotatePenguin = (currentDir: Direction, pType: PenguinTypeVariant, floor: number = 1): Direction => {
  const rotationChance = getRotationChance(floor, pType);

  // If random check exceeds rotation chance, penguin maintains its current direction
  if (Math.random() > rotationChance) {
    return currentDir;
  }

  const dirs: Direction[] = ['DOWN', 'RIGHT', 'UP', 'LEFT']; // Clockwise isometric sequence around 4 sides
  const currentIndex = dirs.indexOf(currentDir);

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
