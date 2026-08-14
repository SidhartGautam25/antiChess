# Improvement Plan: Prevent Piece Position Drift After Bot Moves

## Issue Summary

During VS Bot games, especially at higher levels, a player piece can visually jump back to an earlier square after the bot makes a move. When the player clicks that piece, the game still calculates legal moves from the correct current position, not from the square where the piece is drawn.

This means the game engine state is probably correct, but the rendered/animated piece position has drifted away from the authoritative board state.

Observed behavior:

- The bot completes a move.
- One of the human player's pieces appears on a previous or older UI position.
- Clicking the visually misplaced piece still selects the logical piece.
- Legal move highlights are shown from the piece's real position in `pieces`, not from the stale visual location.
- Clicking the square where the piece should actually be also behaves consistently with the logical state.

The key clue is that input and legal moves follow the current `pieces` array, while the displayed piece follows an older animated coordinate.

## Current Relevant Design

The current board has two layers:

- `GameBoard` renders the tile grid from the authoritative `pieces` array.
- `GameBoard` overlays one `AnimatedPiece` per piece.
- Each `AnimatedPiece` owns Reanimated shared values:
  - `x`
  - `y`
  - `prevRow`
  - `prevCol`

The authoritative state lives in `useGameSession`:

- Human moves call `simulateMove(pieces, piece, to)`.
- Bot moves call `getBotMoveForLevel(level, nextPieces)`.
- Bot results are committed with `setPieces(botNextPieces)`.
- Legal moves are always calculated from `selectedPiece` in the current `pieces` array.

This is why the rules and input can remain correct while the UI is wrong.

## Why It Is Happening

The likely cause is a mismatch between React state and native animation state.

`AnimatedPiece` initializes its visual position from `piece.position`, then keeps its own long-lived native shared values:

```ts
const x = useSharedValue(piece.position.col * cellWidth + centeringOffset);
const y = useSharedValue(piece.position.row * cellWidth + centeringOffset);
```

When `piece.position` changes, an effect sends `x` and `y` to the new target using `withTiming`. That works most of the time, but it introduces a second position system:

- React says: this piece is at `{ row, col }`.
- Reanimated says: this piece is currently at `x/y`.

Those systems can diverge when moves happen quickly or when React Native/Reanimated schedules work out of order. Higher AI levels make this easier to trigger because bot thinking is heavier and the UI thread/native animation pipeline is under more pressure.

Important risk points:

1. `AnimatedPiece` is keyed only by `piece.id`, so the component instance and its shared values survive across many moves.
2. `prevRow` and `prevCol` are local refs, not derived from the current committed board snapshot.
3. `x` and `y` can continue holding an older coordinate even after `pieces` has already advanced.
4. A delayed or interrupted `withTiming` can leave the overlay at an old location.
5. The press handler is bound to the current `piece.position`, so touch behavior can be correct even when the rendered overlay is stale.

The engine functions appear pure:

- `simulateMove` returns a new piece list.
- captures remove the target piece.
- the moved piece receives a new `position` object.

So the bug is less likely to be the game engine moving pieces backward. It is more likely the animated overlay failing to resynchronize with the latest committed position.

## Proposed Fix

Make the board state the single source of truth and make animation a derived presentation layer.

The new design should guarantee:

- every rendered piece is placed from the latest committed `piece.position`;
- animation cannot permanently store a conflicting board position;
- any interrupted or stale animation is cancelled before a new one starts;
- after an animation finishes, the final visual coordinate is force-aligned to the authoritative coordinate;
- selection and touch handling target the same square that the visual piece occupies.

## New Rendering Design

### 1. Render Pieces From Authoritative Board Coordinates

Each piece should always derive its target pixel position from:

```ts
piece.position.row
piece.position.col
cellWidth
centeringOffset
```

The rendered style should never depend on an older logical position stored only inside the child component.

### 2. Cancel Previous Animations Before Starting a New One

Before assigning a new `withTiming`, call `cancelAnimation(x)` and `cancelAnimation(y)`.

