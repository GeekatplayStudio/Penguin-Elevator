import { Direction, Penguin, GridPos, PenguinTypeVariant, FishTreat } from '../types';
import { GRID_SIZE } from '../constants';

// Screen-aligned axes: penguins face the flat SIDES of squares, never corners.
export const getVector = (dir: Direction): GridPos => {
  switch (dir) {
    case 'DOWN':  return { x: 0, y: 1 };  // Toward viewer (front sprite)
    case 'UP':    return { x: 0, y: -1 }; // Away from viewer (back sprite)
    case 'LEFT':  return { x: -1, y: 0 }; // Screen left
    case 'RIGHT': return { x: 1, y: 0 };  // Screen right
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
 * How far a penguin sees along each ray, by where that ray sits relative to
 * its facing: straight ahead it has a clear long look, to the sides it only
 * catches things in the corner of its eye, and behind it sees nothing at all.
 */
export const VISION_RANGE = {
  FORWARD: 3,
  SIDE: 2,
  BACK: 0,
} as const;

export const MAX_VISION_DISTANCE = VISION_RANGE.FORWARD; // Longest possible ray

/** A ray a penguin is currently watching, with how far down it can see. */
export interface VisionRay {
  dir: Direction;
  range: number;
}

/**
 * The rays a penguin watches given where it's facing: forward at full range,
 * both sides at the shorter range, and nothing behind it.
 */
export const getVisionRays = (facingDir: Direction): VisionRay[] => {
  const blindSpot = OPPOSITE_DIRECTION[facingDir];
  return ALL_DIRECTIONS
    .filter(dir => dir !== blindSpot)
    .map(dir => ({
      dir,
      range: dir === facingDir ? VISION_RANGE.FORWARD : VISION_RANGE.SIDE,
    }));
};

/**
 * Calculates direction towards a target coordinate (e.g. fish treat)
 * using screen-aligned axes.
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
 * The rays an observer is actively watching right now: its normal forward and
 * side rays, or - while a fish treat is out - a single stare locked onto the
 * fish, since its full attention is on the snack.
 */
const getActiveVisionRays = (observer: Penguin, fishTreat?: FishTreat | null): VisionRay[] => {
  if (fishTreat && fishTreat.active) {
    return [{ dir: getDirectionTowards(observer, fishTreat), range: VISION_RANGE.FORWARD }];
  }
  return getVisionRays(observer.direction);
};

/**
 * Checks if 'target' is visible to 'observer'. A penguin sees 3 tiles straight
 * ahead, 2 tiles to either side, and nothing behind it. Each ray is blocked by
 * the first standing penguin it hits.
 */
export const isVisible = (observer: Penguin, target: Penguin, allPenguins: Penguin[], fishTreat?: FishTreat | null): boolean => {
  if (observer.id === target.id) return false;
  if (observer.isFalling || target.isFalling) return false;

  // SLEEPY penguins do not observe anything while in elevator
  if (observer.type === 'SLEEPY') return false;

  const dx = target.x - observer.x;
  const dy = target.y - observer.y;

  // Must be perfectly aligned on one axis - vision only travels straight
  if (dx !== 0 && dy !== 0) return false;

  return getActiveVisionRays(observer, fishTreat).some(({ dir, range }) => {
    const vector = getVector(dir);

    // Must be in this ray's direction
    if (vector.x !== 0 && Math.sign(dx) !== vector.x) return false;
    if (vector.y !== 0 && Math.sign(dy) !== vector.y) return false;

    // Walk the ray out to its own range, stopping at the first obstacle
    let step = 1;
    let cx = observer.x + vector.x;
    let cy = observer.y + vector.y;

    while (step <= range && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
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
 * Returns all cells currently being watched: 3 tiles ahead of each penguin and
 * 2 tiles to either side, stopping wherever the line of sight is blocked.
 */
export const getMonitoredCells = (penguins: Penguin[], fishTreat?: FishTreat | null): Set<string> => {
    const monitored = new Set<string>();

    penguins.forEach(observer => {
        if (observer.isFalling || observer.isPanic || observer.type === 'SLEEPY') return;

        getActiveVisionRays(observer, fishTreat).forEach(({ dir, range }) => {
            const vector = getVector(dir);
            let step = 1;
            let cx = observer.x + vector.x;
            let cy = observer.y + vector.y;

            while (step <= range && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
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
