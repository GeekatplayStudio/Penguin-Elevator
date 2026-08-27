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
 * VISION: a forward cone plus immediate peripheral awareness.
 *   - 3 tiles straight ahead
 *   - 2 along each forward diagonal
 *   - 1 directly to each side: you notice someone dropped RIGHT BESIDE you
 *   - nothing behind (back and back-diagonals blind)
 *
 * The side range is exactly 1 and must stay 1: an earlier spec with sides
 * at range 2 made the 4x4 board mathematically unsolvable (0% of boards
 * clearable at any fill), and a distance-1 side watch cannot be blocked -
 * so every side tile added multiplies the constraint density. At 1 it
 * matches intuition ("I'd notice my neighbor vanish") while the solver
 * keeps every generated board clearable.
 */
export const VISION_RANGE = {
  FORWARD: 3,
  FORWARD_DIAGONAL: 2,
  SIDE: 1,
  BACK: 0,
} as const;

export const MAX_VISION_DISTANCE = VISION_RANGE.FORWARD; // Longest possible ray

/** A ray a penguin is currently watching: a step vector and how far it sees. */
export interface VisionRay {
  dx: number;
  dy: number;
  range: number;
}

/**
 * The 5 rays a penguin watches given its facing: forward (3), both forward
 * diagonals (2), and each immediate side neighbor (1). Back and back
 * diagonals see nothing.
 */
export const getVisionRays = (facingDir: Direction): VisionRay[] => {
  const f = getVector(facingDir);              // forward unit vector
  const r = { x: -f.y, y: f.x };               // perpendicular unit vector
  return [
    { dx: f.x, dy: f.y, range: VISION_RANGE.FORWARD },
    { dx: f.x + r.x, dy: f.y + r.y, range: VISION_RANGE.FORWARD_DIAGONAL },
    { dx: f.x - r.x, dy: f.y - r.y, range: VISION_RANGE.FORWARD_DIAGONAL },
    { dx: r.x, dy: r.y, range: VISION_RANGE.SIDE },
    { dx: -r.x, dy: -r.y, range: VISION_RANGE.SIDE },
  ];
};

/**
 * Item 1 of the logic redesign: ONE predicate decides who is currently
 * observing. A penguin that is falling, mid-drop (dizzy), panicking, or
 * asleep sees nothing. checkDropSafety AND the red-tile overlay both use
 * this, so what the player sees is exactly what the rules enforce - the
 * old code let a dizzy (already-dropped!) penguin witness a second drop.
 */
export const isObserving = (p: Penguin): boolean =>
  !p.isFalling && !p.isDizzy && !p.isPanic && p.type !== 'SLEEPY';

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
 * The rays an observer is actively watching right now: its normal forward
 * cone, or - while a fish treat is out - a single stare locked onto the
 * fish, since its full attention is on the snack.
 */
const getActiveVisionRays = (observer: Penguin, fishTreat?: FishTreat | null): VisionRay[] => {
  if (fishTreat && fishTreat.active) {
    const v = getVector(getDirectionTowards(observer, fishTreat));
    return [{ dx: v.x, dy: v.y, range: VISION_RANGE.FORWARD }];
  }
  return getVisionRays(observer.direction);
};

/**
 * Walks one vision ray cell by cell. Returns true if the target cell is
 * reached before the ray runs out or hits a standing penguin - blocking works
 * on the forward, side, AND diagonal rays alike.
 */
const rayHitsTarget = (
  observer: Penguin,
  ray: VisionRay,
  targetX: number,
  targetY: number,
  allPenguins: Penguin[]
): boolean => {
  let cx = observer.x + ray.dx;
  let cy = observer.y + ray.dy;

  for (let step = 1; step <= ray.range && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE; step++) {
    if (cx === targetX && cy === targetY) return true;
    const blocker = allPenguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
    if (blocker) return false;
    cx += ray.dx;
    cy += ray.dy;
  }
  return false;
};

/**
 * Checks if 'target' is visible to 'observer'. A penguin sees 3 tiles
 * straight ahead and 2 along each forward diagonal - sides and back are
 * blind. Each ray is blocked by the first standing penguin it hits.
 */
export const isVisible = (observer: Penguin, target: Penguin, allPenguins: Penguin[], fishTreat?: FishTreat | null): boolean => {
  if (observer.id === target.id) return false;
  if (!isObserving(observer) || target.isFalling) return false;

  return getActiveVisionRays(observer, fishTreat).some(ray =>
    rayHitsTarget(observer, ray, target.x, target.y, allPenguins)
  );
};

/**
 * Returns all cells currently being watched: 3 tiles ahead of each penguin
 * and 2 along each forward diagonal - stopping wherever the line of sight
 * is blocked by another standing penguin.
 */
