import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CapturedCounts } from '../../game/state/selectors';
import { Player } from '../../types/game';
import { COLORS } from '../../constants/colors';
import CapturedPiecesBar from './CapturedPiecesBar';

interface PlayerStatusPanelProps {
  label: string;
  indicatorColor: string;
  opponentCaptures: Player; // whose pieces this panel shows as captured
  counts: CapturedCounts;
  isShortScreen: boolean;
}

function PlayerStatusPanel({ label, indicatorColor, opponentCaptures, counts, isShortScreen }: PlayerStatusPanelProps) {
  return (
    <View style={[styles.playerPanel, isShortScreen && { padding: 8, marginVertical: 2 }]}>
      <View style={styles.playerInfo}>
        <View style={[styles.playerIndicatorCircle, { backgroundColor: indicatorColor }]} />
        <Text style={[styles.playerName, isShortScreen && { fontSize: 12 }]}>{label}</Text>
      </View>
      <CapturedPiecesBar player={opponentCaptures} counts={counts} isShortScreen={isShortScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  playerPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginVertical: 4 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerIndicatorCircle: { width: 10, height: 10, borderRadius: 5 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
});

export default React.memo(PlayerStatusPanel);
