import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Piece, PieceType, Player, Position, GameMode, Move, MoveLogItem } from '../types/game';
import { INITIAL_PIECES } from '../constants/board';
import { getLegalMoves, simulateMove, checkWinCondition } from '../engine/gameEngine';
import { getBotMoveForLevelAsync } from '../engine/aiEngine';

const DEBUG_BOARD_STATE = false; // Set to true to enable detailed board logs in __DEV__

interface GameSessionProps {
  initialMode: GameMode;
  initialLevel: number;
  onSaveMatch: (match: {
    mode: GameMode;
    level?: number;
    winner: Player | 0;
    movesCount: number;
    duration: number;
    moveLog?: MoveLogItem[];
  }) => Promise<any>;
}

interface HistoryStackEntry {
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

export function createInitialState(seed: number): SessionState {
  return {
    pieces: INITIAL_PIECES,
    activePlayer: 1,
    selectedPieceId: null,
    winner: null,
    isBotThinking: false,
    movesCount: 0,
    historyStack: [],
    boardRevision: 0,
    animatingPieceId: null,
    seed,
    moveLog: [],
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'PLAYER_MOVE_COMMITTED': {
      const piece = state.pieces.find((p) => p.id === action.pieceId);
      if (!piece || state.winner || state.isBotThinking || state.animatingPieceId) return state;

      // Revalidate active player
      if (piece.player !== state.activePlayer) {
        console.warn(`[Move Validation Warning] Piece ${action.pieceId} belongs to player ${piece.player} but activePlayer is ${state.activePlayer}`);
        return state;
      }

      // Revalidate legality of the target move
      const legalTargets = getLegalMoves(piece, state.pieces);
      const isTargetLegal = legalTargets.some((t) => t.row === action.to.row && t.col === action.to.col);
      if (!isTargetLegal) {
        console.warn(`[Move Validation Warning] Move for piece ${action.pieceId} to (${action.to.row}, ${action.to.col}) is illegal`);
        return state;
      }

      const historyEntry: HistoryStackEntry = {
        pieces: state.pieces,
        activePlayer: state.activePlayer,
        movesCount: state.movesCount,
        seed: state.seed,
        moveLog: state.moveLog,
      };

      const nextPieces = simulateMove(state.pieces, piece, action.to);
      const capturedPiece = state.pieces.find(
        (p) => p.position.row === action.to.row && p.position.col === action.to.col
      );

      const moveLogItem: MoveLogItem = {
        revision: state.boardRevision + 1,
        pieceId: action.pieceId,
        from: piece.position,
        to: action.to,
        ...(capturedPiece ? { capturedPieceId: capturedPiece.id } : {}),
      };

      return {
        ...state,
        pieces: nextPieces,
        movesCount: state.movesCount + 1,
        selectedPieceId: null,
        animatingPieceId: action.pieceId,
        historyStack: [...state.historyStack, historyEntry],
        boardRevision: state.boardRevision + 1,
        moveLog: [...state.moveLog, moveLogItem],
      };
    }

    case 'BOT_MOVE_COMMITTED': {
      const piece = state.pieces.find((p) => p.id === action.pieceId);
      if (!piece || state.winner || state.animatingPieceId || !state.isBotThinking) return state;

      // Revalidate bot player and activePlayer
      if (piece.player !== 2 || state.activePlayer !== 2) {
        console.warn(`[Bot Move Validation Warning] Expected player 2 for bot but got piece player ${piece.player} and activePlayer ${state.activePlayer}`);
        return state;
      }

      // Revalidate legality of the target move
      const legalTargets = getLegalMoves(piece, state.pieces);
      const isTargetLegal = legalTargets.some((t) => t.row === action.to.row && t.col === action.to.col);
      if (!isTargetLegal) {
        console.warn(`[Bot Move Validation Warning] Bot move for piece ${action.pieceId} to (${action.to.row}, ${action.to.col}) is illegal`);
        return state;
      }

      const historyEntry: HistoryStackEntry = {
        pieces: state.pieces,
        activePlayer: 2,
        movesCount: state.movesCount,
        seed: state.seed,
        moveLog: state.moveLog,
      };

      const nextPieces = simulateMove(state.pieces, piece, action.to);
      const capturedPiece = state.pieces.find(
        (p) => p.position.row === action.to.row && p.position.col === action.to.col
      );

      const moveLogItem: MoveLogItem = {
        revision: state.boardRevision + 1,
        pieceId: action.pieceId,
        from: piece.position,
        to: action.to,
        ...(capturedPiece ? { capturedPieceId: capturedPiece.id } : {}),
      };

      return {
        ...state,
        pieces: nextPieces,
        movesCount: state.movesCount + 1,
        isBotThinking: false,
        animatingPieceId: action.pieceId,
        seed: action.nextSeed,
        historyStack: [...state.historyStack, historyEntry],
        boardRevision: state.boardRevision + 1,
        moveLog: [...state.moveLog, moveLogItem],
      };
    }

    case 'ANIMATION_COMPLETED': {
      if (state.animatingPieceId !== action.pieceId) return state;

      // Check win condition (all opponent pieces captured)
      const gameWinner = checkWinCondition(state.pieces);
      if (gameWinner !== null) {
        return {
          ...state,
          winner: gameWinner,
          animatingPieceId: null,
        };
      }

      // Check 50-move limit
      if (state.movesCount >= 50) {
        const getWeight = (plist: Piece[]) => plist.reduce((acc, p) => {
          if (p.type === PieceType.RIDER) return acc + 3;
          if (p.type === PieceType.JUMPER) return acc + 2;
          return acc + 1;
        }, 0);
        
        const p1Weight = getWeight(state.pieces.filter(p => p.player === 1));
        const p2Weight = getWeight(state.pieces.filter(p => p.player === 2));
        
        let limitWinner: Player | 0;
        if (p1Weight > p2Weight) {
          limitWinner = 1;
        } else if (p2Weight > p1Weight) {
          limitWinner = 2;
        } else {
          limitWinner = 0; // Draw
        }

        return {
          ...state,
          winner: limitWinner,
          animatingPieceId: null,
        };
      }

      // Transition turn
      if (state.activePlayer === 1) {
        if (action.gameMode === 'VS_BOT') {
          return {
            ...state,
            activePlayer: 2,
            isBotThinking: true,
            animatingPieceId: null,
          };
        } else {
          return {
            ...state,
            activePlayer: 2,
            animatingPieceId: null,
          };
        }
      } else {
        return {
          ...state,
          activePlayer: 1,
          animatingPieceId: null,
        };
      }
    }

    case 'UNDO_COMMITTED': {
      if (state.historyStack.length === 0 || state.isBotThinking || state.animatingPieceId) return state;

      if (action.gameMode === 'VS_BOT') {
        if (state.historyStack.length >= 2) {
          const targetState = state.historyStack[state.historyStack.length - 2];
          return {
            ...state,
            pieces: targetState.pieces,
            activePlayer: targetState.activePlayer,
            movesCount: targetState.movesCount,
            seed: targetState.seed,
            moveLog: targetState.moveLog,
            selectedPieceId: null,
            winner: null,
            historyStack: state.historyStack.slice(0, -2),
            boardRevision: state.boardRevision + 1,
            animatingPieceId: null,
            isBotThinking: false,
          };
        } else {
          const targetState = state.historyStack[0];
          return {
            ...state,
            pieces: targetState.pieces,
            activePlayer: targetState.activePlayer,
            movesCount: targetState.movesCount,
            seed: targetState.seed,
            moveLog: targetState.moveLog,
            selectedPieceId: null,
            winner: null,
            historyStack: [],
            boardRevision: state.boardRevision + 1,
            animatingPieceId: null,
            isBotThinking: false,
          };
        }
      } else {
        const targetState = state.historyStack[state.historyStack.length - 1];
        return {
          ...state,
          pieces: targetState.pieces,
          activePlayer: targetState.activePlayer,
          movesCount: targetState.movesCount,
          seed: targetState.seed,
          moveLog: targetState.moveLog,
          selectedPieceId: null,
          winner: null,
          historyStack: state.historyStack.slice(0, -1),
          boardRevision: state.boardRevision + 1,
          animatingPieceId: null,
          isBotThinking: false,
        };
      }
    }

    case 'GAME_RESET':
      return createInitialState(action.seed);

    case 'SET_SELECTED_PIECE':
      return {
        ...state,
        selectedPieceId: action.pieceId,
      };

    case 'BOT_MOVE_FAILED':
      return {
        ...state,
        isBotThinking: false,
      };

    default:
      return state;
  }
}

export function useGameSession({ initialMode, initialLevel, onSaveMatch }: GameSessionProps) {
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [level, setLevel] = useState<number>(initialLevel);

  const [sessionState, dispatch] = useReducer(
    sessionReducer,
    Math.floor(Math.random() * 1000000),
    createInitialState
  );

  const stateRef = useRef(sessionState);
  useEffect(() => {
    stateRef.current = sessionState;
  }, [sessionState]);

  const startTimeRef = useRef<number>(Date.now());
  const botTimeoutRef = useRef<any>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, []);