export const getMonitoredCells = (penguins: Penguin[], fishTreat?: FishTreat | null): Set<string> => {
    const monitored = new Set<string>();

    penguins.forEach(observer => {
        if (!isObserving(observer)) return;

        getActiveVisionRays(observer, fishTreat).forEach(ray => {
            let cx = observer.x + ray.dx;
            let cy = observer.y + ray.dy;

            for (let step = 1; step <= ray.range && cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE; step++) {
                monitored.add(`${cx},${cy}`);

                // Vision blocked by other standing penguins
                const blocker = penguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
                if (blocker) break;

                cx += ray.dx;
                cy += ray.dy;
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

/**
 * Player-facing difficulty level, shown in the HUD. Level 1 covers floors
 * 1-10, level 2 covers 11-20, and so on - the same tiers every pacing knob
 * below keys off, so what the badge says always matches how the game feels.
 */
export const getDifficultyLevel = (floor: number): number => {
  return getFloorTier(floor) + 1;
};

export const getRotationChance = (floor: number, pType: PenguinTypeVariant): number => {
  const tier = getFloorTier(floor);
  // Meditative burn: 12% on the first floors, +4% per 10 floors, capped at
  // half. Even floor 100 never becomes a scramble - the challenge comes from
  // the solver's difficulty targets, not from chaos.
  let baseChance = 0.12 + (tier * 0.04);
  baseChance = Math.min(0.50, baseChance);

  if (pType === 'SLEEPY') return baseChance * 0.25;
  if (pType === 'JITTERY') return Math.min(0.80, baseChance * 1.5);

  return baseChance;
};

export const getMoveTime = (floor: number): number => {
  const tier = getFloorTier(floor);
  const baseTime = 6500; // Very relaxed ride between floors 1-10
  const reduced = baseTime - (tier * 150); // barely-perceptible 0.15s per 10 floors
  return Math.max(4500, reduced); // floor 140+ still gives a calm 4.5s ride
};

export const getBoardingTime = (floor: number): number => {
  const tier = getFloorTier(floor);
  const baseTime = 6000; // Long open-door pause on floors 1-10 to plan & tap
  const reduced = baseTime - (tier * 150);
  return Math.max(4000, reduced); // never less than 4s to think at the doors
};

/**
 * On early floors the elevator takes on passengers only every OTHER floor,
 * giving new players breathing room. From floor 13 up, someone boards on
 * every floor.
 */
export const shouldBoardThisFloor = (floor: number, penguinCount: number): boolean => {
  if (penguinCount === 0) return true;        // never leave the floor empty
  if (floor <= 16 && floor % 2 === 0) return false; // rest floors through 16
  if (floor <= 40 && floor % 5 === 0) return false; // an occasional breather after
  return true;
};

/**
 * Item 7: the solver-driven difficulty dial, tuned for a meditative climb.
 * This is the MINIMUM number of simultaneously-safe drops the generator
 * tries to keep on the board after every boarding and rotation. It declines
 * about as slowly as a difficulty curve can: a player gets fifty gentle
 * floors before the puzzle asks for real reading, and the floor of 1 plus
 * the clearability invariant means success is always reachable.
 *
 *   floors  1-20   keep >= 4 safe drops  (almost anything you tap works)
 *   floors 21-50   keep >= 3
 *   floors 51-90   keep >= 2
 *   floors 91+     keep >= 1              (pure puzzle, still always solvable)
 */
export const getTargetSafeDrops = (floor: number): number => {
  if (floor <= 20) return 4;
  if (floor <= 50) return 3;
  if (floor <= 90) return 2;
  return 1;
};

/**
 * Direction facing the nearest wall from a cell - a penguin staring at the
 * wall has its whole back to the room, making it an easy, readable target.
 */
export const getWallFacingDirection = (pos: GridPos): Direction => {
  const options: { dir: Direction; dist: number }[] = [
    { dir: 'LEFT', dist: pos.x },
    { dir: 'RIGHT', dist: GRID_SIZE - 1 - pos.x },
    { dir: 'UP', dist: pos.y },
    { dir: 'DOWN', dist: GRID_SIZE - 1 - pos.y },
  ];
  const minDist = Math.min(...options.map(o => o.dist));
  const nearest = options.filter(o => o.dist === minDist);
  return nearest[Math.floor(Math.random() * nearest.length)].dir;
};

/**
 * Spawn facing with a difficulty curve: on the first floors most newcomers
 * predictably stare at the nearest wall (easy to read, easy to drop safely);
 * higher up, facing becomes more and more random.
 */
export const getSpawnDirection = (pos: GridPos, floor: number): Direction => {
  const tier = getFloorTier(floor);
  const wallChance = Math.max(0, 0.85 - tier * 0.18); // 85% -> 67% -> 49% -> ... -> 0% by floor ~50
  if (Math.random() < wallChance) {
    return getWallFacingDirection(pos);
  }
  return getRandomDirection();
};

/** Always turns 90° to a random adjacent side (never a corner, never 180°). */
export const forceRotate = (currentDir: Direction): Direction => {
  const dirs: Direction[] = ['DOWN', 'RIGHT', 'UP', 'LEFT']; // 90° cycle around the 4 sides
  const currentIndex = dirs.indexOf(currentDir);
  const turn = Math.random() > 0.5 ? 1 : -1;
  const newIndex = (currentIndex + turn + dirs.length) % dirs.length;
  return dirs[newIndex];
};

export const rotatePenguin = (currentDir: Direction, pType: PenguinTypeVariant, floor: number = 1): Direction => {
  const rotationChance = getRotationChance(floor, pType);

  // If random check exceeds rotation chance, penguin maintains its current direction
  if (Math.random() > rotationChance) {
    return currentDir;
  }

  return forceRotate(currentDir);
};

/**
 * Rotation pass for a whole floor: every penguin rolls its own chance, but at
 * least ONE penguin is guaranteed to turn each level so the board always
 * changes and rotation stays visible. Sleepy penguins are exempt from the
 * forced turn (they're asleep), unless they're all that's left.
 */
export const rotateAllPenguins = (penguins: Penguin[], floor: number): Penguin[] => {
  const rotated = penguins.map(p => ({
    ...p,
    direction: p.isFalling ? p.direction : rotatePenguin(p.direction, p.type, floor),
  }));

  const anyTurned = rotated.some((p, i) => p.direction !== penguins[i].direction);
  if (!anyTurned) {
    const candidates = rotated.filter(p => !p.isFalling && p.type !== 'SLEEPY');
    const pool = candidates.length > 0 ? candidates : rotated.filter(p => !p.isFalling);
    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return rotated.map(p => p.id === chosen.id ? { ...p, direction: forceRotate(p.direction) } : p);
    }
  }
  return rotated;
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
