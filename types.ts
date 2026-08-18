
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';  // 4 Isometric Directions: UP=NorthWest, DOWN=SouthEast, LEFT=SouthWest, RIGHT=NorthEast

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
  fishCooldownRemaining: number; // in seconds or percentage
  showVisionCones: boolean;
  isMuted: boolean;
  viewMode: 'MOBILE_SIM' | 'FULLSCREEN';
}

export interface GridPos {
  x: number;
  y: number;
}

