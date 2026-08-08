import { Piece, PieceType } from '../types/game';

export const FIXED_BOARD = [
  [3, 2, 1, 3, 3, 1, 2, 3],
  [2, 1, 3, 2, 2, 3, 1, 2],
  [1, 3, 2, 1, 1, 2, 3, 1],
  [3, 2, 1, 3, 3, 1, 2, 3],
  [3, 2, 1, 3, 3, 1, 2, 3],
  [1, 3, 2, 1, 1, 2, 3, 1],
  [2, 1, 3, 2, 2, 3, 1, 2],
  [3, 2, 1, 3, 3, 1, 2, 3],
];

export const BOARD_SIZE = 8;

export const INITIAL_PIECES: Piece[] = [
  // Player 2 (Top, Ebony/Silver)
  {
    id: 'p2_scout1',
    type: PieceType.SCOUT,
    player: 2,
    position: { row: 0, col: 1 },
  },
  {
    id: 'p2_jumper1',
    type: PieceType.JUMPER,
    player: 2,
    position: { row: 0, col: 2 },
  },
  {
    id: 'p2_rider1',
    type: PieceType.RIDER,
    player: 2,
    position: { row: 0, col: 3 },
  },
  {
    id: 'p2_rider2',
    type: PieceType.RIDER,
    player: 2,
    position: { row: 0, col: 4 },
  },
  {
    id: 'p2_jumper2',
    type: PieceType.JUMPER,
    player: 2,
    position: { row: 0, col: 5 },
  },
  {
    id: 'p2_scout2',
    type: PieceType.SCOUT,
    player: 2,
    position: { row: 0, col: 6 },
  },
  // Player 1 (Bottom, Ivory/Gold)
  {
    id: 'p1_scout1',
    type: PieceType.SCOUT,
    player: 1,
    position: { row: 7, col: 1 },
  },
  {
    id: 'p1_jumper1',
    type: PieceType.JUMPER,
    player: 1,
    position: { row: 7, col: 2 },
  },
  {
    id: 'p1_rider1',
    type: PieceType.RIDER,
    player: 1,
    position: { row: 7, col: 3 },
  },
  {
    id: 'p1_rider2',
    type: PieceType.RIDER,
    player: 1,
    position: { row: 7, col: 4 },
  },
  {
    id: 'p1_jumper2',
    type: PieceType.JUMPER,
    player: 1,
    position: { row: 7, col: 5 },
  },
  {
    id: 'p1_scout2',
    type: PieceType.SCOUT,
    player: 1,
    position: { row: 7, col: 6 },
  },
];
