import { Direction, Penguin, GridPos } from '../types';
import { GRID_SIZE } from '../constants';

export const getVector = (dir: Direction): GridPos => {
  switch (dir) {
    case 'UP': return { x: 0, y: -1 };
    case 'DOWN': return { x: 0, y: 1 };
    case 'LEFT': return { x: -1, y: 0 };
    case 'RIGHT': return { x: 1, y: 0 };
  }
};

/**
 * Checks if 'target' is visible to 'observer'
 */
export const isVisible = (observer: Penguin, target: Penguin, allPenguins: Penguin[]): boolean => {
  if (observer.id === target.id) return false;
  if (observer.isFalling || target.isFalling) return false;

  const vector = getVector(observer.direction);
  
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;

  // Must be perfectly aligned on one axis
  if (dx !== 0 && dy !== 0) return false;

  // Must be in the direction the observer is facing
  if (vector.x !== 0 && Math.sign(dx) !== vector.x) return false;
  if (vector.y !== 0 && Math.sign(dy) !== vector.y) return false;

  // Check for obstacles
  let cx = observer.x + vector.x;
  let cy = observer.y + vector.y;

  while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
    if (cx === target.x && cy === target.y) {
      return true;
    }

    const blocker = allPenguins.find(p => p.x === cx && p.y === cy && !p.isFalling);
    if (blocker) {
      return false; // Vision blocked
    }

    cx += vector.x;
    cy += vector.y;
  }

  return false;
};

/**
 * DEBUG: Returns all cells currently being watched by penguins
 */
export const getMonitoredCells = (penguins: Penguin[]): Set<string> => {
    const monitored = new Set<string>();

    penguins.forEach(observer => {
        if (observer.isFalling || observer.isPanic) return;

        const vector = getVector(observer.direction);
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

    return monitored;
};

export const checkDropSafety = (targetId: string, penguins: Penguin[]): { safe: boolean; witnesses: string[] } => {
  const target = penguins.find(p => p.id === targetId);
  if (!target) return { safe: true, witnesses: [] };

  const witnesses: string[] = [];

  penguins.forEach(observer => {
    if (observer.id === targetId) return;
    if (isVisible(observer, target, penguins)) {
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

export const rotatePenguin = (currentDir: Direction): Direction => {
  const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  const currentIndex = dirs.indexOf(currentDir);
  const turn = Math.random() > 0.5 ? 1 : -1;
  let newIndex = (currentIndex + turn) % 4;
  if (newIndex < 0) newIndex += 4;
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