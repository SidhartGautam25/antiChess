import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface TileProps {
  row: number;
  col: number;
  value: number;
  isSelected: boolean;
  isLegalTarget: boolean;
  isEnemyOccupied: boolean;
  onPress: () => void;
}

export default function Tile({
  row,
  col,
  value,
  isSelected,
  isLegalTarget,
  isEnemyOccupied,
  onPress,
}: TileProps) {
  // Determine backgrounds and borders based on tile movement value
  const getTileStyles = () => {
    switch (value) {
      case 1:
        return {
          bgColor: COLORS.tile1,
          glowColor: COLORS.glow1,
          labelColor: COLORS.labelDark,
        };
      case 2:
        return {
          bgColor: COLORS.tile2,
          glowColor: COLORS.glow2,
          labelColor: COLORS.labelDark,
        };
      case 3:
      default:
        return {
          bgColor: COLORS.tile3,
          glowColor: COLORS.glow3,
          labelColor: COLORS.labelLight,
        };
    }
  };

  const { bgColor, glowColor, labelColor } = getTileStyles();

  // Dynamically calculate borders and text color
  let finalBorderColor = glowColor;
  let finalBorderWidth = 1.5;
  let finalLabelColor = labelColor;

  if (isLegalTarget) {
    if (isEnemyOccupied) {
      finalBorderColor = COLORS.captureMove;
      finalBorderWidth = 2.5;
      finalLabelColor = COLORS.textPrimary; // White label for red captures
    } else {
      finalBorderColor = COLORS.legalMove;
      finalBorderWidth = 2.2;
      // For legal moves, keep labelColor as is since the background is still light
    }
  }

  if (isSelected) {
    finalBorderColor = COLORS.selected;
    finalBorderWidth = 2.5;
    if (value === 3) {
      finalLabelColor = COLORS.selected;
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: bgColor, // Keep the solid wood tone as base
          borderColor: finalBorderColor,
          borderWidth: finalBorderWidth,
        },
        isSelected && styles.selectedTileShadow,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Background tint overlay (blended above base color, behind text) */}
      {isLegalTarget && (
        <View 
          style={[
            styles.overlayTint,
            {
              backgroundColor: isEnemyOccupied 
                ? 'rgba(255, 69, 58, 0.28)' // Crimson red overlay
                : 'rgba(255, 179, 0, 0.26)'  // Warm bright amber gold overlay (highly visible)
            }
          ]}
        />
      )}

      {/* Cell value number (rendered on top of the overlay) */}
      <Text style={[styles.valueLabel, { color: finalLabelColor }]}>{value}</Text>

      {/* Capture lock-on target reticle */}
      {isLegalTarget && isEnemyOccupied && (
        <View style={styles.captureTargetRing} />
      )}

      {/* Subtle corner indicator dot for normal legal moves */}
      {isLegalTarget && !isEnemyOccupied && (
        <View style={styles.cornerIndicatorContainer}>
          <View style={styles.cornerIndicator} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: 1.5, // Reduced from 3 to sit closer
    borderRadius: 4, // Reduced from 8 for classic tiled board appearance
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedTileShadow: {
    shadowColor: COLORS.selected,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  overlayTint: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  valueLabel: {
    fontSize: 22,
    fontWeight: '900',
    zIndex: 5, // Render above the overlay tint
  },
  captureTargetRing: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    right: 2,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: COLORS.captureMove,
    borderStyle: 'dashed',
    zIndex: 6,
  },
  cornerIndicatorContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  cornerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.legalMove,
    shadowColor: COLORS.legalMove,
    shadowOpacity: 0.6,
    shadowRadius: 1,
    elevation: 1,
  },
});
