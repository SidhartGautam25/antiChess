import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { GameMode, Player } from '../../types/game';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | 0 | null;
  winReason: 'capture' | 'move_limit' | null;
  mode: GameMode;
  movesCount: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function GameOverModal({ visible, winner, winReason, mode, movesCount, onPlayAgain, onBackToMenu }: GameOverModalProps) {
  if (winner === null) return null;

  const accentColor = winner === 0 ? '#4B5563' : winner === 1 ? COLORS.player1.primary : COLORS.player2.primary;
  const title = winner === 0 ? 'Match Drawn!' : winner === 1 ? 'Victory!' : (mode === 'VS_BOT' ? 'Defeat!' : 'Player 2 Wins!');

  const subtitle = winner === 0
    ? 'The 50-move limit was reached with equal piece weightage.'
    : winReason === 'move_limit'
    ? '50-move limit reached! Won by piece weightage.'
    : winner === 1
    ? 'You have captured all enemy pieces!'
    : (mode === 'VS_BOT' ? 'The AI Bot has cleared your pieces.' : 'Player 2 captured all enemy pieces.');

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={() => {}}>
      <View style={styles.modalBg}>
        <View style={[styles.modalCard, { borderColor: accentColor, shadowColor: accentColor }]}>
          <Ionicons name={winner === 0 ? 'flag' : 'trophy'} size={64} color={winner === 0 ? '#9CA3AF' : accentColor} style={styles.trophyIcon} />
          <Text style={styles.modalWinnerTitle}>{title}</Text>
          <Text style={styles.modalWinnerSubtitle}>{subtitle}</Text>

          <View style={styles.modalStatsRow}>
            <View style={styles.modalStatBox}>
              <Text style={styles.modalStatLabel}>MOVES</Text>
              <Text style={styles.modalStatValue}>{movesCount}</Text>
            </View>
            <View style={styles.modalStatBox}>
              <Text style={styles.modalStatLabel}>TURNS</Text>
              <Text style={styles.modalStatValue}>{Math.ceil(movesCount / 2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: accentColor }]} onPress={onPlayAgain} activeOpacity={0.8}>
            <Text style={styles.modalActionBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onBackToMenu} activeOpacity={0.7}>
            <Text style={styles.modalSecondaryBtnText}>BACK TO MENU</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 2, padding: 24, alignItems: 'center', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 }, shadowRadius: 16, elevation: 12 },
  trophyIcon: { marginBottom: 16 },
  modalWinnerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1, marginBottom: 8 },
  modalWinnerSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24, width: '100%' },
  modalStatBox: { flex: 1, backgroundColor: COLORS.surfaceSecondary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, alignItems: 'center' },
  modalStatLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold', letterSpacing: 0.5 },
  modalStatValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 4 },
  modalActionBtn: { width: '100%', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalActionBtnText: { fontSize: 16, fontWeight: '900', color: COLORS.background, letterSpacing: 1 },
  modalSecondaryBtn: { width: '100%', height: 48, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  modalSecondaryBtnText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary },
});

export default React.memo(GameOverModal);
