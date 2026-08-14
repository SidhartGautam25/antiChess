"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateBoard = evaluateBoard;
exports.minimax = minimax;
exports.seedRandom = seedRandom;
exports.getBotMoveForLevel = getBotMoveForLevel;
exports.getBotMoveForLevelAsync = getBotMoveForLevelAsync;
const game_1 = require("../types/game");
const board_1 = require("../constants/board");
const levels_1 = require("../constants/levels");
const gameEngine_1 = require("./gameEngine");
/**
 * Evaluates the board score from Player 2's perspective (maximizing player).
 * Positive values favor Player 2 (AI), negative values favor Player 1 (Human).
 */
function evaluateBoard(pieces, config) {
    const p1Pieces = pieces.filter((p) => p.player === 1);
    const p2Pieces = pieces.filter((p) => p.player === 2);
    // Terminal win checks
    if (p2Pieces.length === 0)
        return -1000000;
    if (p1Pieces.length === 0)
        return 1000000;
    let score = 0;
    const RIDER_VAL = 300;
    const JUMPER_VAL = 200;
    const SCOUT_VAL = 100;
    const getPieceValue = (type) => {
        if (type === game_1.PieceType.RIDER)
            return RIDER_VAL;
        if (type === game_1.PieceType.JUMPER)
            return JUMPER_VAL;
        return SCOUT_VAL;
    };
    // 1. Material & Positional Evaluation for Player 2 (AI)
    for (const piece of p2Pieces) {
        const val = getPieceValue(piece.type);
        score += val;
        // Position weight based on current tile value N
        const tileVal = board_1.FIXED_BOARD[piece.position.row][piece.position.col];
        score += tileVal * config.positionWeight;
        // Centrality: reward pieces for occupying center 2x2 quadrant (rows/cols 3 and 4)
        const rowDist = Math.min(Math.abs(piece.position.row - 3), Math.abs(piece.position.row - 4));
        const colDist = Math.min(Math.abs(piece.position.col - 3), Math.abs(piece.position.col - 4));
        const distToCenter = rowDist + colDist;
        score += (6 - distToCenter) * 4; // Max bonus = 24 (at center), min bonus = 0
    }
    // 2. Material & Positional Evaluation for Player 1 (Human)
    for (const piece of p1Pieces) {
        const val = getPieceValue(piece.type);
        score -= val;
        const tileVal = board_1.FIXED_BOARD[piece.position.row][piece.position.col];
        score -= tileVal * config.positionWeight;
        const rowDist = Math.min(Math.abs(piece.position.row - 3), Math.abs(piece.position.row - 4));
        const colDist = Math.min(Math.abs(piece.position.col - 3), Math.abs(piece.position.col - 4));
        const distToCenter = rowDist + colDist;
        score -= (6 - distToCenter) * 4;
    }
    return score;
}
/**
 * Minimax algorithm with Alpha-Beta pruning.
 * Returns the best score and the corresponding move.
 */
