import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Piece, PieceType, Player } from '../../types/game';
import { COLORS } from '../../constants/colors';
import { FIXED_BOARD } from '../../constants/board';

interface AnimatedPieceProps {
  piece: Piece;
  cellWidth: number;
  isSelected: boolean;
  onTileClick: (row: number, col: number) => void;
  animatingPieceId: string | null;
  onAnimationComplete: (pieceId: string) => void;
}

function toBoardCoords(row: number, col: number, cellWidth: number, centeringOffset: number) {
  return {
    x: col * cellWidth + centeringOffset,
    y: row * cellWidth + centeringOffset,
  };
}

// Soft ease-in-out. Duration (not this curve) is what keeps speed stable.
const MOVE_EASING = Easing.inOut(Easing.cubic);

// 1–2 squares keep the previous pace; extra distance beyond that is cheaper.
const MS_PER_CELL_SHORT = 520;
const MS_PER_CELL_LONG = 240;
const SHORT_DISTANCE = 2;

function getMoveDuration(fromRow: number, fromCol: number, toRow: number, toCol: number) {
  const dist = Math.hypot(toRow - fromRow, toCol - fromCol);
  if (dist === 0) return 0;
  if (dist <= SHORT_DISTANCE) {
    return dist * MS_PER_CELL_SHORT;
  }
  return SHORT_DISTANCE * MS_PER_CELL_SHORT + (dist - SHORT_DISTANCE) * MS_PER_CELL_LONG;
}

function AnimatedPiece({
  piece,
  cellWidth,
  isSelected,
  onTileClick,
  animatingPieceId,
  onAnimationComplete,
}: AnimatedPieceProps) {
  const isJumper = piece.type === PieceType.JUMPER;
  const tileInnerWidth = cellWidth > 3 ? cellWidth - 3 : 0;
  let pieceSize = tileInnerWidth * 0.80;
  if (isJumper) pieceSize = tileInnerWidth * 0.74;
  const centeringOffset = 2 + (cellWidth - pieceSize) / 2;

  const prevRow = React.useRef(piece.position.row);
  const prevCol = React.useRef(piece.position.col);
  const moveGen = React.useRef(0);
  const isMoveInFlight = React.useRef(false);

  const onTileClickRef = React.useRef(onTileClick);
  onTileClickRef.current = onTileClick;
  const onAnimationCompleteRef = React.useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  const handlePress = React.useCallback(() => {
    onTileClickRef.current(piece.position.row, piece.position.col);
  }, [piece.position.row, piece.position.col]);

  const notifyComplete = React.useCallback((pieceId: string, gen: number) => {
    if (gen !== moveGen.current) return;
    isMoveInFlight.current = false;
    onAnimationCompleteRef.current(pieceId);
  }, []);

  const initial = toBoardCoords(piece.position.row, piece.position.col, cellWidth, centeringOffset);
  const translateX = useSharedValue(initial.x);
  const translateY = useSharedValue(initial.y);

  const [displayPos, setDisplayPos] = React.useState({
    row: piece.position.row,
    col: piece.position.col,
  });

  // One effect owns visual position. Callback identity and parent re-renders
  // must not restart or cancel an in-flight slide.
  useEffect(() => {
    const row = piece.position.row;
    const col = piece.position.col;
    const { x, y } = toBoardCoords(row, col, cellWidth, centeringOffset);
    const moved = prevRow.current !== row || prevCol.current !== col;
    const thisPieceIsMover = animatingPieceId === piece.id;

    if (moved && thisPieceIsMover) {
      const duration = getMoveDuration(prevRow.current, prevCol.current, row, col);
      prevRow.current = row;
      prevCol.current = col;
      setDisplayPos({ row, col });

      const gen = ++moveGen.current;
      isMoveInFlight.current = true;
      const timing = { duration, easing: MOVE_EASING };

      translateX.value = withTiming(x, timing);
      translateY.value = withTiming(y, timing, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(notifyComplete)(piece.id, gen);
        }
      });
      return;
    }

    prevRow.current = row;
    prevCol.current = col;

    // Layout / undo / other-piece updates: never interrupt a live slide.
    if (thisPieceIsMover || isMoveInFlight.current) {
      return;
    }

    translateX.value = x;
    translateY.value = y;
    setDisplayPos({ row, col });
  }, [
    piece.position.row,
    piece.position.col,
    cellWidth,
    centeringOffset,
    animatingPieceId,
    piece.id,
    notifyComplete,
    translateX,
    translateY,
  ]);

  const isAnimating = piece.id === animatingPieceId;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      collapsable={false}
      style={[
        styles.animatedContainer,
        {
          width: pieceSize,
          height: pieceSize,
          zIndex: isAnimating ? 999 : 50,
          elevation: isAnimating ? 99 : 5,
        },
        animatedStyle,
      ]}
    >
      <PieceView
        type={piece.type}
        player={piece.player}
        cellWidth={cellWidth}
        pieceSize={pieceSize}
        isSelected={isSelected}
        onPress={handlePress}
        row={displayPos.row}
        col={displayPos.col}
      />
    </Animated.View>
  );
}

