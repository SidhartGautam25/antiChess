import { Piece, Player, Position, GameMode, MoveLogItem } from '../../types/game';

export interface HistoryStackEntry {
  pieces: Piece[];
  activePlayer: Player;
  movesCount: number;
  seed: number;
  moveLog: MoveLogItem[];
}

export interface SessionState {
  pieces: Piece[];
  activePlayer: Player;
  selectedPieceId: string | null;
  winner: Player | 0 | null;
  winReason: 'capture' | 'move_limit' | null;
  isBotThinking: boolean;
  movesCount: number;
  historyStack: HistoryStackEntry[];
  boardRevision: number;
  animatingPieceId: string | null;
  seed: number;
  moveLog: MoveLogItem[];
}

export type SessionAction =
  | { type: 'PLAYER_MOVE_COMMITTED'; pieceId: string; to: Position }
  | { type: 'BOT_MOVE_COMMITTED'; pieceId: string; to: Position; nextSeed: number }
  | { type: 'ANIMATION_COMPLETED'; pieceId: string; gameMode: GameMode }
  | { type: 'UNDO_COMMITTED'; gameMode: GameMode }
  | { type: 'GAME_RESET'; seed: number }
  | { type: 'SET_SELECTED_PIECE'; pieceId: string | null }
  | { type: 'BOT_MOVE_FAILED' };
