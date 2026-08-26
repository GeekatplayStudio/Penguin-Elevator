export const APP_VERSION = "v2.0";
export const STUDIO_NAME = "Geekatplay Studio";
export const AUTHOR_NAME = "Vladimir Chopine";
export const COPYRIGHT_NOTICE = "© Geekatplay Studio by Vladimir Chopine";

export const GRID_SIZE = 4;
export const MAX_CAPACITY = GRID_SIZE * GRID_SIZE;

export const SCORE_PER_FLOOR = 1;

// Fixed timings in milliseconds. The boarding and travel durations are NOT
// here - they scale with the floor, and live in getBoardingTime/getMoveTime
// in utils/gameLogic.ts so the HUD countdown and the engine can't disagree.
export const TIMING = {
  STOP_DELAY: 400,        // Time to wait after arriving before door opens
  DOOR_ANIMATION: 400,    // Time for door to close
  DIZZY_ANIMATION: 450,   // Funny dizzy wobble before the trapdoor opens
  DROP_ANIMATION: 500,    // Time for penguin to fall through trapdoor
  PANIC_DELAY: 3900,      // Time for the witness's 6 slow alarm jumps (6 x 0.6s) before game over screen
  FISH_DISTRACTION: 3500, // How long penguins stay distracted by fish
};
