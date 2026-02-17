
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Penguin {
  id: string;
  x: number; // 0-3 (Column)
  y: number; // 0-3 (Row)
  direction: Direction;
  isPanic?: boolean;
  isFalling?: boolean;
  appearanceVariant: number; // 0-3 for slight visual variety
}

export type GamePhase = 'START_MENU' | 'PLAYING' | 'GAME_OVER';

export type ElevatorState = 
  | 'STOPPED'      // At a floor, door closed, waiting to open
  | 'BOARDING'     // Door open, new penguin entering
  | 'CLOSING'      // Door closing
  | 'MOVING';      // Moving between floors

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
}

export interface GridPos {
  x: number;
  y: number;
}
