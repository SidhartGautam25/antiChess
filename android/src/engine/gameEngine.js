"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSquare = isValidSquare;
exports.simulateMove = simulateMove;
exports.checkWinCondition = checkWinCondition;
exports.getLegalMoves = getLegalMoves;
const game_1 = require("../types/game");
const board_1 = require("../constants/board");
// Directions: North, South, East, West, North-East, North-West, South-East, South-West
const DIRECTIONS = [
    { r: -1, c: 0 }, // N
    { r: 1, c: 0 }, // S
    { r: 0, c: 1 }, // E
    { r: 0, c: -1 }, // W
    { r: -1, c: 1 }, // NE
    { r: -1, c: -1 }, // NW
    { r: 1, c: 1 }, // SE
    { r: 1, c: -1 }, // SW
];
/**
 * Checks if a row and column are within board bounds.
 */
function isValidSquare(row, col) {
    return row >= 0 && row < board_1.BOARD_SIZE && col >= 0 && col < board_1.BOARD_SIZE;
}
/**
 * Simulates a move and returns a new list of pieces.
 * Pure function: does not mutate the inputs.
 */
function simulateMove(pieces, piece, target) {
    // Filter out any piece currently occupying the target square (capture)
    const afterCapture = pieces.filter((p) => !(p.position.row === target.row && p.position.col === target.col));
    // Update the position of the moved piece
    return afterCapture.map((p) => p.id === piece.id ? { ...p, position: target } : p);
}
/**
 * Checks if a player has won (all opponent pieces captured).
 * Returns the winning Player (1 or 2), or null if the game is still active.
 */
function checkWinCondition(pieces) {
    const p1Count = pieces.filter((p) => p.player === 1).length;
    const p2Count = pieces.filter((p) => p.player === 2).length;
    if (p1Count === 0)
        return 2; // Player 2 wins
    if (p2Count === 0)
        return 1; // Player 1 wins
    return null;
}
/**
 * Calculates legal move destination positions for a given piece.
 */
function getLegalMoves(piece, pieces, boardMap) {
    const legalMoves = [];
    const startRow = piece.position.row;
    const startCol = piece.position.col;
    // N is determined by the number on the current tile of the board
    const N = board_1.FIXED_BOARD[startRow][startCol];
    // O(1) grid lookup if boardMap is provided, otherwise fallback to O(N) array search
    const getPieceAt = (r, c) => {
        if (boardMap) {
            return boardMap[r][c];
        }
        return pieces.find((p) => p.position.row === r && p.position.col === c);
    };
    if (piece.type === game_1.PieceType.SCOUT) {
        // SCOUT (EXACT): Must move EXACTLY N steps
        for (const dir of DIRECTIONS) {
            const targetRow = startRow + dir.r * N;
            const targetCol = startCol + dir.c * N;
            if (!isValidSquare(targetRow, targetCol)) {
                continue;
            }
            // Check intermediate squares for blockage (for N > 1)
            let isBlocked = false;
            for (let step = 1; step < N; step++) {
                const interRow = startRow + dir.r * step;
                const interCol = startCol + dir.c * step;
                const pieceAtInter = getPieceAt(interRow, interCol);
                if (pieceAtInter) {
                    isBlocked = true;
                    break;
                }
            }
            if (isBlocked) {
                continue;
            }
            // Check target square
            const pieceAtTarget = getPieceAt(targetRow, targetCol);
            if (pieceAtTarget) {
                if (pieceAtTarget.player !== piece.player) {
                    // Can capture opponent
                    legalMoves.push({ row: targetRow, col: targetCol });
                }
                // Cannot land on own piece
            }
            else {
                // Can land on empty square
                legalMoves.push({ row: targetRow, col: targetCol });
            }
        }
    }
    else if (piece.type === game_1.PieceType.RIDER) {
        // RIDER (UP_TO): Can move UP TO N steps (1 to N)
        for (const dir of DIRECTIONS) {
            for (let step = 1; step <= N; step++) {
                const targetRow = startRow + dir.r * step;
                const targetCol = startCol + dir.c * step;
                if (!isValidSquare(targetRow, targetCol)) {
                    // Out of board bounds, stop exploring this direction
                    break;
                }
                const pieceAtTarget = getPieceAt(targetRow, targetCol);
                if (!pieceAtTarget) {
                    // Empty square is legal, keep going
                    legalMoves.push({ row: targetRow, col: targetCol });
                }
                else {
                    // Encountered a piece
                    if (pieceAtTarget.player !== piece.player) {
                        // Can capture, but then blocked
                        legalMoves.push({ row: targetRow, col: targetCol });
                    }
                    // Blocked by piece (ally or captured enemy), cannot slide further
                    break;
                }
            }
        }
    }
    else if (piece.type === game_1.PieceType.JUMPER) {
        // JUMPER: Moves EXACTLY N steps in either an L-shape/Knight-path OR straight orthogonally (jumps over intervening pieces; no diagonal path)
        let possibleDisplacements = [];
        if (N === 3) {
            possibleDisplacements = [
                // L-move (2 + 1)
                { dr: 2, dc: 1 }, { dr: 2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -2, dc: -1 },
                { dr: 1, dc: 2 }, { dr: 1, dc: -2 }, { dr: -1, dc: 2 }, { dr: -1, dc: -2 },
                // Straight (3 orthogonal only)
                { dr: 3, dc: 0 }, { dr: -3, dc: 0 }, { dr: 0, dc: 3 }, { dr: 0, dc: -3 }
            ];
        }
        else if (N === 2) {
            possibleDisplacements = [
                // L-move (1 + 1)
                { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 },
                // Straight (2 orthogonal only)
                { dr: 2, dc: 0 }, { dr: -2, dc: 0 }, { dr: 0, dc: 2 }, { dr: 0, dc: -2 }
            ];
        }
        else if (N === 1) {
            possibleDisplacements = [
                // 1-step orthogonal only
                { dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 }
            ];
        }
        for (const offset of possibleDisplacements) {
            const targetRow = startRow + offset.dr;
            const targetCol = startCol + offset.dc;
            if (!isValidSquare(targetRow, targetCol)) {
                continue;
            }
            const pieceAtTarget = getPieceAt(targetRow, targetCol);
            if (pieceAtTarget) {
                if (pieceAtTarget.player !== piece.player) {
                    // Can capture opponent
                    legalMoves.push({ row: targetRow, col: targetCol });
                }
                // Cannot land on own piece
            }
            else {
                // Can land on empty square
                legalMoves.push({ row: targetRow, col: targetCol });
            }
        }
    }
    return legalMoves;
}
