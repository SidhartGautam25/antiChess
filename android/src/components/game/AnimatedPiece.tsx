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
  onPress: () => void;
  animatingPieceId: string | null;
  onAnimationComplete: (pieceId: string) => void;
}

function toBoardCoords(row: number, col: number, cellWidth: number, centeringOffset: number) {
  return {
    x: col * cellWidth + centeringOffset,
    y: row * cellWidth + centeringOffset,
  };
}

// Smooth ease-out curve for natural chess piece sliding motion.
const MOVE_EASING = Easing.out(Easing.quad);

function getMoveDuration(fromRow: number, fromCol: number, toRow: number, toCol: number) {
  const cellDistance = Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol));
  if (cellDistance === 0) {
    return 0;
  }

  // Snappy but distance-aware duration: 280ms base + 35ms per tile, max 450ms.
  return Math.min(450, 280 + cellDistance * 35);
}

export default function AnimatedPiece({
  piece,
  cellWidth,
  isSelected,
  onPress,
  animatingPieceId,
  onAnimationComplete,
}: AnimatedPieceProps) {
  const isJumper = piece.type === PieceType.JUMPER;

  const tileInnerWidth = cellWidth > 3 ? cellWidth - 3 : 0;

  let pieceSize = tileInnerWidth * 0.80;
  if (isJumper) {
    pieceSize = tileInnerWidth * 0.74;
  }

  const centeringOffset = 2 + (cellWidth - pieceSize) / 2;

  const prevRow = React.useRef(piece.position.row);
  const prevCol = React.useRef(piece.position.col);
  const prevCellWidth = React.useRef(cellWidth);
  const prevCenteringOffset = React.useRef(centeringOffset);

  const initialCoords = toBoardCoords(
    piece.position.row,
    piece.position.col,
    cellWidth,
    centeringOffset
  );

  const translateX = useSharedValue(initialCoords.x);
  const translateY = useSharedValue(initialCoords.y);

  const [displayPos, setDisplayPos] = React.useState({
    row: piece.position.row,
    col: piece.position.col,
  });

  const handleAnimationFinished = React.useCallback(
    (pieceId: string) => {
      onAnimationComplete(pieceId);
    },
    [onAnimationComplete]
  );

  const snapToLogicalPosition = React.useCallback(
    (row: number, col: number) => {
      const { x, y } = toBoardCoords(row, col, cellWidth, centeringOffset);
      // Do not call cancelAnimation here — cancelling a finished withTiming can revert
      // translateX/Y back to the animation's start value (the previous square).
      translateX.value = x;
      translateY.value = y;
      setDisplayPos({ row, col });
    },
    [cellWidth, centeringOffset, translateX, translateY]
  );

  // Keep every non-animating piece locked to its logical board position.
  // When the bot starts moving, this prevents other pieces from drifting visually.
  useEffect(() => {
    if (animatingPieceId === piece.id) {
      return;
    }

    snapToLogicalPosition(piece.position.row, piece.position.col);
  }, [
    animatingPieceId,
    piece.id,
    piece.position.row,
    piece.position.col,
    snapToLogicalPosition,
  ]);

  // Animate only the piece that actually moved; snap instantly on undo/reset.
  useEffect(() => {
    const { x, y } = toBoardCoords(
      piece.position.row,
      piece.position.col,
      cellWidth,
      centeringOffset
    );

    const positionChanged =
      prevRow.current !== piece.position.row || prevCol.current !== piece.position.col;
    const layoutChanged =
      prevCellWidth.current !== cellWidth || prevCenteringOffset.current !== centeringOffset;

    if (!positionChanged && !layoutChanged) {
      return;
    }

    if (positionChanged && animatingPieceId === piece.id) {
      const fromRow = prevRow.current;
      const fromCol = prevCol.current;
      const targetRow = piece.position.row;
      const targetCol = piece.position.col;
      const duration = getMoveDuration(fromRow, fromCol, targetRow, targetCol);
      const timingConfig = { duration, easing: MOVE_EASING };

      // Update tile number immediately so it moves with the piece, not after arrival.
      setDisplayPos({ row: targetRow, col: targetCol });

      translateX.value = withTiming(x, timingConfig, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(handleAnimationFinished)(piece.id);
        }
      });
      translateY.value = withTiming(y, timingConfig);
    } else {
      snapToLogicalPosition(piece.position.row, piece.position.col);
    }

    prevRow.current = piece.position.row;
    prevCol.current = piece.position.col;
    prevCellWidth.current = cellWidth;
    prevCenteringOffset.current = centeringOffset;
  }, [
    piece.position.row,
    piece.position.col,
    cellWidth,
    centeringOffset,
    animatingPieceId,
    piece.id,
    snapToLogicalPosition,
    handleAnimationFinished,
    translateX,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      collapsable={false}
      style={[styles.animatedContainer, animatedStyle, { width: pieceSize, height: pieceSize }]}
    >
      <PieceView
        type={piece.type}
        player={piece.player}
        cellWidth={cellWidth}
        pieceSize={pieceSize}
        isSelected={isSelected}
        onPress={onPress}
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

  const isPlayer1 = player === 1;
  const playerColors = isPlayer1 ? COLORS.player1 : COLORS.player2;

  const gotiShapeStyle = isScout
    ? {
        borderRadius: 8,
      }
    : {
        borderRadius: pieceSize / 2,
      };

  const innerRingStyle = isScout
    ? {
        borderRadius: 5,
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
