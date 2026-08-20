import { useEffect, useRef } from 'react';
import { GameMode, Player, MoveLogItem } from '../../types/game';

interface MatchResult {
  mode: GameMode;
  level?: number;
  winner: Player | 0;
  movesCount: number;
  duration: number;
  moveLog?: MoveLogItem[];
}

export function useMatchPersistence(
  winner: Player | 0 | null,
  gameMode: GameMode,
  level: number,
  movesCount: number,
  moveLog: MoveLogItem[],
  onSaveMatch: (match: MatchResult) => Promise<any>
) {
  const startTimeRef = useRef<number>(Date.now());
  const resetClock = () => { startTimeRef.current = Date.now(); };

  useEffect(() => {
    if (winner === null) return;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    onSaveMatch({
      mode: gameMode,
      level: gameMode === 'VS_BOT' ? level : undefined,
      winner,
      movesCount,
      duration: Math.max(1, duration),
      moveLog,
    });
  }, [winner, gameMode, level, movesCount, moveLog, onSaveMatch]);

  return { resetClock };
}
