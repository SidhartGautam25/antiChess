export type Player = 1 | 2; // 1 = Player 1 (Bottom/Human), 2 = Player 2 (Top/Bot or Human)

export enum PieceType {
  SCOUT = 'SCOUT', // Moves EXACTLY N steps
  RIDER = 'RIDER', // Moves UP TO N steps
}

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string; // Unique identifier: 'p1_scout1', 'p1_rider', 'p1_scout2', etc.
  type: PieceType;
  player: Player;
  position: Position;
}

export interface Move {
  pieceId: string;
  from: Position;
  to: Position;
}

export type GameMode = 'VS_BOT' | 'PASS_AND_PLAY';

export type GameStatus = 'SETUP' | 'PLAYING' | 'WON' | 'DRAW';

export interface LevelConfig {
  level: number;
  depth: number;
  blunderRate: number;
  aggressionWeight: number;
  positionWeight: number;
  safetyWeight: number;
  name: string;
}

export interface GameHistoryItem {
  id: string;
  mode: GameMode;
  level?: number;
  winner: Player;
  movesCount: number;
  duration: number; // in seconds
  timestamp: number; // epoch milliseconds
}
