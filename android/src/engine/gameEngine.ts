import { Piece, PieceType, Player, Position, Move } from '../types/game';
import { FIXED_BOARD, BOARD_SIZE } from '../constants/board';

// Directions: North, South, East, West, North-East, North-West, South-East, South-West
const DIRECTIONS = [
  { r: -1, c: 0 },  // N
  { r: 1, c: 0 },   // S
  { r: 0, c: 1 },   // E
  { r: 0, c: -1 },  // W
  { r: -1, c: 1 },  // NE
  { r: -1, c: -1 }, // NW
  { r: 1, c: 1 },   // SE
  { r: 1, c: -1 },  // SW
];

/**
 * Checks if a row and column are within board bounds.
 */
export function isValidSquare(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Simulates a move and returns a new list of pieces.
 * Pure function: does not mutate the inputs.
 */
export function simulateMove(pieces: Piece[], piece: Piece, target: Position): Piece[] {
  // Filter out any piece currently occupying the target square (capture)
  const afterCapture = pieces.filter(
    (p) => !(p.position.row === target.row && p.position.col === target.col)
  );
  
  // Update the position of the moved piece
  return afterCapture.map((p) =>
    p.id === piece.id ? { ...p, position: target } : p
  );
}

/**
 * Checks if a player has won (all opponent pieces captured).
 * Returns the winning Player (1 or 2), or null if the game is still active.
 */
export function checkWinCondition(pieces: Piece[]): Player | null {
  const p1Count = pieces.filter((p) => p.player === 1).length;
  const p2Count = pieces.filter((p) => p.player === 2).length;
  
  if (p1Count === 0) return 2; // Player 2 wins
  if (p2Count === 0) return 1; // Player 1 wins
  return null;
}

/**
 * Calculates legal move destination positions for a given piece.
 */
export function getLegalMoves(piece: Piece, pieces: Piece[], boardMap?: (Piece | null)[][]): Position[] {
  const legalMoves: Position[] = [];
  const startRow = piece.position.row;
  const startCol = piece.position.col;
  
  // N is determined by the number on the current tile of the board
  const N = FIXED_BOARD[startRow][startCol];

  // O(1) grid lookup if boardMap is provided, otherwise fallback to O(N) array search
  const getPieceAt = (r: number, c: number) => {
    if (boardMap) {
      return boardMap[r][c];
    }
    return pieces.find((p) => p.position.row === r && p.position.col === c);
  };
  
  if (piece.type === PieceType.SCOUT) {
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
      } else {
        // Can land on empty square
        legalMoves.push({ row: targetRow, col: targetCol });
      }
    }
  } else if (piece.type === PieceType.RIDER) {
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
        } else {
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
  } else if (piece.type === PieceType.JUMPER) {
    // JUMPER: Moves EXACTLY N steps in either an L-shape/Knight-path OR straight orthogonally (jumps over intervening pieces; no diagonal path)
    let possibleDisplacements: { dr: number; dc: number }[] = [];
    if (N === 3) {
      possibleDisplacements = [
        // L-move (2 + 1)
        { dr: 2, dc: 1 }, { dr: 2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -2, dc: -1 },
        { dr: 1, dc: 2 }, { dr: 1, dc: -2 }, { dr: -1, dc: 2 }, { dr: -1, dc: -2 },
        // Straight (3 orthogonal only)
        { dr: 3, dc: 0 }, { dr: -3, dc: 0 }, { dr: 0, dc: 3 }, { dr: 0, dc: -3 }
      ];
    } else if (N === 2) {
      possibleDisplacements = [
        // L-move (1 + 1)
        { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 },
        // Straight (2 orthogonal only)
        { dr: 2, dc: 0 }, { dr: -2, dc: 0 }, { dr: 0, dc: 2 }, { dr: 0, dc: -2 }
      ];
    } else if (N === 1) {
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
      } else {
        // Can land on empty square
        legalMoves.push({ row: targetRow, col: targetCol });
      }
    }
  }
  
  return legalMoves;
}

/**
 * Undo record for an in-place move — lets the AI search "unmake" a move
 * without allocating a new board/piece array. This is the make/unmake
 * pattern real chess engines use to keep search fast and GC-light.
 */
export interface UndoRecord {
  prevPosition: Position;
  capturedPiece: Piece | null;
}

/**
 * Mutates `pieces` and `boardMap` in place to apply a move.
 * Returns an UndoRecord so the move can be precisely reversed.
 * NEVER call this on the live React-state pieces array — only on a
 * private working copy created via cloneForSearch().
 */
export function applyMoveInPlace(
  pieces: Piece[],
  boardMap: (Piece | null)[][],
  move: Move
): UndoRecord {
  const piece = boardMap[move.from.row][move.from.col];
  if (!piece) {
    throw new Error(`applyMoveInPlace: no piece at (${move.from.row},${move.from.col})`);
  }

  const capturedPiece = boardMap[move.to.row][move.to.col];
  if (capturedPiece) {
    const idx = pieces.indexOf(capturedPiece);
    if (idx !== -1) pieces.splice(idx, 1);
  }

  const prevPosition = piece.position;
  boardMap[move.from.row][move.from.col] = null;
  boardMap[move.to.row][move.to.col] = piece;
  piece.position = move.to;

  return { prevPosition, capturedPiece: capturedPiece ?? null };
}

/** Reverses applyMoveInPlace exactly. */
export function undoMoveInPlace(
  pieces: Piece[],
  boardMap: (Piece | null)[][],
  move: Move,
  undo: UndoRecord
): void {
  const piece = boardMap[move.to.row][move.to.col];
  if (!piece) {
    throw new Error(`undoMoveInPlace: no piece at (${move.to.row},${move.to.col})`);
  }

  boardMap[move.to.row][move.to.col] = undo.capturedPiece;
  boardMap[move.from.row][move.from.col] = piece;
  piece.position = undo.prevPosition;

  if (undo.capturedPiece) {
    pieces.push(undo.capturedPiece);
  }
}

/**
 * Deep-clones pieces into a private array the search can freely mutate,
 * fully decoupled from React state. Call this ONCE per top-level bot
 * move — not per search node.
 */
export function cloneForSearch(pieces: Piece[]): Piece[] {
  return pieces.map((p) => ({ ...p, position: { ...p.position } }));
}

export function buildBoardMap(pieces: Piece[]): (Piece | null)[][] {
  const boardMap: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  for (const p of pieces) boardMap[p.position.row][p.position.col] = p;
  return boardMap;
}
