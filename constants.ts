export const APP_VERSION = "v3.0.0-mobile";
export const STUDIO_NAME = "Geekatplay Studio";
export const AUTHOR_NAME = "Geekatplay Studio";
export const COPYRIGHT_NOTICE = "© Geekatplay Studio";

export const DEBUG_MODE = false; // Toggle debug mode

export const GRID_SIZE = 4;
export const MAX_CAPACITY = GRID_SIZE * GRID_SIZE;

export const SCORE_PER_FLOOR = 1;

// Dimensions for 2D Isometric projection
// Optimized ratio for crisp mobile & desktop scaling
export const TILE_WIDTH = 110;
export const TILE_HEIGHT = 55;

// Timings in milliseconds
export const TIMING = {
  STOP_DELAY: 400,        // Time to wait after arriving before door opens
  BOARDING_TIME: 1400,    // How long the door stays open
  DOOR_ANIMATION: 400,    // Time for door to close
  MOVE_TIME: 3500,        // Duration of elevator moving to next floor
  ROTATION_EVENT: 1500,   // When during move phase penguins rotate
  DIZZY_ANIMATION: 450,   // Funny dizzy wobble before the trapdoor opens
  DROP_ANIMATION: 500,    // Time for penguin to fall through trapdoor
  PANIC_DELAY: 2600,      // Time for multi-jump screaming before game over screen
  FISH_DISTRACTION: 3500, // How long penguins stay distracted by fish
};

export const CELL_SIZE = 64; // Fallback