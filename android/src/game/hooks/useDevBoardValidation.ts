import { useEffect } from 'react';
import { SessionState } from '../state/types';

export function useDevBoardValidation(state: SessionState) {
  useEffect(() => {
    if (!__DEV__) return;
    const positions = new Set<string>();
    state.pieces.forEach((p) => {
      const key = `${p.position.row},${p.position.col}`;
      if (positions.has(key)) console.warn(`Board validation warning: duplicate piece position at ${key}`);
      positions.add(key);
      if (p.position.row < 0 || p.position.row > 7 || p.position.col < 0 || p.position.col > 7) {
        console.warn(`Board validation warning: piece ${p.id} out of bounds at ${p.position.row},${p.position.col}`);
      }
    });
    if (state.selectedPieceId && !state.pieces.some((p) => p.id === state.selectedPieceId)) {
      console.warn(`Board validation warning: selectedPieceId ${state.selectedPieceId} does not refer to a live piece`);
    }
  }, [state.pieces, state.selectedPieceId]);
}
