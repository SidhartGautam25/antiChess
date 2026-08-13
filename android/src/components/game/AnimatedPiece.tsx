import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation, runOnJS } from 'react-native-reanimated';
import { Piece, PieceType } from '../../types/game';
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

export default function AnimatedPiece({ piece, cellWidth, isSelected, onPress, boardRevision, onAnimationComplete }: AnimatedPieceProps) {
  const isScout = piece.type === PieceType.SCOUT;
  const isRider = piece.type === PieceType.RIDER;
  const isJumper = piece.type === PieceType.JUMPER;

  const isPlayer1 = piece.player === 1;
  const playerColors = isPlayer1 ? COLORS.player1 : COLORS.player2;

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

  // Shared values for coordinates and revision
  const x = useSharedValue(piece.position.col * cellWidth + centeringOffset);
  const y = useSharedValue(piece.position.row * cellWidth + centeringOffset);
  const currentRevision = useSharedValue(boardRevision);

  useEffect(() => {
    currentRevision.value = boardRevision;
  }, [boardRevision]);

  // Update animated coordinates when grid position or cell size changes
  useEffect(() => {
    const targetX = piece.position.col * cellWidth + centeringOffset;
    const targetY = piece.position.row * cellWidth + centeringOffset;

    // Check if the piece moved to a different tile
    const positionChanged = prevRow.current !== piece.position.row || prevCol.current !== piece.position.col;
    const startedRevision = boardRevision;

    cancelAnimation(x);
    cancelAnimation(y);

    if (positionChanged) {
      // Animate transition when moving to a new cell
      x.value = withTiming(targetX, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        'worklet';
        if (finished && currentRevision.value === startedRevision) {
          x.value = targetX;
          runOnJS(onAnimationComplete)(piece.id);
        }
      });
      y.value = withTiming(targetY, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        'worklet';
        if (finished && currentRevision.value === startedRevision) {
          y.value = targetY;
          runOnJS(onAnimationComplete)(piece.id);
        }
      });
    } else {
      // Snap instantly on first render, layout changes, or reset/undo
      x.value = targetX;
      y.value = targetY;
    }

    prevRow.current = piece.position.row;
    prevCol.current = piece.position.col;
  }, [piece.position.row, piece.position.col, cellWidth, centeringOffset, boardRevision, x, y]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
      ],
    };
  });

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
  const tileValue = FIXED_BOARD[piece.position.row][piece.position.col];

  // Render Jumper (Octagon) using two overlapping squares rotated relative to each other by 45deg
  if (isJumper) {
    return (
      <Animated.View 
        collapsable={false}
        style={[styles.animatedContainer, animatedStyle, { width: pieceSize, height: pieceSize }]}
      >
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
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      collapsable={false}
      style={[styles.animatedContainer, animatedStyle, { width: pieceSize, height: pieceSize }]}
    >
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
    </Animated.View>
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

