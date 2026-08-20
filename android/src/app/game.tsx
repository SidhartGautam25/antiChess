import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import { useGameSession } from '../game/hooks/useGameSession';
import { selectCapturedCounts } from '../game/state/selectors';
import GameBoard from '../components/game/GameBoard';
import HeaderBar from '../components/ui/HeaderBar';
import TurnBanner from '../components/game/TurnBanner';
import PlayerStatusPanel from '../components/game/PlayerStatusPanel';
import GameOverModal from '../components/game/GameOverModal';
import { GameMode } from '../types/game';
import { LEVEL_REGISTRY } from '../constants/levels';
import { Ionicons } from '@expo/vector-icons';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const mode = (params.mode as GameMode) || 'VS_BOT';
  const level = params.level ? parseInt(params.level as string, 10) : 5;

  const { saveMatch } = useGameHistory();
  const { state, derived, actions } = useGameSession({ initialMode: mode, initialLevel: level, onSaveMatch: saveMatch });

  const { pieces, activePlayer, selectedPieceId, winner, winReason, isBotThinking, movesCount, animatingPieceId, moveLog } = state;
  const { legalMoves, canUndo } = derived;
  const { handleTileClick, handleAnimationComplete, undoMove, restartGame } = actions;

  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  const capturedCounts = useMemo(() => selectCapturedCounts(pieces), [pieces]);

  const activePlayerLabel = activePlayer === 1 ? 'Player 1' : (mode === 'VS_BOT' ? 'AI Bot' : 'Player 2');
  const activeColor = activePlayer === 1 ? COLORS.player1.primary : (mode === 'VS_BOT' ? COLORS.bot.primary : COLORS.player2.primary);

  const handleBackToMenu = () => {
    restartGame();
    router.replace('/');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />

      <HeaderBar title={mode === 'VS_BOT' ? `Anka-Chaal (${LEVEL_REGISTRY[level]?.name})` : 'Anka-Chaal (Local)'} />

      <View style={[styles.container, isShortScreen && { paddingHorizontal: 4 }]}>
        <PlayerStatusPanel
          label={mode === 'VS_BOT' ? 'AI Bot (Ebony)' : 'Player 2 (Ebony)'}
          indicatorColor={mode === 'VS_BOT' ? COLORS.bot.primary : COLORS.player2.primary}
          opponentCaptures={1}
          counts={capturedCounts}
          isShortScreen={isShortScreen}
        />

        <TurnBanner
          isBotThinking={isBotThinking}
          isGameOver={winner !== null}
          activePlayerLabel={activePlayerLabel}
          activeColor={activeColor}
          movesCount={movesCount}
          isShortScreen={isShortScreen}
        />

        <GameBoard
          pieces={pieces}
          selectedPieceId={selectedPieceId}
          legalMoves={legalMoves}
          activePlayer={activePlayer}
          isBotThinking={isBotThinking}
          onTileClick={handleTileClick}
          animatingPieceId={animatingPieceId}
          onAnimationComplete={handleAnimationComplete}
          moveLog={moveLog}
        />

        <PlayerStatusPanel
          label="Player 1 (Ivory)"
          indicatorColor={COLORS.player1.primary}
          opponentCaptures={2}
          counts={capturedCounts}
          isShortScreen={isShortScreen}
        />

        <View style={[styles.controlPanel, { marginBottom: isThreeButton ? 12 : Math.max(insets.bottom, 12) }, isShortScreen && { marginVertical: 2 }]}>
          <TouchableOpacity
            style={[styles.controlButton, !canUndo && styles.controlButtonDisabled, isShortScreen && { height: 38 }]}
            onPress={undoMove}
            disabled={!canUndo}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-undo-outline" size={isShortScreen ? 16 : 20} color={canUndo ? COLORS.textPrimary : COLORS.textMuted} />
            <Text style={[styles.controlButtonText, isShortScreen && { fontSize: 12 }, !canUndo && { color: COLORS.textMuted }]}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, isShortScreen && { height: 38 }]} onPress={restartGame} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={isShortScreen ? 16 : 20} color={COLORS.textPrimary} />
            <Text style={[styles.controlButtonText, isShortScreen && { fontSize: 12 }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <GameOverModal
          visible={winner !== null}
          winner={winner}
          winReason={winReason}
          mode={mode}
          movesCount={movesCount}
          onPlayAgain={restartGame}
          onBackToMenu={handleBackToMenu}
        />
      </View>
      {isThreeButton && <View style={{ height: insets.bottom, backgroundColor: '#000000' }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 3, justifyContent: 'space-between' },
  controlPanel: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  controlButton: { flex: 1, flexDirection: 'row', height: 48, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  controlButtonDisabled: { borderColor: COLORS.border + '40', backgroundColor: COLORS.surface + '40' },
  controlButtonText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
});