interface PieceViewProps {
  type: PieceType;
  player: Player;
  cellWidth: number;
  pieceSize: number;
  isSelected: boolean;
  onPress: () => void;
  row: number;
  col: number;
}

export function PieceView({
  type,
  player,
  cellWidth,
  pieceSize,
  isSelected,
  onPress,
  row,
  col,
}: PieceViewProps) {
  const isScout = type === PieceType.SCOUT;
  const isRider = type === PieceType.RIDER;
  const isJumper = type === PieceType.JUMPER;
  const isInfiltrator = type === PieceType.INFILTRATOR;

  const isPlayer1 = player === 1;
  const playerColors = isPlayer1 ? COLORS.player1 : COLORS.player2;

  const gotiShapeStyle = isScout
    ? {
        borderRadius: 8,
      }
    : isInfiltrator
    ? {
        borderRadius: pieceSize / 2,
        borderStyle: 'dashed' as const,
        borderWidth: 3.5,
      }
    : {
        borderRadius: pieceSize / 2,
      };

  const innerRingStyle = isScout
    ? {
        borderRadius: 5,
      }
    : isInfiltrator
    ? {
        borderRadius: (pieceSize * 0.70) / 2,
        borderStyle: 'dashed' as const,
        borderWidth: 1.5,
      }
    : {
        borderRadius: (pieceSize * 0.70) / 2,
      };

  const labelColor = isPlayer1 ? '#1F2937' : '#FFFFFF';
  const tileValue = FIXED_BOARD[row][col];

  if (isJumper) {
    return (
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        android_ripple={{ color: playerColors.primary + '33', borderless: true }}
      >
        <View style={{ width: pieceSize, height: pieceSize, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={[
              styles.goti,
              {
                position: 'absolute',
                width: pieceSize,
                height: pieceSize,
                borderColor: isSelected ? COLORS.selected : playerColors.primary,
                backgroundColor: playerColors.secondary,
                borderRadius: pieceSize * 0.20,
              }
            ]}
          />
          <View
            style={[
              styles.goti,
              {
                position: 'absolute',
                width: pieceSize,
                height: pieceSize,
                borderColor: isSelected ? COLORS.selected : playerColors.primary,
                backgroundColor: playerColors.secondary,
                borderRadius: pieceSize * 0.20,
                transform: [{ rotate: '45deg' }],
              }
            ]}
          />
          <View
            style={[
              styles.innerRing,
              {
                position: 'absolute',
                borderRadius: (pieceSize * 0.70) / 2,
                borderColor: playerColors.primary + '40',
                backgroundColor: playerColors.secondary,
                width: pieceSize * 0.70,
                height: pieceSize * 0.70,
                zIndex: 10,
              }
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: labelColor,
                  fontSize: cellWidth * 0.32,
                }
              ]}
            >
              {tileValue}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.pressable}
      onPress={onPress}
      android_ripple={{ color: playerColors.primary + '33', borderless: true }}
    >
      <View
        style={[
          styles.goti,
          gotiShapeStyle,
          {
            borderColor: isSelected ? COLORS.selected : playerColors.primary,
            backgroundColor: playerColors.secondary,
            width: pieceSize,
            height: pieceSize,
          }
        ]}
      >
        <View
          style={[
            styles.innerRing,
            innerRingStyle,
            {
              borderColor: playerColors.primary + '40',
              width: pieceSize * 0.70,
              height: pieceSize * 0.70,
            }
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: labelColor,
                fontSize: cellWidth * 0.32,
              }
            ]}
          >
            {tileValue}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 50,
    elevation: 50,
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goti: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    borderWidth: 1.5,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'serif' },
    }),
  },
});

// Custom comparator: only re-render a piece if ITS OWN data changed, or if
// the animatingPieceId transition actually concerns this specific piece
// (it just started or just stopped animating). Otherwise ignore
// animatingPieceId changes entirely — a piece that has nothing to do with
// the current move shouldn't re-render just because SOME piece moved.
function arePiecePropsEqual(prev: AnimatedPieceProps, next: AnimatedPieceProps): boolean {
  if (prev.piece !== next.piece) return false;
  if (prev.cellWidth !== next.cellWidth) return false;
  if (prev.isSelected !== next.isSelected) return false;

  const pieceId = next.piece.id;
  const wasRelevant = prev.animatingPieceId === pieceId;
  const isRelevant = next.animatingPieceId === pieceId;
  return wasRelevant === isRelevant;
}

export default React.memo(AnimatedPiece, arePiecePropsEqual);
