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
  onTileClick: (row: number, col: number) => void;
}

function Tile({
  row,
  col,
  value,
  isSelected,
  isLegalTarget,
  isEnemyOccupied,
  onTileClick,
}: TileProps) {
  const handlePress = React.useCallback(() => {
    onTileClick(row, col);
  }, [onTileClick, row, col]);

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

  // Dynamically calculate background, borders and text color
  let finalBgColor = bgColor;
  let finalBorderColor = glowColor;
  let finalBorderWidth = 1.5;
  let finalLabelColor = labelColor;

  if (isLegalTarget) {
    if (isEnemyOccupied) {
      finalBorderColor = COLORS.captureMove;
      finalBorderWidth = 2.5;
      finalLabelColor = COLORS.textPrimary; // White label for red captures
      // Directly assign blended hex backgrounds to prevent overlay rendering issues
      if (value === 1) finalBgColor = '#F7C0B6';
      else if (value === 2) finalBgColor = '#EBAD9B';
      else finalBgColor = '#B97564';
    } else {
      finalBorderColor = COLORS.legalMove;
      finalBorderWidth = 2.2;
      // Directly assign blended hex backgrounds to prevent overlay rendering issues
      if (value === 1) finalBgColor = '#F7E0AA';
      else if (value === 2) finalBgColor = '#EACC8F';
      else finalBgColor = '#B79357';
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
          backgroundColor: finalBgColor,
          borderColor: finalBorderColor,
          borderWidth: finalBorderWidth,
        },
        isSelected && styles.selectedTileShadow,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Cell value number */}
      <Text style={[styles.valueLabel, { color: finalLabelColor }]}>{value}</Text>

      {/* Capture lock-on target reticle */}
      {isLegalTarget && isEnemyOccupied && (
        <View style={styles.captureTargetRing} />
      )}

      {/* Flat corner indicator dot for normal legal moves */}
      {isLegalTarget && !isEnemyOccupied && (
        <View style={styles.cornerIndicator} />
      )}
    </TouchableOpacity>
  );
}

export default React.memo(Tile);

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
  valueLabel: {
    fontSize: 22,
    fontWeight: '900',
    zIndex: 5,
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
  cornerIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.legalMove,
    zIndex: 10,
  },
});