This prevents a previous animation from completing late and writing an old coordinate after a newer game state has been committed.

### 3. Track a Board Revision

Add a monotonically increasing `boardRevision` or `moveVersion` in `useGameSession`.

Increment it every time `pieces` is committed:

- after a human move;
- after a bot move;
- after undo;
- after reset/settings change.

Pass `boardRevision` to `GameBoard` and `AnimatedPiece`.

This gives the UI a stable way to know, "this is a new committed board snapshot." The animation effect can depend on `boardRevision`, not only row/col/cell size.

### 4. Validate Animation Completion Against the Latest Revision

When an animation finishes, only keep the result if it still belongs to the latest revision. If a newer board state arrived while the animation was running, snap to the latest target.

Conceptually:

```ts
const revisionRef = useRef(boardRevision);

useEffect(() => {
  revisionRef.current = boardRevision;

  const targetX = getTargetX(piece.position);
  const targetY = getTargetY(piece.position);

  cancelAnimation(x);
  cancelAnimation(y);

  x.value = withTiming(targetX, animationConfig, () => {
    if (revisionRef.current === boardRevision) {
      x.value = targetX;
    }
  });

  y.value = withTiming(targetY, animationConfig, () => {
    if (revisionRef.current === boardRevision) {
      y.value = targetY;
    }
  });
}, [boardRevision, piece.position.row, piece.position.col, cellWidth]);
```

The exact callback may need `runOnJS` depending on what is accessed from the worklet, but the design goal is simple: stale animations must not win against newer committed state.

### 5. Separate Piece Shape From Piece Position

A cleaner structure:

- `PieceLayer`
  - receives `pieces`, `cellWidth`, `boardRevision`;
  - maps each piece to an animated position container.
- `PieceView`
  - draws the shape, label, colors, and selection style;
  - does not own board position state.

This reduces the chance that visual styling changes accidentally affect board positioning.

### 6. Align Touch Targets With Logical Tiles

The safest interaction model is:

- tiles handle board-square clicks;
- piece overlays can either:
  - pass touches through to tiles, or
  - call `onTileClick(piece.position.row, piece.position.col)` only after their visual position has been synchronized.

If piece overlays remain pressable, their displayed coordinate must be forced to the same coordinate used by the press handler.

## State Management Design

Move execution should happen through one reducer-like action path instead of several independent `setState` calls.

Current code commits related state separately:

- `setPieces`
- `setMovesCount`
- `setSelectedPieceId`
- `setActivePlayer`
- `setIsBotThinking`
- `setHistoryStack`

React batches many updates, but the game is easier to reason about if the whole turn is represented as one atomic transition.

Recommended session state:

```ts
interface GameSessionState {
  pieces: Piece[];
  activePlayer: Player;
  selectedPieceId: string | null;
  winner: Player | 0 | null;
  isBotThinking: boolean;
  movesCount: number;
  historyStack: HistoryEntry[];
  boardRevision: number;
}
```

All board-changing actions increment `boardRevision`.

Examples:

- `PLAYER_MOVE_COMMITTED`
- `BOT_THINKING_STARTED`
- `BOT_MOVE_COMMITTED`
- `UNDO_COMMITTED`
- `GAME_RESET`

This prevents the UI from seeing a partially updated game transition.

## Why The New Design Prevents The Issue

The fix prevents recurrence by removing the permanent second source of truth.

In the new design:

- the only logical position is `piece.position` in the current session state;
- `boardRevision` identifies the latest committed board snapshot;
- old animations are cancelled before new ones start;
- animation completion snaps to the latest target instead of trusting a stale in-flight movement;
- reset and undo force a fresh visual synchronization;
- touch behavior and visual placement both derive from the same committed piece coordinate.

Even if the bot takes longer at high levels, or a move animation is interrupted, the visual layer cannot restore a previous square because no older animation is allowed to outlive the latest board revision.

## Additional Safeguards

Add development-only board validation:

