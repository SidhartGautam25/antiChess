import { useEffect, useRef, MutableRefObject, Dispatch } from 'react';
import { SessionState, SessionAction } from '../state/types';
import { getBotMoveForLevelAsync } from '../../engine/aiEngine';

const BOT_REACTION_DELAY_MS = 800;

/** Owns everything about "the bot's turn." Change pacing, swap the
 * search implementation, add a "resign" condition — all here, nowhere
 * else. */
export function useBotPlayer(
  sessionState: SessionState,
  dispatch: Dispatch<SessionAction>,
  level: number,
  stateRef: MutableRefObject<SessionState>
) {
  const timeoutRef = useRef<any>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  useEffect(() => {
    if (!sessionState.isBotThinking || sessionState.winner !== null) return;

    const startedRevision = stateRef.current.boardRevision;
    let isActive = true;

    timeoutRef.current = setTimeout(() => {
      getBotMoveForLevelAsync(level, stateRef.current.pieces, stateRef.current.seed)
        .then(({ move: botMove, nextSeed }) => {
          if (!isActive) return;

          if (stateRef.current.boardRevision !== startedRevision) {
            console.warn('[BotPlayer] Move discarded — board revision changed while thinking.');
            dispatch({ type: 'BOT_MOVE_FAILED' });
            return;
          }
          if (!botMove) {
            dispatch({ type: 'BOT_MOVE_FAILED' });
            return;
          }
          const botPiece = stateRef.current.pieces.find((p) => p.id === botMove.pieceId);
          if (!botPiece) {
            dispatch({ type: 'BOT_MOVE_FAILED' });
            return;
          }
          dispatch({ type: 'BOT_MOVE_COMMITTED', pieceId: botMove.pieceId, to: botMove.to, nextSeed });
        })
        .catch((err: any) => {
          console.error('[BotPlayer] Search failed:', err);
          if (isActive) dispatch({ type: 'BOT_MOVE_FAILED' });
        });
    }, BOT_REACTION_DELAY_MS);

    return () => {
      isActive = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionState.isBotThinking, sessionState.winner, level, dispatch, stateRef]);
}
