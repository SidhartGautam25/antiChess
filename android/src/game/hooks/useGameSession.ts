import { useState, useCallback, useReducer } from 'react';
import { Player, Position, GameMode, MoveLogItem } from '../../types/game';
import { sessionReducer, createInitialState } from '../state/sessionReducer';
import { canPlayerAct, selectSelectedPiece, selectLegalMoves, selectCanUndo } from '../state/selectors';
import { useLatestRef } from './useLatestRef';
import { useAnimationWatchdog } from './useAnimationWatchdog';
import { useMoveSounds } from './useMoveSounds';
import { useBotPlayer } from './useBotPlayer';
import { useMatchPersistence } from './useMatchPersistence';
import { useDevBoardValidation } from './useDevBoardValidation';

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

export function useGameSession({ initialMode, initialLevel, onSaveMatch }: GameSessionProps) {
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [level, setLevel] = useState<number>(initialLevel);

  const [sessionState, rawDispatch] = useReducer(
    sessionReducer,
    Math.floor(Math.random() * 1000000),
    createInitialState
  );

  // Dev-only action log
  const dispatch = useCallback((action: Parameters<typeof rawDispatch>[0]) => {
    if (__DEV__) console.log(`[session] ${action.type}`, action);
    rawDispatch(action);
  }, []);

  const stateRef = useLatestRef(sessionState);
  const gameModeRef = useLatestRef(gameMode);

  const legalMoves = selectLegalMoves(sessionState);
  const legalMovesRef = useLatestRef(legalMoves);
  const canUndo = selectCanUndo(sessionState);
  const selectedPiece = selectSelectedPiece(sessionState);

  useAnimationWatchdog(sessionState.animatingPieceId, (pieceId) => {
    dispatch({ type: 'ANIMATION_COMPLETED', pieceId, gameMode: gameModeRef.current });
  });

  useMoveSounds(sessionState.moveLog);
  useBotPlayer(sessionState, dispatch, level, stateRef);
  useDevBoardValidation(sessionState);

  const { resetClock } = useMatchPersistence(
    sessionState.winner, gameMode, level, sessionState.movesCount, sessionState.moveLog, onSaveMatch
  );

  const executeMove = useCallback((pieceId: string, to: Position) => {
    dispatch({ type: 'PLAYER_MOVE_COMMITTED', pieceId, to });
  }, [dispatch]);

  const handleTileClick = useCallback((row: number, col: number) => {
    const state = stateRef.current;
    if (!canPlayerAct(state)) return;

    const isLegalTarget = legalMovesRef.current.some((m) => m.row === row && m.col === col);
    if (state.selectedPieceId && isLegalTarget) {
      executeMove(state.selectedPieceId, { row, col });
    } else {
      const clickedPiece = state.pieces.find(
        (p) => p.position.row === row && p.position.col === col && p.player === state.activePlayer
      );
      dispatch({ type: 'SET_SELECTED_PIECE', pieceId: clickedPiece ? clickedPiece.id : null });
    }
  }, [executeMove, legalMovesRef, stateRef, dispatch]);

  const handleAnimationComplete = useCallback((pieceId: string) => {
    dispatch({ type: 'ANIMATION_COMPLETED', pieceId, gameMode: gameModeRef.current });
  }, [gameModeRef, dispatch]);

  const undoMove = useCallback(() => {
    dispatch({ type: 'UNDO_COMMITTED', gameMode: gameModeRef.current });
  }, [gameModeRef, dispatch]);

  const setSelectedPieceId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_PIECE', pieceId: id });
  }, [dispatch]);

  const restartGame = useCallback(() => {
    dispatch({ type: 'GAME_RESET', seed: Math.floor(Math.random() * 1000000) });
    resetClock();
  }, [dispatch, resetClock]);

  const changeSettings = useCallback((newMode: GameMode, newLevel: number) => {
    setGameMode(newMode);
    setLevel(newLevel);
    dispatch({ type: 'GAME_RESET', seed: Math.floor(Math.random() * 1000000) });
    resetClock();
  }, [dispatch, resetClock]);

  return {
    state: sessionState,
    derived: { legalMoves, canUndo, selectedPiece, gameMode, level },
    actions: {
      handleTileClick,
      handleAnimationComplete,
      undoMove,
      setSelectedPieceId,
      restartGame,
      changeSettings,
    },
  };
}
