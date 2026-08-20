import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CapturedCounts } from '../../game/state/selectors';
import { PieceType, Player } from '../../types/game';
import { COLORS } from '../../constants/colors';
import CapturedPieceIcon from './CapturedPieceIcon';

interface CapturedPiecesBarProps {
  player: Player;
  counts: CapturedCounts;
  isShortScreen: boolean;
}

const DISPLAY_ORDER: PieceType[] = [PieceType.SCOUT, PieceType.JUMPER, PieceType.RIDER, PieceType.INFILTRATOR];

function CapturedPiecesBar({ player, counts, isShortScreen }: CapturedPiecesBarProps) {
  const size = isShortScreen ? 18 : 24;
  const containerHeight = isShortScreen ? 20 : 26;

  const items = useMemo(() => {
    const result: { type: PieceType; index: number }[] = [];
    for (const type of DISPLAY_ORDER) {
      const count = counts[player][type] || 0;
      for (let i = 0; i < count; i++) result.push({ type, index: i });
    }
    return result;
  }, [counts, player]);

  if (items.length === 0) {
    return (
      <View style={{ height: containerHeight, justifyContent: 'center' }}>
        <Text style={styles.noCapturesText}>No pieces captured</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { height: containerHeight, alignItems: 'center' }]}>
      {items.map(({ type, index }) => (
        <CapturedPieceIcon key={`${type}-${index}`} type={type} player={player} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  noCapturesText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
});

export default React.memo(CapturedPiecesBar);
