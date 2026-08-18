
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';  // Screen-aligned: UP=away (back), DOWN=toward viewer (front), LEFT/RIGHT=screen sides

export type PenguinTypeVariant = 'STANDARD' | 'SLEEPY' | 'VIP' | 'JITTERY';

export interface Penguin {
  id: string;
  x: number; // 0-3 (Column)
  y: number; // 0-3 (Row)
  direction: Direction;
  type: PenguinTypeVariant;
  isPanic?: boolean;
  isFalling?: boolean;
  isDistracted?: boolean; // Looking at fish treat
  distractionDir?: Direction;
  isEntering?: boolean;   // Just boarded - plays waddle-in animation
  isPushed?: boolean;     // Got shoved by a boarding penguin - quick nudge + spin
  isDizzy?: boolean;      // Pre-drop wobble before falling through trapdoor
  appearanceVariant: number; // Visual accessory or color
}

export type GamePhase = 'START_MENU' | 'PLAYING' | 'GAME_OVER';

export type ElevatorState = 
  | 'STOPPED'      // At a floor, door closed, waiting to open
  | 'BOARDING'     // Door open, new penguin entering
  | 'CLOSING'      // Door closing
  | 'MOVING';      // Moving between floors

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface FishTreat {
  x: number;
  y: number;
  active: boolean;
}

export interface GameState {
  phase: GamePhase;
  floor: number;
  score: number;
  highScore: number;
  elevatorState: ElevatorState;
  penguins: Penguin[];
  lastDroppedId: string | null;
  witnessIds: string[]; // IDs of penguins who saw the drop
  gameOverReason?: 'CAUGHT' | 'BANKRUPT';
  combo: number;
  fishTreat: FishTreat | null;
  fishCount: number; // Fish inventory - earn 1 every 10 floors, place on empty tile
  showVisionCones: boolean;
  isMuted: boolean;
  viewMode: 'MOBILE_SIM' | 'FULLSCREEN';
}

export interface GridPos {
  x: number;
  y: number;
}

