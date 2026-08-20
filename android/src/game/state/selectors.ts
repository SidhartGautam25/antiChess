import { SessionState } from './types';
import { getLegalMoves } from '../../engine/gameEngine';
import { Piece, Player, Position } from '../../types/game';

/** The single rule for "is the player currently allowed to act". Change
 * it once here, and every consumer (reducer, input handler, undo) stays
 * consistent automatically. */
export function canPlayerAct(state: SessionState): boolean {
  return !state.winner && !state.isBotThinking && !state.animatingPieceId;
}

export function selectSelectedPiece(state: SessionState): Piece | null {
  return state.pieces.find((p) => p.id === state.selectedPieceId) || null;
}

export function selectLegalMoves(state: SessionState): Position[] {
  const piece = selectSelectedPiece(state);
  if (!piece || !canPlayerAct(state)) return [];
  return getLegalMoves(piece, state.pieces);
}

export function selectCanUndo(state: SessionState): boolean {
  return state.historyStack.length > 0 && !state.isBotThinking && !state.animatingPieceId;
}

import { PieceType } from '../../types/game';
import { INITIAL_PIECES } from '../../constants/board';

export type CapturedCounts = Record<Player, Partial<Record<PieceType, number>>>;

// Derived from the actual initial setup — never hardcoded, so changing
// board config just works with zero changes here.
function computeStartingCounts(): CapturedCounts {
  const counts: CapturedCounts = { 1: {}, 2: {} };
  for (const piece of INITIAL_PIECES) {
    counts[piece.player][piece.type] = (counts[piece.player][piece.type] || 0) + 1;
  }
  return counts;
}
const STARTING_COUNTS = computeStartingCounts();

export function selectCapturedCounts(pieces: Piece[]): CapturedCounts {
  const remaining: CapturedCounts = { 1: {}, 2: {} };
  for (const piece of pieces) {
    remaining[piece.player][piece.type] = (remaining[piece.player][piece.type] || 0) + 1;
  }

  const captured: CapturedCounts = { 1: {}, 2: {} };
  ([1, 2] as Player[]).forEach((player) => {
    Object.entries(STARTING_COUNTS[player]).forEach(([type, expected]) => {
      const stillOnBoard = remaining[player][type as PieceType] || 0;
      captured[player][type as PieceType] = Math.max(0, (expected as number) - stillOnBoard);
    });
  });
  return captured;
}
