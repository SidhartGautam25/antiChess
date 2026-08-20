import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

interface TurnBannerProps {
  isBotThinking: boolean;
  isGameOver: boolean;
  activePlayerLabel: string;
  activeColor: string;
  movesCount: number;
  isShortScreen: boolean;
}

function TurnBanner({ isBotThinking, isGameOver, activePlayerLabel, activeColor, movesCount, isShortScreen }: TurnBannerProps) {
  return (
    <View style={[styles.turnBanner, { borderColor: activeColor + '40' }, isShortScreen && { height: 38, marginVertical: 2, paddingHorizontal: 12 }]}>
      {isBotThinking ? (
        <View style={styles.thinkingContainer}>
          <ActivityIndicator size="small" color={COLORS.bot.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.turnText, { color: COLORS.bot.primary }, isShortScreen && { fontSize: 12 }]}>AI Bot is planning...</Text>
        </View>
      ) : (
        <Text style={[styles.turnText, { color: activeColor }, isShortScreen && { fontSize: 12 }]}>
          {isGameOver ? 'GAME OVER' : `${activePlayerLabel.toUpperCase()}'S TURN`}
        </Text>
      )}
      <Text style={[styles.movesCountText, isShortScreen && { fontSize: 11 }]}>Moves: {movesCount}/50</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  turnBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceSecondary, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 48, marginVertical: 4 },
  thinkingContainer: { flexDirection: 'row', alignItems: 'center' },
  turnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  movesCountText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
});

export default React.memo(TurnBanner);
