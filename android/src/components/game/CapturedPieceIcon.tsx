import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { PieceType, Player } from '../../types/game';
import { COLORS } from '../../constants/colors';

interface CapturedPieceIconProps {
  type: PieceType;
  player: Player;
  size: number;
}

function CapturedPieceIcon({ type, player, size }: CapturedPieceIconProps) {
  const isScout = type === PieceType.SCOUT;
  const isRider = type === PieceType.RIDER;
  const isJumper = type === PieceType.JUMPER;
  const isInfiltrator = type === PieceType.INFILTRATOR;

  const playerColors = player === 1 ? COLORS.player1 : COLORS.player2;
  const labelColor = player === 1 ? '#1F2937' : '#FFFFFF';
  const letter = isScout ? 'S' : isRider ? 'R' : isJumper ? 'J' : 'I';

  const shapeStyle = isScout
    ? { borderRadius: 4 }
    : isRider
    ? { borderRadius: size / 2 }
    : isInfiltrator
    ? { borderRadius: size / 2, borderStyle: 'dashed' as const, borderWidth: 1.5 }
    : {};

  if (isJumper) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginHorizontal: 1 }}>
        <View style={[styles.piece, { position: 'absolute', width: size, height: size, borderColor: playerColors.primary, backgroundColor: playerColors.secondary, borderRadius: size * 0.20 }]} />
        <View style={[styles.piece, { position: 'absolute', width: size, height: size, borderColor: playerColors.primary, backgroundColor: playerColors.secondary, borderRadius: size * 0.20, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.innerRing, { position: 'absolute', borderRadius: (size * 0.70) / 2, borderColor: playerColors.primary + '40', backgroundColor: playerColors.secondary, width: size * 0.70, height: size * 0.70, zIndex: 10 }]}>
          <Text style={[styles.text, { color: labelColor, fontSize: size * 0.35 }]}>{letter}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.piece, shapeStyle, { borderColor: playerColors.primary, backgroundColor: playerColors.secondary, width: size, height: size, marginHorizontal: 1 }]}>
      <View style={[
        styles.innerRing,
        isScout ? { borderRadius: 3 } : { borderRadius: (size * 0.70) / 2, ...(isInfiltrator ? { borderStyle: 'dashed' as const, borderWidth: 0.75 } : {}) },
        { borderColor: playerColors.primary + '40', width: size * 0.70, height: size * 0.70 }
      ]}>
        <Text style={[styles.text, { color: labelColor, fontSize: size * 0.38 }]}>{letter}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { borderWidth: 1.8, justifyContent: 'center', alignItems: 'center' },
  innerRing: { borderWidth: 1, borderStyle: 'solid', justifyContent: 'center', alignItems: 'center' },
  text: { fontWeight: 'bold', textAlign: 'center', ...Platform.select({ ios: { fontFamily: 'System' }, android: { fontFamily: 'serif' } }) },
});

export default React.memo(CapturedPieceIcon);
