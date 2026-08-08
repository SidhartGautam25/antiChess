import { Piece, PieceType } from '../types/game';

export const FIXED_BOARD = [
  [3, 2, 1, 2, 1, 2, 3],
  [2, 1, 3, 1, 3, 1, 2],
  [1, 3, 2, 3, 2, 3, 1],
  [2, 1, 3, 2, 3, 1, 2],
  [1, 3, 2, 3, 2, 3, 1],
  [2, 1, 3, 1, 3, 1, 2],
  [3, 2, 1, 2, 1, 2, 3],
];

export const BOARD_SIZE = 7;

export const INITIAL_PIECES: Piece[] = [
  // Player 2 (Top, Bot/Red)
  {
    id: 'p2_scout1',
    type: PieceType.SCOUT,
    player: 2,
    position: { row: 0, col: 2 },
  },
  {
    id: 'p2_rider',
    type: PieceType.RIDER,
    player: 2,
    position: { row: 0, col: 3 },
  },
  {
    id: 'p2_scout2',
    type: PieceType.SCOUT,
    player: 2,
    position: { row: 0, col: 4 },
  },
  // Player 1 (Bottom, Human/Blue)
  {
    id: 'p1_scout1',
    type: PieceType.SCOUT,
    player: 1,
    position: { row: 6, col: 2 },
  },
  {
    id: 'p1_rider',
    type: PieceType.RIDER,
    player: 1,
    position: { row: 6, col: 3 },
  },
  {
    id: 'p1_scout2',
    type: PieceType.SCOUT,
    player: 1,
    position: { row: 6, col: 4 },
  },
];