  // Restart/reset game state
  const restartGame = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    const newSeed = Math.floor(Math.random() * 1000000);
    dispatch({ type: 'GAME_RESET', seed: newSeed });
    startTimeRef.current = Date.now();
  }, []);

  // Update game settings and restart
  const changeSettings = useCallback((newMode: GameMode, newLevel: number) => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    setGameMode(newMode);
    setLevel(newLevel);
    // Restart with new settings
    const newSeed = Math.floor(Math.random() * 1000000);
    dispatch({ type: 'GAME_RESET', seed: newSeed });
    startTimeRef.current = Date.now();
  }, []);

  // Get active piece
  const selectedPiece = sessionState.pieces.find((p) => p.id === sessionState.selectedPieceId) || null;

  // Calculate legal moves for selected piece (disable when bot thinking or piece animating)
  const legalMoves = selectedPiece && !sessionState.isBotThinking && !sessionState.winner && !sessionState.animatingPieceId
    ? getLegalMoves(selectedPiece, sessionState.pieces)
    : [];

  // Development assertions and logging (hook-safe top-level execution)
  useEffect(() => {
    if (!__DEV__) return;
    const positions = new Set<string>();
    sessionState.pieces.forEach((p) => {
      const key = `${p.position.row},${p.position.col}`;
      if (positions.has(key)) {
        console.warn(`Board validation warning: duplicate piece position at ${key}`);
      }
      positions.add(key);

      if (p.position.row < 0 || p.position.row > 7 || p.position.col < 0 || p.position.col > 7) {
        console.warn(`Board validation warning: piece ${p.id} out of bounds at ${p.position.row},${p.position.col}`);
      }
    });

    if (sessionState.selectedPieceId) {
      const found = sessionState.pieces.some((p) => p.id === sessionState.selectedPieceId);
      if (!found) {
        console.warn(`Board validation warning: selectedPieceId ${sessionState.selectedPieceId} does not refer to a live piece`);
      }
    }
  }, [sessionState.pieces, sessionState.selectedPieceId]);

  useEffect(() => {
    if (!__DEV__ || !DEBUG_BOARD_STATE) return;
    console.log('Board State Updated:', {
      boardRevision: sessionState.boardRevision,
      activePlayer: sessionState.activePlayer,
      winner: sessionState.winner,
      piecesCount: sessionState.pieces.length,
      animatingPieceId: sessionState.animatingPieceId,
      isBotThinking: sessionState.isBotThinking,
      pieces: sessionState.pieces.map((p) => [p.id, p.position.row, p.position.col]),
    });
  }, [sessionState.boardRevision]);

  // Core move execution function (just dispatches the move action)
  const executeMove = useCallback((pieceId: string, to: Position) => {
    dispatch({ type: 'PLAYER_MOVE_COMMITTED', pieceId, to });
  }, []);

  // Handle animation completion callback
  const handleAnimationComplete = useCallback((pieceId: string) => {
    dispatch({ type: 'ANIMATION_COMPLETED', pieceId, gameMode });
  }, [gameMode]);

  // Effect to calculate bot move after player's animation has completed
  useEffect(() => {
    if (!sessionState.isBotThinking || sessionState.winner !== null) return;

    const startedRevision = stateRef.current.boardRevision;
    let isActive = true;

    botTimeoutRef.current = setTimeout(() => {
      getBotMoveForLevelAsync(level, stateRef.current.pieces, stateRef.current.seed)
        .then(({ move: botMove, nextSeed }) => {
          if (!isActive) return;

          // Double check that the board revision hasn't changed since we started thinking
          if (stateRef.current.boardRevision !== startedRevision) {
            console.warn('Bot move calculated but discarded due to board revision mismatch.');
            dispatch({ type: 'BOT_MOVE_FAILED' });
            return;
          }

          if (botMove) {
            const botPiece = stateRef.current.pieces.find((p) => p.id === botMove.pieceId);
            if (botPiece) {
              dispatch({
                type: 'BOT_MOVE_COMMITTED',
                pieceId: botMove.pieceId,
                to: botMove.to,
                nextSeed,
              });
            } else {
              dispatch({ type: 'BOT_MOVE_FAILED' });
            }
          } else {
            dispatch({ type: 'BOT_MOVE_FAILED' });
          }
        })
        .catch((err) => {
          console.error('Error during AI execution:', err);
          if (isActive) {
            dispatch({ type: 'BOT_MOVE_FAILED' });
          }
        });
    }, 300); // 300ms reaction delay for bot thinking

    return () => {
      isActive = false;
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [sessionState.isBotThinking, sessionState.winner, level]);

  // Effect to handle match saving asynchronously after winner is declared
  useEffect(() => {
    if (sessionState.winner === null) return;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    onSaveMatch({
      mode: gameMode,
      level: gameMode === 'VS_BOT' ? level : undefined,
      winner: sessionState.winner,
      movesCount: sessionState.movesCount,
      duration: Math.max(1, duration),
      moveLog: sessionState.moveLog,
    });
  }, [sessionState.winner, gameMode, level, onSaveMatch]);

  // Handle board tile clicking
  const handleTileClick = useCallback((row: number, col: number) => {
    const pieces = sessionState.pieces;
    const activePlayer = sessionState.activePlayer;
    const winner = sessionState.winner;
    const isBotThinking = sessionState.isBotThinking;
    const selectedPieceId = sessionState.selectedPieceId;
    const animatingPieceId = sessionState.animatingPieceId;

    if (winner || isBotThinking || animatingPieceId) return;

    // Check if clicked tile is a legal move for selected piece
    const isLegalTarget = legalMoves.some((m) => m.row === row && m.col === col);

    if (selectedPieceId && isLegalTarget) {
      executeMove(selectedPieceId, { row, col });
    } else {
      // Otherwise, see if there is a piece of the active player on the clicked tile
      const clickedPiece = pieces.find(
        (p) => p.position.row === row && p.position.col === col && p.player === activePlayer
      );

      if (clickedPiece) {
        dispatch({ type: 'SET_SELECTED_PIECE', pieceId: clickedPiece.id });
      } else {
        dispatch({ type: 'SET_SELECTED_PIECE', pieceId: null });
      }
    }
  }, [sessionState.selectedPieceId, legalMoves, executeMove, sessionState.pieces, sessionState.activePlayer, sessionState.winner, sessionState.isBotThinking, sessionState.animatingPieceId]);

  // Undo functionality
  const undoMove = useCallback(() => {
    dispatch({ type: 'UNDO_COMMITTED', gameMode });
  }, [gameMode]);

  const setSelectedPieceId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_PIECE', pieceId: id });
  }, []);

  return {
    pieces: sessionState.pieces,
    activePlayer: sessionState.activePlayer,
    selectedPieceId: sessionState.selectedPieceId,
    legalMoves,
    winner: sessionState.winner,
    isBotThinking: sessionState.isBotThinking,
    movesCount: sessionState.movesCount,
    gameMode,
    level,
    canUndo: sessionState.historyStack.length > 0 && !sessionState.isBotThinking && !sessionState.animatingPieceId,
    handleTileClick,
    undoMove,
    restartGame,
    changeSettings,
    setSelectedPieceId,
    boardRevision: sessionState.boardRevision,
    animatingPieceId: sessionState.animatingPieceId,
    onAnimationComplete: handleAnimationComplete,
  };
}
