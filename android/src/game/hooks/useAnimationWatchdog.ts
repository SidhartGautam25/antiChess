import { useEffect, useRef } from 'react';

// NOTE: The default timeout of 2500ms must be kept safely higher than the worst-case
// duration returned by getMoveDuration in AnimatedPiece.tsx (currently ~1578ms max).
export function useAnimationWatchdog(
  animatingPieceId: string | null,
  onStuck: (pieceId: string) => void,
  timeoutMs: number = 2500
) {
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!animatingPieceId) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      console.warn('[Watchdog] animatingPieceId stuck, force-clearing:', animatingPieceId);
      onStuck(animatingPieceId);
    }, timeoutMs);
    return () => clearTimeout(timeoutRef.current);
  }, [animatingPieceId, onStuck, timeoutMs]);
}
