import { useEffect, useRef } from 'react';
import { MoveLogItem } from '../../types/game';
import { playSound } from '../../utils/audio';

/** The ONE place sound gets triggered. Want a "check" or "win" sound
 * later? This is the only file you touch. */
export function useMoveSounds(moveLog: MoveLogItem[]) {
  const lastLengthRef = useRef(moveLog.length);

  useEffect(() => {
    if (moveLog.length > lastLengthRef.current) {
      const lastMove = moveLog[moveLog.length - 1];
      playSound(lastMove.capturedPieceId !== undefined ? 'capture' : 'move');
    }
    lastLengthRef.current = moveLog.length;
  }, [moveLog]);
}