- no two live pieces may occupy the same square;
- every piece position must be inside the board;
- every `selectedPieceId` must refer to a live piece;
- legal moves should only be calculated for the active player's live pieces;
- after every move, the rendered piece count must equal the live piece count.

Add a lightweight debug log behind a flag:

```ts
console.log({
  boardRevision,
  movedPiece: pieceId,
  from,
  to,
  pieces: pieces.map((p) => [p.id, p.position.row, p.position.col]),
});
```

This will make future reports much easier to diagnose.

## Implementation Order

1. Add `boardRevision` to `useGameSession`.
2. Increment `boardRevision` for every committed board state change.
3. Pass `boardRevision` through `GameBoard` to `AnimatedPiece`.
4. Update `AnimatedPiece` to cancel previous `x/y` animations before starting new ones.
5. Force shared values to the latest target after animation completion.
6. Consider splitting `AnimatedPiece` into a position wrapper and a pure visual `PieceView`.
7. Add development-only assertions for board consistency.
8. Test rapid play at higher bot levels, captures, undo, reset, and device rotation.

## Acceptance Criteria

- After every bot move, all pieces appear on the same squares stored in `pieces`.
- Clicking a visible piece highlights legal moves from that visible square.
- Clicking the tile where the piece logically exists and clicking the piece itself produce the same result.
- No piece visually returns to an older square after bot moves.
- Undo and reset do not leave animated pieces at stale positions.
- Higher AI levels do not increase the chance of visual drift.

## Current Implementation Audit

Status after reviewing the current code:

| Plan Item | Current Status | Notes |
| --- | --- | --- |
| Add `boardRevision` to session state | Done | `useGameSession` now stores `boardRevision` inside `sessionState`. |
| Increment revision on committed board changes | Mostly done | Human moves, bot moves, and undo increment it. Reset/settings replace state and set revision back to `0`, which is acceptable as a fresh session reset. |
| Pass revision through board rendering | Done | `game.tsx` passes `boardRevision` to `GameBoard`, and `GameBoard` passes it to `AnimatedPiece`. |
| Cancel stale animations | Done | `AnimatedPiece` calls `cancelAnimation(x)` and `cancelAnimation(y)` before starting a new movement. |
| Snap to latest target on completion | Mostly done | `x` and `y` are forced to `targetX`/`targetY` when the animation finishes and the revision still matches. |
| Atomic state management | Partially done | Related game state is now grouped into one `sessionState` object, but it still uses `useState` instead of a reducer with explicit actions. This is much better than separate state variables, but not the cleanest final form. |
| Disable input during animation | Done | Legal moves, tile clicks, and undo are disabled while `animatingPieceId` is set. |
| Development board validation | Partially done | Duplicate positions, out-of-bounds positions, and dead selected pieces are checked in `__DEV__`. Legal move validation and active-player validation can still be stronger. |
| Separate position wrapper from visual piece shape | Not done | `AnimatedPiece` still handles both animation/positioning and shape rendering. |
| Manual gameplay testing | Not verified here | TypeScript passes, but I did not run the game on a device/emulator in this audit. |

## Single Source Of Truth Assessment

The game now mostly follows the single source of truth principle for logical state.

Current source of truth:

- `sessionState.pieces` is the authoritative board.
- legal moves are derived from `sessionState.pieces`;
- tile highlighting is derived from `sessionState.pieces`;
- captured counts are derived from `sessionState.pieces`;
- turn state, winner, move count, and history live together in `sessionState`.

Remaining caveat:

- `AnimatedPiece` still owns temporary native visual coordinates in Reanimated shared values (`x` and `y`).

That is normal for animation, but it means the visual layer still has transient positional state. The important improvement is that this transient state is now guarded by `boardRevision`, cancelled before new movement starts, and snapped back to the authoritative target. So the logical game state is single-source-of-truth; the animation layer is now a derived cache rather than an independent board model.

## Determinism Assessment

The rules engine is deterministic:

- `simulateMove` is pure.
- `getLegalMoves` is deterministic.
- `checkWinCondition` is deterministic.
- minimax move selection is deterministic for the same board and level config.

