import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation, runOnJS } from 'react-native-reanimated';
import { Piece, PieceType, Player } from '../../types/game';
import { COLORS } from '../../constants/colors';
import { FIXED_BOARD } from '../../constants/board';

interface AnimatedPieceProps {
  piece: Piece;
  cellWidth: number;
  isSelected: boolean;
  onPress: () => void;
  boardRevision: number;
  onAnimationComplete: (pieceId: string) => void;
}

export default function AnimatedPiece({
  piece,
  cellWidth,
  isSelected,
  onPress,
  boardRevision,
  onAnimationComplete,
}: AnimatedPieceProps) {
  const isJumper = piece.type === PieceType.JUMPER;

  // Width of individual tile content box (tile margins subtracted)
  const tileInnerWidth = cellWidth > 3 ? cellWidth - 3 : 0;
  
  // Custom size scaling per type to ensure visual balance
  let pieceSize = tileInnerWidth * 0.80;
  if (isJumper) {
    pieceSize = tileInnerWidth * 0.74; // slightly smaller so rotated corners don't overflow the tile boundaries
  }
  
  // Centering offset calculation relative to boardContainer:
  // accounts for 2px gridContainer padding, 1.5px tile margin, and centers piece within tileInnerWidth
  const centeringOffset = 2 + (cellWidth - pieceSize) / 2;

  // Refs to track the previous position for triggering slide animations
  const prevRow = React.useRef(piece.position.row);
  const prevCol = React.useRef(piece.position.col);

  // Target positions (computed dynamically)
  const targetX = piece.position.col * cellWidth + centeringOffset;
  const targetY = piece.position.row * cellWidth + centeringOffset;

  // Shared values for coordinates, progress, and revision
  const progress = useSharedValue(1); // 1 = animation complete / snapped
  const startX = useSharedValue(targetX);
  const startY = useSharedValue(targetY);
  const targetXShared = useSharedValue(targetX);
  const targetYShared = useSharedValue(targetY);
  const currentRevision = useSharedValue(boardRevision);

  // State to track visual position for piece label rendering (prevents immediate label change before slide)
  const [displayPos, setDisplayPos] = React.useState({ row: piece.position.row, col: piece.position.col });

  useEffect(() => {
    currentRevision.value = boardRevision;
  }, [boardRevision]);

  // Update animated coordinates when grid position or cell size changes
  useEffect(() => {
    const nextTargetX = piece.position.col * cellWidth + centeringOffset;
    const nextTargetY = piece.position.row * cellWidth + centeringOffset;

    const positionChanged = prevRow.current !== piece.position.row || prevCol.current !== piece.position.col;
    const startedRevision = boardRevision;

    cancelAnimation(progress);

    if (positionChanged) {
      // Calculate current position to start from (to avoid sudden jumps)
      const currentX = startX.value + (targetXShared.value - startX.value) * progress.value;
      const currentY = startY.value + (targetYShared.value - startY.value) * progress.value;

      startX.value = currentX;
      startY.value = currentY;
      targetXShared.value = nextTargetX;
      targetYShared.value = nextTargetY;
      progress.value = 0;

      // Drive both coordinates from a single progress animation (called exactly once)
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        'worklet';
        if (finished && currentRevision.value === startedRevision) {
          runOnJS(onAnimationComplete)(piece.id);
          // Sync visual label only when animation completes
          runOnJS(setDisplayPos)({ row: piece.position.row, col: piece.position.col });
        }
      });
    } else {
      // Snap instantly on first render, layout changes, or reset/undo
      startX.value = nextTargetX;
      startY.value = nextTargetY;
      targetXShared.value = nextTargetX;
      targetYShared.value = nextTargetY;
      progress.value = 1;
      setDisplayPos({ row: piece.position.row, col: piece.position.col });
    }

    prevRow.current = piece.position.row;
    prevCol.current = piece.position.col;
  }, [piece.position.row, piece.position.col, cellWidth, centeringOffset, boardRevision]);

  const animatedStyle = useAnimatedStyle(() => {
    const curX = startX.value + (targetXShared.value - startX.value) * progress.value;
    const curY = startY.value + (targetYShared.value - startY.value) * progress.value;
    return {
      transform: [
        { translateX: curX },
        { translateY: curY },
      ],
    };
  });

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

  // Custom goti shape styling (Scout = Square, Rider = Circle)
  const gotiShapeStyle = isScout
    ? {
        borderRadius: 8, // Rounded square
      }
    : {
        borderRadius: pieceSize / 2, // Perfect circle
      };

  const innerRingStyle = isScout
    ? {
        borderRadius: 5,
      }
    : {
        borderRadius: (pieceSize * 0.70) / 2,
      };

  // High contrast labels: dark on light ivory piece, light on dark obsidian piece
  const labelColor = isPlayer1 ? '#1F2937' : '#FFFFFF';

  // Get the value of the tile that the piece is currently sitting on
  const tileValue = FIXED_BOARD[row][col];

  if (isJumper) {
    return (
      <Pressable 
        style={styles.pressable} 
        onPress={onPress}
        android_ripple={{ color: playerColors.primary + '33', borderless: true }}
      >
        <View style={{ width: pieceSize, height: pieceSize, justifyContent: 'center', alignItems: 'center' }}>
          {/* Base square */}
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
          {/* 45 degree rotated square */}
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
          {/* Center circle cover and label (masking inner intersecting borders) */}
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
            {/* Display the value of the occupied tile */}
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
        {/* Inner ring for premium classic look */}
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
          {/* Display the value of the occupied tile */}
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
