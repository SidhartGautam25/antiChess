import { useState, useEffect, useRef, useCallback } from 'react';
import { Piece, PieceType, Player, Position, GameMode, Move } from '../types/game';
import { INITIAL_PIECES } from '../constants/board';
import { getLegalMoves, simulateMove, checkWinCondition } from '../engine/gameEngine';
import { getBotMoveForLevel } from '../engine/aiEngine';

interface GameSessionProps {
  initialMode: GameMode;
  initialLevel: number;
  onSaveMatch: (match: {
    mode: GameMode;
    level?: number;
    winner: Player | 0;
    movesCount: number;
    duration: number;
  }) => Promise<any>;
}

export function useGameSession({ initialMode, initialLevel, onSaveMatch }: GameSessionProps) {
  const [gameMode, setGameMode] = useState<GameMode>(initialMode);
  const [level, setLevel] = useState<number>(initialLevel);

  const [sessionState, setSessionState] = useState<{
    pieces: Piece[];
    activePlayer: Player;
    selectedPieceId: string | null;
    winner: Player | 0 | null;
    isBotThinking: boolean;
    movesCount: number;
    historyStack: Array<{
      pieces: Piece[];
      activePlayer: Player;
      movesCount: number;
    }>;
    boardRevision: number;
    animatingPieceId: string | null;
  }>({
    pieces: INITIAL_PIECES,
    activePlayer: 1,
    selectedPieceId: null,
    winner: null,
    isBotThinking: false,
    movesCount: 0,
    historyStack: [],
    boardRevision: 0,
    animatingPieceId: null,
  });

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
    setSessionState({
      pieces: INITIAL_PIECES,
      activePlayer: 1,
      selectedPieceId: null,
      winner: null,
      isBotThinking: false,
      movesCount: 0,
      historyStack: [],
      boardRevision: 0,
      animatingPieceId: null,
    });
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
    setSessionState({
      pieces: INITIAL_PIECES,
      activePlayer: 1,
      selectedPieceId: null,
      winner: null,
      isBotThinking: false,
      movesCount: 0,
      historyStack: [],
      boardRevision: 0,
      animatingPieceId: null,
    });
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
    if (!__DEV__) return;
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

  // Core move execution function (just starts animation, does not change active player yet)
  const executeMove = useCallback((pieceId: string, to: Position) => {
    const pieces = sessionState.pieces;
    const activePlayer = sessionState.activePlayer;
    const movesCount = sessionState.movesCount;
    const winner = sessionState.winner;
    const isBotThinking = sessionState.isBotThinking;
    const animatingPieceId = sessionState.animatingPieceId;

    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || winner || isBotThinking || animatingPieceId) return;

    const historyEntry = { pieces, activePlayer, movesCount };
    const nextPieces = simulateMove(pieces, piece, to);
    const nextMovesCount = movesCount + 1;

    setSessionState((prev) => ({
      ...prev,
      pieces: nextPieces,
      movesCount: nextMovesCount,
      selectedPieceId: null,
      animatingPieceId: pieceId, // Start piece animation
      historyStack: [...prev.historyStack, historyEntry],
      boardRevision: prev.boardRevision + 1,
    }));
  }, [sessionState.pieces, sessionState.activePlayer, sessionState.movesCount, sessionState.winner, sessionState.isBotThinking, sessionState.animatingPieceId]);

  // Handle animation completion callback
  const handleAnimationComplete = useCallback((pieceId: string) => {
    setSessionState((prev) => {
      if (prev.animatingPieceId !== pieceId) return prev;

      const gameWinner = checkWinCondition(prev.pieces);
      if (gameWinner !== null) {
        return {
          ...prev,
          winner: gameWinner,
          animatingPieceId: null,
        };
      }

      if (prev.activePlayer === 1) {
        if (gameMode === 'VS_BOT') {
          return {
            ...prev,
            isBotThinking: true,
            animatingPieceId: null,
          };
        } else {
          return {
            ...prev,
            activePlayer: 2,
            animatingPieceId: null,
          };
        }
      }

      if (prev.activePlayer === 2) {
        return {
          ...prev,
          activePlayer: 1,
          animatingPieceId: null,
        };
      }

      return prev;
    });
  }, [gameMode]);

  // Effect to calculate bot move after player's animation has completed
  useEffect(() => {
    if (!sessionState.isBotThinking || sessionState.winner !== null) return;

    botTimeoutRef.current = setTimeout(() => {
      try {
        const botMove = getBotMoveForLevel(level, sessionState.pieces);
        
        if (botMove) {
          const botPiece = sessionState.pieces.find((p) => p.id === botMove.pieceId);
          if (botPiece) {
            const historyEntry = {
              pieces: sessionState.pieces,
              activePlayer: 2 as Player,
              movesCount: sessionState.movesCount,
            };
            const botNextPieces = simulateMove(sessionState.pieces, botPiece, botMove.to);
            const botNextMovesCount = sessionState.movesCount + 1;
            let botWinner: Player | 0 | null = checkWinCondition(botNextPieces);

            // Check for 50-move limit
            if (botWinner === null && botNextMovesCount >= 50) {
              const getWeight = (plist: Piece[]) => plist.reduce((acc, p) => {
                if (p.type === PieceType.RIDER) return acc + 3;
                if (p.type === PieceType.JUMPER) return acc + 2;
                return acc + 1;
              }, 0);
              
              const p1Weight = getWeight(botNextPieces.filter(p => p.player === 1));
              const p2Weight = getWeight(botNextPieces.filter(p => p.player === 2));
              
              if (p1Weight > p2Weight) {
                botWinner = 1;
              } else if (p2Weight > p1Weight) {
                botWinner = 2;
              } else {
                botWinner = 0; // Draw
              }
            }

            setSessionState((prev) => ({
              ...prev,
              pieces: botNextPieces,
              movesCount: botNextMovesCount,
              winner: botWinner,
              isBotThinking: false,
              animatingPieceId: botMove.pieceId, // Start bot piece animation
              activePlayer: 2,
              historyStack: [...prev.historyStack, historyEntry],
              boardRevision: prev.boardRevision + 1,
            }));
          } else {
            setSessionState((prev) => ({ ...prev, isBotThinking: false }));
          }
        } else {
          setSessionState((prev) => ({ ...prev, isBotThinking: false }));
        }
      } catch (err) {
        console.error('Error during AI execution:', err);
        setSessionState((prev) => ({ ...prev, isBotThinking: false }));
      }
    }, 300); // 300ms reaction delay for bot thinking

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [sessionState.isBotThinking, sessionState.pieces, sessionState.movesCount, sessionState.winner, level]);

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
        setSessionState((prev) => ({ ...prev, selectedPieceId: clickedPiece.id }));
      } else {
        setSessionState((prev) => ({ ...prev, selectedPieceId: null }));
      }
    }
  }, [sessionState.selectedPieceId, legalMoves, executeMove, sessionState.pieces, sessionState.activePlayer, sessionState.winner, sessionState.isBotThinking, sessionState.animatingPieceId]);

  // Undo functionality
  const undoMove = useCallback(() => {
    const historyStack = sessionState.historyStack;
    const isBotThinking = sessionState.isBotThinking;
    const animatingPieceId = sessionState.animatingPieceId;

    if (historyStack.length === 0 || isBotThinking || animatingPieceId) return;

    if (gameMode === 'VS_BOT') {
      // In VS_BOT mode, we need to revert BOTH the bot's turn and the player's turn (2 steps)
      // unless there is only 1 move in the history, in which case we revert that 1 step.
      if (historyStack.length >= 2) {
        const targetState = historyStack[historyStack.length - 2];
        setSessionState((prev) => ({
          ...prev,
          pieces: targetState.pieces,
          activePlayer: targetState.activePlayer,
          movesCount: targetState.movesCount,
          selectedPieceId: null,
          winner: null,
          historyStack: prev.historyStack.slice(0, -2),
          boardRevision: prev.boardRevision + 1,
          animatingPieceId: null,
        }));
      } else {
        // Just 1 move in stack (should not happen since bot moves immediately, but fallback)
        const targetState = historyStack[0];
        setSessionState((prev) => ({
          ...prev,
          pieces: targetState.pieces,
          activePlayer: targetState.activePlayer,
          movesCount: targetState.movesCount,
          selectedPieceId: null,
          winner: null,
          historyStack: [],
          boardRevision: prev.boardRevision + 1,
          animatingPieceId: null,
        }));
      }
    } else {
      // Pass & play mode: revert 1 step
      const targetState = historyStack[historyStack.length - 1];
      setSessionState((prev) => ({
        ...prev,
        pieces: targetState.pieces,
        activePlayer: targetState.activePlayer,
        movesCount: targetState.movesCount,
        selectedPieceId: null,
        winner: null,
        historyStack: prev.historyStack.slice(0, -1),
        boardRevision: prev.boardRevision + 1,
        animatingPieceId: null,
      }));
    }
  }, [sessionState.historyStack, gameMode, sessionState.isBotThinking, sessionState.animatingPieceId]);

  const setSelectedPieceId = useCallback((id: string | null) => {
    setSessionState((prev) => ({ ...prev, selectedPieceId: id }));
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
    onAnimationComplete: handleAnimationComplete,
  };
}
