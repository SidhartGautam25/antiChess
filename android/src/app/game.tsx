import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import { useGameSession } from '../hooks/useGameSession';
import GameBoard from '../components/game/GameBoard';
import HeaderBar from '../components/ui/HeaderBar';
import { GameMode, PieceType, Player } from '../types/game';
import { LEVEL_REGISTRY } from '../constants/levels';
import { Ionicons } from '@expo/vector-icons';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse parameters from route
  const mode = (params.mode as GameMode) || 'VS_BOT';
  const level = params.level ? parseInt(params.level as string, 10) : 5;

  const { saveMatch } = useGameHistory();

  // Initialize session controller
  const {
    pieces,
    activePlayer,
    selectedPieceId,
    legalMoves,
    winner,
    isBotThinking,
    movesCount,
    canUndo,
    handleTileClick,
    undoMove,
    restartGame,
  } = useGameSession({
    initialMode: mode,
    initialLevel: level,
    onSaveMatch: saveMatch,
  });

  // Calculate captured pieces
  const getCapturedCount = (player: Player, type: PieceType) => {
    // Expected count: Scout = 2, Rider = 1
    const expected = type === PieceType.SCOUT ? 2 : 1;
    const current = pieces.filter((p) => p.player === player && p.type === type).length;
    return Math.max(0, expected - current);
  };

  const p1ScoutsCaptured = getCapturedCount(1, PieceType.SCOUT);
  const p1RidersCaptured = getCapturedCount(1, PieceType.RIDER);
  const p2ScoutsCaptured = getCapturedCount(2, PieceType.SCOUT);
  const p2RidersCaptured = getCapturedCount(2, PieceType.RIDER);

  // Render Captured pieces indicators
  const renderCapturedBar = (player: Player) => {
    const isP1 = player === 1;
    const scouts = isP1 ? p1ScoutsCaptured : p2ScoutsCaptured;
    const riders = isP1 ? p1RidersCaptured : p2RidersCaptured;
    const pColor = isP1 ? COLORS.player1.primary : COLORS.player2.primary;

    const items = [];
    // Render captured Scouts
    for (let i = 0; i < scouts; i++) {
      items.push(
        <View key={`scout-${i}`} style={[styles.capturedDot, { borderColor: pColor }]}>
          <Text style={[styles.capturedDotText, { color: pColor }]}>S</Text>
        </View>
      );
    }
    // Render captured Rider
    for (let i = 0; i < riders; i++) {
      items.push(
        <View key={`rider-${i}`} style={[styles.capturedDot, { borderColor: pColor }]}>
          <Text style={[styles.capturedDotText, { color: pColor }]}>R</Text>
        </View>
      );
    }

    if (items.length === 0) {
      return <Text style={styles.noCapturesText}>No pieces captured</Text>;
    }

    return <View style={styles.capturedRow}>{items}</View>;
  };

  // Helper to format player names
  const getActivePlayerName = () => {
    if (activePlayer === 1) return 'Player 1';
    return mode === 'VS_BOT' ? 'AI Bot' : 'Player 2';
  };

  const activeColor = activePlayer === 1 
    ? COLORS.player1.primary 
    : (mode === 'VS_BOT' ? COLORS.bot.primary : COLORS.player2.primary);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <HeaderBar 
        title={mode === 'VS_BOT' ? `VS Bot (${LEVEL_REGISTRY[level]?.name})` : 'Pass & Play'} 
      />

      <View style={styles.container}>
        
        {/* Top Status Bar: Bot / Player 2 status */}
        <View style={styles.playerPanel}>
          <View style={styles.playerInfo}>
            <View 
              style={[
                styles.playerIndicatorCircle, 
                { backgroundColor: mode === 'VS_BOT' ? COLORS.bot.primary : COLORS.player2.primary }
              ]} 
            />
            <Text style={styles.playerName}>
              {mode === 'VS_BOT' ? 'AI Bot (Red)' : 'Player 2 (Red)'}
            </Text>
          </View>
          {renderCapturedBar(2)}
        </View>

        {/* Turn indicator banner */}
        <View style={[styles.turnBanner, { borderColor: activeColor + '40' }]}>
          {isBotThinking ? (
            <View style={styles.thinkingContainer}>
              <ActivityIndicator size="small" color={COLORS.bot.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.turnText, { color: COLORS.bot.primary }]}>AI Bot is planning...</Text>
            </View>
          ) : (
            <Text style={[styles.turnText, { color: activeColor }]}>
              {winner ? 'GAME OVER' : `${getActivePlayerName().toUpperCase()}'S TURN`}
            </Text>
          )}
          <Text style={styles.movesCountText}>Move: {movesCount + 1}</Text>
        </View>

        {/* 5x5 Game Board */}
        <GameBoard
          pieces={pieces}
          selectedPieceId={selectedPieceId}
          legalMoves={legalMoves}
          activePlayer={activePlayer}
          isBotThinking={isBotThinking}
          onTileClick={handleTileClick}
        />

        {/* Bottom Status Bar: Player 1 status */}
        <View style={styles.playerPanel}>
          <View style={styles.playerInfo}>
            <View style={[styles.playerIndicatorCircle, { backgroundColor: COLORS.player1.primary }]} />
            <Text style={styles.playerName}>Player 1 (Blue)</Text>
          </View>
          {renderCapturedBar(1)}
        </View>

        {/* Controller Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.controlButton, !canUndo && styles.controlButtonDisabled]}
            onPress={undoMove}
            disabled={!canUndo}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-undo-outline" size={20} color={canUndo ? COLORS.textPrimary : COLORS.textMuted} />
            <Text style={[styles.controlButtonText, !canUndo && { color: COLORS.textMuted }]}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={restartGame}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Game Winner Celebration Modal Overlay */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={winner !== null}
          onRequestClose={() => {}}
        >
          <View style={styles.modalBg}>
            <View 
              style={[
                styles.modalCard,
                { 
                  borderColor: winner === 1 ? COLORS.player1.primary : COLORS.player2.primary,
                  shadowColor: winner === 1 ? COLORS.player1.primary : COLORS.player2.primary,
                }
              ]}
            >
              <Ionicons 
                name="trophy" 
                size={64} 
                color={winner === 1 ? COLORS.player1.primary : COLORS.player2.primary} 
                style={styles.trophyIcon}
              />
              
              <Text style={styles.modalWinnerTitle}>
                {winner === 1 
                  ? 'Victory!' 
                  : (mode === 'VS_BOT' ? 'Defeat!' : 'Player 2 Wins!')}
              </Text>
              
              <Text style={styles.modalWinnerSubtitle}>
                {winner === 1
                  ? 'You have captured all enemy pieces!'
                  : (mode === 'VS_BOT' ? 'The AI Bot has cleared your pieces.' : 'Player 2 captured all enemy pieces.')}
              </Text>

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

              <TouchableOpacity
                style={[
                  styles.modalActionBtn,
                  { backgroundColor: winner === 1 ? COLORS.player1.primary : COLORS.player2.primary }
                ]}
                onPress={restartGame}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionBtnText}>PLAY AGAIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  restartGame();
                  router.replace('/');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSecondaryBtnText}>BACK TO MENU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  playerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 4,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  capturedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  capturedDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  capturedDotText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noCapturesText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  turnBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginVertical: 4,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  movesCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  controlPanel: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  controlButtonDisabled: {
    borderColor: COLORS.border + '40',
    backgroundColor: COLORS.surface + '40',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 12,
  },
  trophyIcon: {
    marginBottom: 16,
  },
  modalWinnerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalWinnerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  modalStatBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  modalActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalActionBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 1,
  },
  modalSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
});
