import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Piece, PieceType } from '../../types/game';
import { COLORS } from '../../constants/colors';

interface AnimatedPieceProps {
  piece: Piece;
  cellWidth: number;
  isSelected: boolean;
  onPress: () => void;
}

export default function AnimatedPiece({ piece, cellWidth, isSelected, onPress }: AnimatedPieceProps) {
  // Shared values for coordinates
  const x = useSharedValue(piece.position.col * cellWidth);
  const y = useSharedValue(piece.position.row * cellWidth);

  // Update animated coordinates when grid position or cell size changes
  useEffect(() => {
    x.value = withSpring(piece.position.col * cellWidth, {
      damping: 14,
      stiffness: 100,
    });
    y.value = withSpring(piece.position.row * cellWidth, {
      damping: 14,
      stiffness: 100,
    });
  }, [piece.position.row, piece.position.col, cellWidth, x, y]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
      ],
      width: cellWidth,
      height: cellWidth,
    };
  });

  const isPlayer1 = piece.player === 1;
  const playerColors = isPlayer1 ? COLORS.player1 : COLORS.player2;

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
            {
              borderColor: playerColors.primary,
              shadowColor: playerColors.primary,
              width: cellWidth * 0.76,
              height: cellWidth * 0.76,
              borderRadius: (cellWidth * 0.76) / 2,
            },
            isSelected && {
              borderWidth: 3,
              borderColor: COLORS.selected,
              shadowColor: COLORS.selected,
              shadowRadius: 10,
              elevation: 10,
            }
          ]}
        >
          {/* Inner ring for premium look */}
          <View 
            style={[
              styles.innerRing,
              {
                borderColor: playerColors.primary + '40',
                width: cellWidth * 0.58,
                height: cellWidth * 0.58,
                borderRadius: (cellWidth * 0.58) / 2,
              }
            ]}
          >
            {/* Piece type label */}
            <Text 
              style={[
                styles.label, 
                { 
                  color: playerColors.primary,
                  fontSize: cellWidth * 0.32,
                }
              ]}
            >
              {piece.type === PieceType.SCOUT ? 'S' : 'R'}
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goti: {
    backgroundColor: 'rgba(21, 30, 51, 0.9)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 6,
  },
  innerRing: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'monospace' },
    }),
  },
});
