import { Piece, PieceType, Player, Position, Move, LevelConfig } from '../types/game';
import { FIXED_BOARD } from '../constants/board';
import { LEVEL_REGISTRY } from '../constants/levels';
import {
  getLegalMoves,
  checkWinCondition,
  applyMoveInPlace,
  undoMoveInPlace,
  cloneForSearch,
  buildBoardMap,
} from './gameEngine';

export function evaluateBoard(pieces: Piece[], config: LevelConfig): number {
  const p1Pieces = pieces.filter((p) => p.player === 1);
  const p2Pieces = pieces.filter((p) => p.player === 2);

  if (p2Pieces.length === 0) return -1000000;
  if (p1Pieces.length === 0) return 1000000;

  let score = 0;
  const INFILTRATOR_VAL = 400;
  const RIDER_VAL = 300;
  const JUMPER_VAL = 200;
  const SCOUT_VAL = 100;

  const getPieceValue = (type: PieceType) => {
    if (type === PieceType.INFILTRATOR) return INFILTRATOR_VAL;
    if (type === PieceType.RIDER) return RIDER_VAL;
    if (type === PieceType.JUMPER) return JUMPER_VAL;
    return SCOUT_VAL;
  };

  for (const piece of p2Pieces) {
    score += getPieceValue(piece.type);
    score += FIXED_BOARD[piece.position.row][piece.position.col] * config.positionWeight;
    const rowDist = Math.min(Math.abs(piece.position.row - 3), Math.abs(piece.position.row - 4));
    const colDist = Math.min(Math.abs(piece.position.col - 3), Math.abs(piece.position.col - 4));
    score += (6 - (rowDist + colDist)) * 4;
  }

  for (const piece of p1Pieces) {
    score -= getPieceValue(piece.type);
    score -= FIXED_BOARD[piece.position.row][piece.position.col] * config.positionWeight;
    const rowDist = Math.min(Math.abs(piece.position.row - 3), Math.abs(piece.position.row - 4));
    const colDist = Math.min(Math.abs(piece.position.col - 3), Math.abs(piece.position.col - 4));
    score -= (6 - (rowDist + colDist)) * 4;
  }

  return score;
}

// Module-scoped yield clock — reset at the start of every top-level search.
let lastYieldAt = 0;
const FRAME_BUDGET_MS = 8; // stay well under one 16ms frame

async function maybeYield(): Promise<void> {
  const now = Date.now();
  if (now - lastYieldAt > FRAME_BUDGET_MS) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    lastYieldAt = Date.now();
  }
}

/**
 * Minimax with alpha-beta pruning, using make/unmake (in-place mutation)
 * instead of allocating a new board per node. Periodically yields to the
 * event loop so the JS thread stays responsive, and respects a hard
 * deadline so a single search call can never run away.
 */
export async function minimaxAsync(
  pieces: Piece[],
  boardMap: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  config: LevelConfig,
  deadline: number
): Promise<{ score: number; move: Move | null }> {
  await maybeYield();

  const winner = checkWinCondition(pieces);
  if (winner === 2) return { score: 1000000 + depth, move: null };
  if (winner === 1) return { score: -1000000 - depth, move: null };

  if (depth === 0 || Date.now() > deadline) {
    return { score: evaluateBoard(pieces, config), move: null };
  }

  const activePlayer: Player = isMaximizing ? 2 : 1;
  const playerPieces = pieces.filter((p) => p.player === activePlayer);

  const moves: Move[] = [];
  for (const piece of playerPieces) {
    const legalTargets = getLegalMoves(piece, pieces, boardMap);
    for (const target of legalTargets) {
      moves.push({ pieceId: piece.id, from: piece.position, to: target });
    }
  }

  if (moves.length === 0) {
    return { score: evaluateBoard(pieces, config), move: null };
  }

  moves.sort((a, b) => {
    const aCap = boardMap[a.to.row][a.to.col] !== null;
    const bCap = boardMap[b.to.row][b.to.col] !== null;
    if (aCap && !bCap) return -1;
    if (!aCap && bCap) return 1;
    return 0;
  });

  let bestMove: Move | null = moves[0] || null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const undo = applyMoveInPlace(pieces, boardMap, move);
      const { score: evaluation } = await minimaxAsync(
        pieces, boardMap, depth - 1, alpha, beta, false, config, deadline
      );
      undoMoveInPlace(pieces, boardMap, move, undo);

      if (evaluation > maxEval) { maxEval = evaluation; bestMove = move; }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha || Date.now() > deadline) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const undo = applyMoveInPlace(pieces, boardMap, move);
      const { score: evaluation } = await minimaxAsync(
        pieces, boardMap, depth - 1, alpha, beta, true, config, deadline
      );
      undoMoveInPlace(pieces, boardMap, move, undo);

      if (evaluation < minEval) { minEval = evaluation; bestMove = move; }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha || Date.now() > deadline) break;
    }
    return { score: minEval, move: bestMove };
  }
}

export function seedRandom(seed: number): () => number {
  let currentSeed = seed;
  return () => {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };
}

export async function getBotMoveForLevelAsync(
  levelNumber: number,
  pieces: Piece[],
  seed: number
): Promise<{ move: Move | null; nextSeed: number }> {
  const config = LEVEL_REGISTRY[levelNumber] || LEVEL_REGISTRY[1];
  const rng = seedRandom(seed);

  const botPieces = pieces.filter((p) => p.player === 2);
  const allMoves: Move[] = [];
  for (const piece of botPieces) {
    const targets = getLegalMoves(piece, pieces);
    for (const target of targets) {
      allMoves.push({ pieceId: piece.id, from: piece.position, to: target });
    }
  }

  if (allMoves.length === 0) {
    return { move: null, nextSeed: Math.floor(rng() * 1000000) };
  }

  let chosenMove: Move | null = null;

  if (rng() < config.blunderRate) {
    chosenMove = allMoves[Math.floor(rng() * allMoves.length)];
  } else {
    // Private working copy — the search is free to mutate this without
    // ever touching the real game state.
    const workingPieces = cloneForSearch(pieces);
    const boardMap = buildBoardMap(workingPieces);

    lastYieldAt = Date.now();
    const MAX_THINK_MS = 1400; // hard cap — bot never "thinks" longer than this
    const deadline = Date.now() + MAX_THINK_MS;

    let bestSoFar: Move = allMoves[0];

    // Iterative deepening: search depth 1, 2, 3... capped at config.depth,
    // bailing out the moment the time budget is spent. Always leaves a
    // usable move from the deepest FULLY completed pass, even if a deeper
    // pass gets cut off mid-search.
    for (let d = 1; d <= config.depth; d++) {
      if (Date.now() > deadline) break;
      const { move } = await minimaxAsync(
        workingPieces, boardMap, d, -Infinity, Infinity, true, config, deadline
      );
      if (move) bestSoFar = move;
      await new Promise<void>((resolve) => setTimeout(resolve, 0)); // yield between depths too
    }

    chosenMove = bestSoFar;
  }

  return { move: chosenMove, nextSeed: Math.floor(rng() * 1000000) };
}
