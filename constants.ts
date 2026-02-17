export const APP_VERSION = "v2.2.0-fix";

export const DEBUG_MODE = true; // Set to true to highlight monitored tiles

export const GRID_SIZE = 4;
export const MAX_CAPACITY = GRID_SIZE * GRID_SIZE;

export const SCORE_PER_FLOOR = 1;
export const PENALTY_FULL_ELEVATOR = 2;
export const MIN_SCORE_THRESHOLD = -10;

// Dimensions for 2D Isometric projection
// A 2:1 ratio is standard for pixel art/clean isometric (e.g. width 100, height 50)
export const TILE_WIDTH = 100;
export const TILE_HEIGHT = 50; 

// Timings in milliseconds
export const TIMING = {
  STOP_DELAY: 500,        // Time to wait after arriving before door opens
  BOARDING_TIME: 1500,    // How long the door stays open
  DOOR_ANIMATION: 500,    // Time for door to close
  MOVE_TIME: 4000,        // Duration of elevator moving to next floor
  ROTATION_EVENT: 2000,   // When during the move phase penguins rotate
  DROP_ANIMATION: 600,    // Time for penguin to fall through trapdoor
  PANIC_DELAY: 1500,      // Time before game over screen after panic
};

export const CELL_SIZE = 64; // Fallback