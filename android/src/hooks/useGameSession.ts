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
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [activePlayer, setActivePlayer] = useState<Player>(1);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [winner, setWinner] = useState<Player | 0 | null>(null);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [movesCount, setMovesCount] = useState<number>(0);
  
  // History of piece configurations for undo functionality
  // Each history entry contains: { pieces, activePlayer, movesCount }
  const [historyStack, setHistoryStack] = useState<Array<{
    pieces: Piece[];
    activePlayer: Player;
    movesCount: number;
  }>>([]);

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
    setPieces(INITIAL_PIECES);
    setActivePlayer(1);
    setSelectedPieceId(null);
    setWinner(null);
    setIsBotThinking(false);
    setMovesCount(0);
    setHistoryStack([]);
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
    setPieces(INITIAL_PIECES);
    setActivePlayer(1);
    setSelectedPieceId(null);
    setWinner(null);
    setIsBotThinking(false);
    setMovesCount(0);
    setHistoryStack([]);
    startTimeRef.current = Date.now();
  }, []);

  // Get active piece
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || null;

  // Calculate legal moves for selected piece
  const legalMoves = selectedPiece && !isBotThinking && !winner
    ? getLegalMoves(selectedPiece, pieces)
    : [];

  // Core move execution function
  const executeMove = useCallback((pieceId: string, to: Position) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece || winner || isBotThinking) return;

    // Save history prior to move
    setHistoryStack((prev) => [...prev, { pieces, activePlayer, movesCount }]);

    const nextPieces = simulateMove(pieces, piece, to);
    const nextMovesCount = movesCount + 1;
    let gameWinner: Player | 0 | null = checkWinCondition(nextPieces);

    setPieces(nextPieces);
    setMovesCount(nextMovesCount);
    setSelectedPieceId(null);

    if (gameWinner !== null) {
      setWinner(gameWinner);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      onSaveMatch({
        mode: gameMode,
        level: gameMode === 'VS_BOT' ? level : undefined,
        winner: gameWinner,
        movesCount: nextMovesCount,
        duration: Math.max(1, duration),
      });
    } else {
      if (gameMode === 'VS_BOT') {
        setActivePlayer(2);
        setIsBotThinking(true);

        botTimeoutRef.current = setTimeout(() => {
          try {
            const botMove = getBotMoveForLevel(level, nextPieces);
            
            if (botMove) {
              // Save history prior to bot's move
              setHistoryStack((prev) => [...prev, { pieces: nextPieces, activePlayer: 2, movesCount: nextMovesCount }]);

              const botPiece = nextPieces.find((p) => p.id === botMove.pieceId);
              if (botPiece) {
                const botNextPieces = simulateMove(nextPieces, botPiece, botMove.to);
                const botNextMovesCount = nextMovesCount + 1;
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

                setPieces(botNextPieces);
                setMovesCount(botNextMovesCount);

                if (botWinner !== null) {
                  setWinner(botWinner);
                  const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                  onSaveMatch({
                    mode: gameMode,
                    level,
                    winner: botWinner,
                    movesCount: botNextMovesCount,
                    duration: Math.max(1, duration),
                  });
                } else {
                  setActivePlayer(1);
                }
              }
            }
          } catch (err) {
            console.error('Error during AI execution:', err);
          } finally {
            setIsBotThinking(false);
          }
        }, 600);
      } else {
        // Toggle player turn (Pass & Play mode)
        setActivePlayer(activePlayer === 1 ? 2 : 1);
      }
    }
  }, [pieces, activePlayer, movesCount, winner, isBotThinking, gameMode, level, onSaveMatch]);

  // Handle board tile clicking
  const handleTileClick = useCallback((row: number, col: number) => {
    if (winner || isBotThinking) return;

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
        setSelectedPieceId(clickedPiece.id);
      } else {
        setSelectedPieceId(null);
      }
    }
  }, [selectedPieceId, legalMoves, executeMove, pieces, activePlayer, winner, isBotThinking]);

  // Undo functionality
  const undoMove = useCallback(() => {
    if (historyStack.length === 0 || isBotThinking) return;

    if (gameMode === 'VS_BOT') {
      // In VS_BOT mode, we need to revert BOTH the bot's turn and the player's turn (2 steps)
      // unless there is only 1 move in the history, in which case we revert that 1 step.
      if (historyStack.length >= 2) {
        const targetState = historyStack[historyStack.length - 2];
        setPieces(targetState.pieces);
        setActivePlayer(targetState.activePlayer);
        setMovesCount(targetState.movesCount);
        setHistoryStack((prev) => prev.slice(0, -2));
      } else {
        // Just 1 move in stack (should not happen since bot moves immediately, but fallback)
        const targetState = historyStack[0];
        setPieces(targetState.pieces);
        setActivePlayer(targetState.activePlayer);
        setMovesCount(targetState.movesCount);
        setHistoryStack([]);
      }
    } else {
      // Pass & play mode: revert 1 step
      const targetState = historyStack[historyStack.length - 1];
      setPieces(targetState.pieces);
      setActivePlayer(targetState.activePlayer);
      setMovesCount(targetState.movesCount);
      setHistoryStack((prev) => prev.slice(0, -1));
    }
    
    // Clear selection on undo
    setSelectedPieceId(null);
    setWinner(null); // Reset winner state in case they undid a victory move
  }, [historyStack, gameMode, isBotThinking]);



  return {
    pieces,
    activePlayer,
    selectedPieceId,
    legalMoves,
    winner,
    isBotThinking,
    movesCount,
    gameMode,
    level,
    canUndo: historyStack.length > 0 && !isBotThinking,
    handleTileClick,
    undoMove,
    restartGame,
    changeSettings,
    setSelectedPieceId,
  };
}