function minimax(pieces, depth, alpha, beta, isMaximizing, config) {
    // Check terminal state
    const winner = (0, gameEngine_1.checkWinCondition)(pieces);
    if (winner === 2) {
        // Player 2 (AI) wins, encourage faster victory path
        return { score: 1000000 + depth, move: null };
    }
    if (winner === 1) {
        // Player 1 wins, delay defeat path
        return { score: -1000000 - depth, move: null };
    }
    if (depth === 0) {
        return { score: evaluateBoard(pieces, config), move: null };
    }
    // Construct boardMap for O(1) piece lookup
    const boardMap = Array(8).fill(null).map(() => Array(8).fill(null));
    for (const p of pieces) {
        boardMap[p.position.row][p.position.col] = p;
    }
    const activePlayer = isMaximizing ? 2 : 1;
    const playerPieces = pieces.filter((p) => p.player === activePlayer);
    // Generate all legal moves for active player
    const moves = [];
    for (const piece of playerPieces) {
        const legalTargets = (0, gameEngine_1.getLegalMoves)(piece, pieces, boardMap);
        for (const target of legalTargets) {
            moves.push({
                pieceId: piece.id,
                from: piece.position,
                to: target,
            });
        }
    }
    if (moves.length === 0) {
        // No legal moves (draw/stalemate position)
        return { score: evaluateBoard(pieces, config), move: null };
    }
    // Move sorting (captures first) to optimize alpha-beta pruning speed
    moves.sort((a, b) => {
        const aIsCapture = boardMap[a.to.row][a.to.col] !== null;
        const bIsCapture = boardMap[b.to.row][b.to.col] !== null;
        if (aIsCapture && !bIsCapture)
            return -1;
        if (!aIsCapture && bIsCapture)
            return 1;
        return 0;
    });
    let bestMove = moves[0] || null; // Initialize to first move to prevent null return if all evaluations equal
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const pieceToMove = boardMap[move.from.row][move.from.col];
            const nextPiecesState = (0, gameEngine_1.simulateMove)(pieces, pieceToMove, move.to);
            const { score: evaluation } = minimax(nextPiecesState, depth - 1, alpha, beta, false, config);
            if (evaluation > maxEval) {
                maxEval = evaluation;
                bestMove = move;
            }
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return { score: maxEval, move: bestMove };
    }
    else {
        let minEval = Infinity;
        for (const move of moves) {
            const pieceToMove = boardMap[move.from.row][move.from.col];
            const nextPiecesState = (0, gameEngine_1.simulateMove)(pieces, pieceToMove, move.to);
            const { score: evaluation } = minimax(nextPiecesState, depth - 1, alpha, beta, true, config);
            if (evaluation < minEval) {
                minEval = evaluation;
                bestMove = move;
            }
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return { score: minEval, move: bestMove };
    }
}
/**
 * A simple seedable LCG (Linear Congruential Generator) PRNG.
 */
function seedRandom(seed) {
    let currentSeed = seed;
    return () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        return currentSeed / 4294967296;
    };
}
/**
 * Returns the bot's chosen move based on active pieces and the selected AI difficulty level.
 * Uses a seedable random generator for deterministic bot blunders.
 */
function getBotMoveForLevel(levelNumber, pieces, seed) {
    const config = levels_1.LEVEL_REGISTRY[levelNumber] || levels_1.LEVEL_REGISTRY[1];
    const rng = seedRandom(seed);
    // Find all legal moves for Player 2 (AI)
    const botPieces = pieces.filter((p) => p.player === 2);
    const allMoves = [];
    for (const piece of botPieces) {
        const targets = (0, gameEngine_1.getLegalMoves)(piece, pieces);
        for (const target of targets) {
            allMoves.push({
                pieceId: piece.id,
                from: piece.position,
                to: target,
            });
        }
    }
    if (allMoves.length === 0) {
        return { move: null, nextSeed: Math.floor(rng() * 1000000) };
    }
    let chosenMove = null;
    // LEVEL BLUNDER LOGIC:
    // Randomly blunder a move on lower levels to simulate human-like skill level
    if (rng() < config.blunderRate) {
        const randomIndex = Math.floor(rng() * allMoves.length);
        chosenMove = allMoves[randomIndex];
    }
    else {
        // Run Minimax search to find the optimal move
        const { move } = minimax(pieces, config.depth, -Infinity, Infinity, true, config);
        chosenMove = move;
    }
    return {
        move: chosenMove,
        nextSeed: Math.floor(rng() * 1000000),
    };
}
/**
 * Async boundary wrapper for the bot's move calculation.
 * Returns a Promise to avoid blocking the main UI thread immediately.
 */
async function getBotMoveForLevelAsync(levelNumber, pieces, seed) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getBotMoveForLevel(levelNumber, pieces, seed));
        }, 0);
    });
}
