import { Piece, PieceType, Player, Position } from '../types/game';
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
export function getLegalMoves(piece: Piece, pieces: Piece[]): Position[] {
  const legalMoves: Position[] = [];
  const startRow = piece.position.row;
  const startCol = piece.position.col;
  
  // N is determined by the number on the current tile of the board
  const N = FIXED_BOARD[startRow][startCol];
  
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
        
        const pieceAtInter = pieces.find(
          (p) => p.position.row === interRow && p.position.col === interCol
        );
        
        if (pieceAtInter) {
          isBlocked = true;
          break;
        }
      }
      
      if (isBlocked) {
        continue;
      }
      
      // Check target square
      const pieceAtTarget = pieces.find(
        (p) => p.position.row === targetRow && p.position.col === targetCol
      );
      
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
        
        const pieceAtTarget = pieces.find(
          (p) => p.position.row === targetRow && p.position.col === targetCol
        );
        
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
  }
  
  return legalMoves;
}
