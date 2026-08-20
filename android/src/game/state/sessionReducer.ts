import { Piece, PieceType, Player, Position, MoveLogItem } from '../../types/game';
import { INITIAL_PIECES } from '../../constants/board';
import { getLegalMoves, simulateMove, checkWinCondition } from '../../engine/gameEngine';
import { SessionState, SessionAction, HistoryStackEntry } from './types';

export function createInitialState(seed: number): SessionState {
  return {
    pieces: INITIAL_PIECES,
    activePlayer: 1,
    selectedPieceId: null,
    winner: null,
    winReason: null,
    isBotThinking: false,
    movesCount: 0,
    historyStack: [],
    boardRevision: 0,
    animatingPieceId: null,
    seed,
    moveLog: [],
  };
}

function snapshotHistory(state: SessionState, activePlayer: Player): HistoryStackEntry {
  return {
    pieces: state.pieces,
    activePlayer,
    movesCount: state.movesCount,
    seed: state.seed,
    moveLog: state.moveLog,
  };
}

/** Shared by both player and bot moves — write the rule once. */
function resolveMove(
  state: SessionState,
  pieceId: string,
  to: Position,
  expectedPlayer: Player,
  logLabel: string
): { piece: Piece; nextPieces: Piece[]; capturedPiece: Piece | null } | null {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) {
    console.warn(`[${logLabel}] No piece found with id ${pieceId}`);
    return null;
  }
  if (piece.player !== expectedPlayer || state.activePlayer !== expectedPlayer) {
    console.warn(`[${logLabel}] Player mismatch: piece belongs to ${piece.player}, activePlayer is ${state.activePlayer}`);
    return null;
  }

  const isLegal = getLegalMoves(piece, state.pieces).some((t) => t.row === to.row && t.col === to.col);
  if (!isLegal) {
    console.warn(`[${logLabel}] Illegal move for piece ${pieceId} to (${to.row},${to.col})`);
    return null;
  }

  const capturedPiece = state.pieces.find((p) => p.position.row === to.row && p.position.col === to.col) ?? null;
  return { piece, nextPieces: simulateMove(state.pieces, piece, to), capturedPiece };
}

function buildMoveLogItem(
  state: SessionState,
  pieceId: string,
  player: Player,
  from: Position,
  to: Position,
  capturedPiece: Piece | null
): MoveLogItem {
  return {
    revision: state.boardRevision + 1,
    pieceId,
    player,
    from,
    to,
    ...(capturedPiece ? { capturedPieceId: capturedPiece.id } : {}),
  };
}

function handlePlayerMove(state: SessionState, action: Extract<SessionAction, { type: 'PLAYER_MOVE_COMMITTED' }>): SessionState {
  if (state.winner || state.isBotThinking || state.animatingPieceId) return state;

  const resolved = resolveMove(state, action.pieceId, action.to, 1, 'Player Move');
  if (!resolved) return state;

  const { piece, nextPieces, capturedPiece } = resolved;
  return {
    ...state,
    pieces: nextPieces,
    movesCount: state.movesCount + 1,
    selectedPieceId: null,
    animatingPieceId: action.pieceId,
    historyStack: [...state.historyStack, snapshotHistory(state, state.activePlayer)],
    boardRevision: state.boardRevision + 1,
    moveLog: [...state.moveLog, buildMoveLogItem(state, action.pieceId, piece.player, piece.position, action.to, capturedPiece)],
  };
}

function handleBotMove(state: SessionState, action: Extract<SessionAction, { type: 'BOT_MOVE_COMMITTED' }>): SessionState {
  if (state.winner || state.animatingPieceId || !state.isBotThinking) return state;

  const resolved = resolveMove(state, action.pieceId, action.to, 2, 'Bot Move');
  if (!resolved) return state;

  const { piece, nextPieces, capturedPiece } = resolved;
  return {
    ...state,
    pieces: nextPieces,
    movesCount: state.movesCount + 1,
    isBotThinking: false,
    animatingPieceId: action.pieceId,
    seed: action.nextSeed,
    historyStack: [...state.historyStack, snapshotHistory(state, 2)],
    boardRevision: state.boardRevision + 1,
    moveLog: [...state.moveLog, buildMoveLogItem(state, action.pieceId, piece.player, piece.position, action.to, capturedPiece)],
  };
}

function getPieceWeight(type: PieceType): number {
  if (type === PieceType.INFILTRATOR) return 4;
  if (type === PieceType.RIDER) return 3;
  if (type === PieceType.JUMPER) return 2;
  return 1;
}

const MOVE_LIMIT = 50;

function resolveMoveLimitWinner(pieces: Piece[]): Player | 0 {
  const weight = (player: Player) =>
    pieces.filter((p) => p.player === player).reduce((acc, p) => acc + getPieceWeight(p.type), 0);
  const p1 = weight(1);
  const p2 = weight(2);
  if (p1 > p2) return 1;
  if (p2 > p1) return 2;
  return 0;
}

function handleAnimationCompleted(state: SessionState, action: Extract<SessionAction, { type: 'ANIMATION_COMPLETED' }>): SessionState {
  if (state.animatingPieceId !== action.pieceId) return state;

  const gameWinner = checkWinCondition(state.pieces);
  if (gameWinner !== null) {
    return { ...state, winner: gameWinner, winReason: 'capture', animatingPieceId: null };
  }

  if (state.movesCount >= MOVE_LIMIT) {
    return { ...state, winner: resolveMoveLimitWinner(state.pieces), winReason: 'move_limit', animatingPieceId: null };
  }

  if (state.activePlayer === 1) {
    return action.gameMode === 'VS_BOT'
      ? { ...state, activePlayer: 2, isBotThinking: true, animatingPieceId: null }
      : { ...state, activePlayer: 2, animatingPieceId: null };
  }
  return { ...state, activePlayer: 1, animatingPieceId: null };
}

function handleUndo(state: SessionState, action: Extract<SessionAction, { type: 'UNDO_COMMITTED' }>): SessionState {
  if (state.historyStack.length === 0 || state.isBotThinking || state.animatingPieceId) return state;

  const stepsBack = action.gameMode === 'VS_BOT' && state.historyStack.length >= 2 ? 2 : 1;
  const targetState = state.historyStack[state.historyStack.length - stepsBack];

  return {
    ...state,
    pieces: targetState.pieces,
    activePlayer: targetState.activePlayer,
    movesCount: targetState.movesCount,
    seed: targetState.seed,
    moveLog: targetState.moveLog,
    selectedPieceId: null,
    winner: null,
    winReason: null,
    historyStack: state.historyStack.slice(0, -stepsBack),
    boardRevision: state.boardRevision + 1,
    animatingPieceId: null,
    isBotThinking: false,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'PLAYER_MOVE_COMMITTED': return handlePlayerMove(state, action);
    case 'BOT_MOVE_COMMITTED': return handleBotMove(state, action);
    case 'ANIMATION_COMPLETED': return handleAnimationCompleted(state, action);
    case 'UNDO_COMMITTED': return handleUndo(state, action);
    case 'GAME_RESET': return createInitialState(action.seed);
    case 'SET_SELECTED_PIECE': return { ...state, selectedPieceId: action.pieceId };
    case 'BOT_MOVE_FAILED': return { ...state, isBotThinking: false };
    default: return state;
  }
}
