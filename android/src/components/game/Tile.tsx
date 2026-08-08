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
          glowColor: COLORS.glow1 + '40', // 25% opacity
          labelColor: COLORS.glow1 + '30',
        };
      case 2:
        return {
          bgColor: COLORS.tile2,
          glowColor: COLORS.glow2 + '50', // 30% opacity
          labelColor: COLORS.glow2 + '35',
        };
      case 3:
      default:
        return {
          bgColor: COLORS.tile3,
          glowColor: COLORS.glow3 + '60', // 37% opacity
          labelColor: COLORS.glow3 + '40',
        };
    }
  };

  const { bgColor, glowColor, labelColor } = getTileStyles();

  // Dynamically calculate styling based on selection and move targets
  let finalBgColor = bgColor;
  let finalBorderColor = glowColor;
  let finalBorderWidth = 1.5;
  let finalLabelColor = labelColor;

  if (isLegalTarget) {
    if (isEnemyOccupied) {
      finalBgColor = COLORS.captureMove + '26'; // ~15% opacity red background
      finalBorderColor = COLORS.captureMove;
      finalBorderWidth = 2.5;
      finalLabelColor = COLORS.textPrimary; // White number to be fully readable
    } else {
      finalBgColor = COLORS.legalMove + '1A'; // ~10% opacity green background
      finalBorderColor = COLORS.legalMove;
      finalBorderWidth = 2.0;
      finalLabelColor = COLORS.textPrimary; // White number to be fully readable
    }
  }

  if (isSelected) {
    finalBorderColor = COLORS.selected;
    finalBorderWidth = 2.5;
    finalLabelColor = COLORS.selected;
  }

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: finalBgColor,
          borderColor: finalBorderColor,
          borderWidth: finalBorderWidth,
        },
        isSelected && styles.selectedTileShadow,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Background cell value number (always fully visible and centered) */}
      <Text style={[styles.valueLabel, { color: finalLabelColor }]}>{value}</Text>

      {/* Subtle corner indicator dot to signal target destination */}
      {isLegalTarget && (
        <View style={styles.cornerIndicatorContainer}>
          <View 
            style={[
              styles.cornerIndicator, 
              { backgroundColor: isEnemyOccupied ? COLORS.captureMove : COLORS.legalMove }
            ]} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 8,
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
  valueLabel: {
    fontSize: 24,
    fontWeight: '900',
  },
  cornerIndicatorContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  cornerIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
});