The bot is not fully deterministic on levels 1-9 because `getBotMoveForLevel` uses `Math.random()` for blunder moves. Level 10 has `blunderRate: 0`, so it should be deterministic for a fixed board state.

This randomness is not necessarily bad for gameplay, but it makes bugs harder to reproduce. If we want reliable debugging and replay, bot randomness should use a seeded random generator stored in match/session state.

## Remaining Risks

1. Animation completion can fire twice for one move.

   `AnimatedPiece` starts separate `withTiming` animations for `x` and `y`, and both callbacks call `onAnimationComplete(piece.id)`. The session handler ignores the second callback because `animatingPieceId` has already been cleared, so this is mostly safe. Still, the first axis to finish can advance the turn before the second axis has finished visually.

   Improvement: drive both coordinates from one progress animation, or track completion of both axes and call `onAnimationComplete` once.

2. `AnimatedPiece` still mixes position logic and rendering logic.

   The component calculates animation coordinates, manages revision checks, renders piece shape, reads tile value, and owns press behavior.

   Improvement: split it into:

   - `AnimatedPiecePosition`
   - `PieceView`

   This makes future UI edits less likely to affect movement correctness.

3. Move validation depends mostly on the click handler.

   `handleTileClick` checks `legalMoves` before calling `executeMove`, but `executeMove` itself does not re-check that the target is legal.

   Improvement: validate the move inside `executeMove` too. This protects future code paths, tests, bot integrations, or gesture-based controls from accidentally committing illegal moves.

4. Bot move calculation still runs on the JS thread.

   Higher levels use deeper minimax. The stronger the bot gets, the more likely the UI can feel delayed.

   Improvement: move AI calculation behind an async boundary or worker-style interface where possible, and commit only the final move result if it still matches the latest board revision.

5. Match saving can run as soon as `winner` is set.

   For bot wins or 50-move results, `winner` may be set before the final piece animation visually completes.

   Improvement: save the match after the terminal animation completes, or add `gamePhase: 'playing' | 'animating' | 'complete'` so persistence follows the visible game lifecycle.

6. Dev logging is always active in `__DEV__`.

   Every board revision logs the full piece list in development.

   Improvement: put logs behind a specific debug flag, such as `DEBUG_BOARD_STATE`, so normal development remains quiet.

## Recommended Next Improvements

1. Call animation completion exactly once per move.

   Use a single shared progress value or a small completion coordinator. This removes the remaining race where one axis finishes before the other.

2. Convert `useGameSession` to `useReducer`.

   Keep `sessionState`, but update it through explicit actions like `PLAYER_MOVE_COMMITTED`, `BOT_MOVE_COMMITTED`, `ANIMATION_COMPLETED`, `UNDO_COMMITTED`, and `GAME_RESET`. This makes the turn lifecycle easier to audit and reduces accidental partial transitions.

3. Add seeded randomness for bot blunders.

   Store a seed in the match and replace `Math.random()` with a deterministic RNG. Gameplay can still feel random, but every match becomes reproducible for debugging.

4. Revalidate moves inside `executeMove`.

   Check that the piece belongs to the active player and that the destination is still legal at the moment of execution. This makes the move layer defensive instead of trusting only UI selection.

5. Add unit tests for engine and session transitions.

   Useful tests:

   - `simulateMove` never mutates input;
   - capture removes only the target piece;
   - no duplicate board positions after legal moves;
   - undo restores the exact previous board;
   - bot move commits exactly one revision;
   - selected dead pieces are cleared;
   - 50-move winner logic is stable.

6. Add a lightweight replay/debug record.

   Store each committed move with `{ revision, pieceId, from, to, capturedPieceId, resultingWinner }`. This would make visual bugs easier to reproduce and would also unlock future replay/history features.

## Verification Performed

Static TypeScript verification passes:

```sh
./node_modules/.bin/tsc --noEmit
```

`expo lint` could not be completed in this environment because Expo tried to auto-install missing lint packages while networking was disabled. The interrupted lint attempt was cleaned up and no package changes remain from that check.
