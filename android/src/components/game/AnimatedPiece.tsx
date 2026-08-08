import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Piece, PieceType } from '../../types/game';
import { COLORS } from '../../constants/colors';
import { FIXED_BOARD } from '../../constants/board';

interface AnimatedPieceProps {
  piece: Piece;
  cellWidth: number;
  isSelected: boolean;
  onPress: () => void;
}

export default function AnimatedPiece({ piece, cellWidth, isSelected, onPress }: AnimatedPieceProps) {
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

  // Shared values for coordinates
  const x = useSharedValue(piece.position.col * cellWidth + centeringOffset);
  const y = useSharedValue(piece.position.row * cellWidth + centeringOffset);

  // Update animated coordinates when grid position or cell size changes
  useEffect(() => {
    x.value = withTiming(piece.position.col * cellWidth + centeringOffset, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    y.value = withTiming(piece.position.row * cellWidth + centeringOffset, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [piece.position.row, piece.position.col, cellWidth, pieceSize, centeringOffset, x, y]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
      ],
      width: pieceSize,
      height: pieceSize,
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
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
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
                  borderColor: playerColors.primary,
                  backgroundColor: playerColors.secondary,
                  borderRadius: pieceSize * 0.20,
                },
                isSelected && {
                  borderWidth: 3.5,
                  borderColor: COLORS.selected,
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
                  borderColor: playerColors.primary,
                  backgroundColor: playerColors.secondary,
                  borderRadius: pieceSize * 0.20,
                  transform: [{ rotate: '45deg' }],
                },
                isSelected && {
                  borderWidth: 3.5,
                  borderColor: COLORS.selected,
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
    <Animated.View style={[styles.animatedContainer, animatedStyle]}>
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
              borderColor: playerColors.primary,
              backgroundColor: playerColors.secondary,
              width: pieceSize,
              height: pieceSize,
            },
            isSelected && {
              borderWidth: 3.5,
              borderColor: COLORS.selected,
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
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goti: {
    borderWidth: 2.5,
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
