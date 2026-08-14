import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal, Platform, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  
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
    animatingPieceId,
    onAnimationComplete,
  } = useGameSession({
    initialMode: mode,
    initialLevel: level,
    onSaveMatch: saveMatch,
  });

  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  // Calculate captured pieces
  const getCapturedCount = (player: Player, type: PieceType) => {
    // Expected count: Scout = 2, Jumper = 2, Rider = 2 (in 8x8 setup with 6 pieces)
    const expected = 2;
    const current = pieces.filter((p) => p.player === player && p.type === type).length;
    return Math.max(0, expected - current);
  };

  const p1ScoutsCaptured = getCapturedCount(1, PieceType.SCOUT);
  const p1JumpersCaptured = getCapturedCount(1, PieceType.JUMPER);
  const p1RidersCaptured = getCapturedCount(1, PieceType.RIDER);
  const p2ScoutsCaptured = getCapturedCount(2, PieceType.SCOUT);
  const p2JumpersCaptured = getCapturedCount(2, PieceType.JUMPER);
  const p2RidersCaptured = getCapturedCount(2, PieceType.RIDER);

  // Render Captured pieces indicators
  const renderCapturedBar = (player: Player) => {
    const isP1 = player === 1;
    const scouts = isP1 ? p1ScoutsCaptured : p2ScoutsCaptured;
    const jumpers = isP1 ? p1JumpersCaptured : p2JumpersCaptured;
    const riders = isP1 ? p1RidersCaptured : p2RidersCaptured;
    
    // We want the piece to be rendered using the CAPTURED PLAYER's colors and design!
    // player = 1 => Player 1's pieces (Ivory/Gold) were lost
    // player = 2 => Player 2's pieces (Ebony/Crimson) were lost
    const playerColors = player === 1 ? COLORS.player1 : COLORS.player2;

    const items = [];
    
    const renderMiniPiece = (type: PieceType, key: string) => {
      const size = isShortScreen ? 18 : 24;
      const isScout = type === PieceType.SCOUT;
      const isRider = type === PieceType.RIDER;
      const isJumper = type === PieceType.JUMPER;
      
      const shapeStyle = isScout
        ? { borderRadius: 4 }
        : isRider
        ? { borderRadius: size / 2 }
        : {}; // Octagon is custom
        
      const labelColor = player === 1 ? '#1F2937' : '#FFFFFF';
      const letter = isScout ? 'S' : isRider ? 'R' : 'J';
      
      if (isJumper) {
        return (
          <View key={key} style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', marginHorizontal: 1 }}>
            {/* Base square */}
            <View 
              style={[
                styles.capturedMiniPiece,
                {
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderColor: playerColors.primary,
                  backgroundColor: playerColors.secondary,
                  borderRadius: size * 0.20,
                }
              ]}
            />
            {/* 45 degree rotated square */}
            <View 
              style={[
                styles.capturedMiniPiece,
                {
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderColor: playerColors.primary,
                  backgroundColor: playerColors.secondary,
                  borderRadius: size * 0.20,
                  transform: [{ rotate: '45deg' }],
                }
              ]}
            />
            {/* Inner masking ring */}
            <View 
              style={[
                styles.capturedMiniInnerRing,
                {
                  position: 'absolute',
                  borderRadius: (size * 0.70) / 2,
                  borderColor: playerColors.primary + '40',
                  backgroundColor: playerColors.secondary,
                  width: size * 0.70,
                  height: size * 0.70,
                  zIndex: 10,
                }
              ]}
            >
              <Text style={[styles.capturedMiniText, { color: labelColor, fontSize: size * 0.35 }]}>
                {letter}
              </Text>
            </View>
          </View>
        );
      }
      
      return (
        <View 
          key={key} 
          style={[
            styles.capturedMiniPiece,
            shapeStyle,
            {
              borderColor: playerColors.primary,
              backgroundColor: playerColors.secondary,
              width: size,
              height: size,
              marginHorizontal: 1,
            }
          ]}
        >
          <View 
            style={[
              styles.capturedMiniInnerRing,
              isScout ? { borderRadius: 3 } : { borderRadius: (size * 0.70) / 2 },
              {
                borderColor: playerColors.primary + '40',
                width: size * 0.70,
                height: size * 0.70,
              }
            ]}
          >
            <Text style={[styles.capturedMiniText, { color: labelColor, fontSize: size * 0.38 }]}>
              {letter}
            </Text>
          </View>
        </View>
      );
    };

    // Render captured Scouts
    for (let i = 0; i < scouts; i++) {
      items.push(renderMiniPiece(PieceType.SCOUT, `scout-${i}`));
    }
    // Render captured Jumpers
    for (let i = 0; i < jumpers; i++) {
      items.push(renderMiniPiece(PieceType.JUMPER, `jumper-${i}`));
    }
    // Render captured Riders
    for (let i = 0; i < riders; i++) {
      items.push(renderMiniPiece(PieceType.RIDER, `rider-${i}`));
    }

    const containerHeight = isShortScreen ? 20 : 26;

    if (items.length === 0) {
      return (
        <View style={{ height: containerHeight, justifyContent: 'center' }}>
          <Text style={styles.noCapturesText}>No pieces captured</Text>
        </View>
      );
    }

    return (
      <View style={[styles.capturedRow, { height: containerHeight, alignItems: 'center' }]}>
        {items}
      </View>
    );
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
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />

      {/* Header Bar */}
      <HeaderBar 
        title={mode === 'VS_BOT' ? `Anka-Chaal (${LEVEL_REGISTRY[level]?.name})` : 'Anka-Chaal (Local)'} 
      />

      <View style={[styles.container, isShortScreen && { paddingHorizontal: 4 }]}>
        
        {/* Top Status Bar: Bot / Player 2 status */}
        <View style={[styles.playerPanel, isShortScreen && { padding: 8, marginVertical: 2 }]}>
          <View style={styles.playerInfo}>
            <View 
              style={[
                styles.playerIndicatorCircle, 
                { backgroundColor: mode === 'VS_BOT' ? COLORS.bot.primary : COLORS.player2.primary }
              ]} 
            />
            <Text style={[styles.playerName, isShortScreen && { fontSize: 12 }]}>
              {mode === 'VS_BOT' ? 'AI Bot (Ebony)' : 'Player 2 (Ebony)'}
            </Text>
          </View>
          {renderCapturedBar(1)}
        </View>

        {/* Turn indicator banner */}
        <View style={[
          styles.turnBanner, 
          { borderColor: activeColor + '40' },
          isShortScreen && { height: 38, marginVertical: 2, paddingHorizontal: 12 }
        ]}>
          {isBotThinking ? (
            <View style={styles.thinkingContainer}>
              <ActivityIndicator size="small" color={COLORS.bot.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.turnText, { color: COLORS.bot.primary }, isShortScreen && { fontSize: 12 }]}>AI Bot is planning...</Text>
            </View>
          ) : (
            <Text style={[styles.turnText, { color: activeColor }, isShortScreen && { fontSize: 12 }]}>
              {winner ? 'GAME OVER' : `${getActivePlayerName().toUpperCase()}'S TURN`}
            </Text>
          )}
          <Text style={[styles.movesCountText, isShortScreen && { fontSize: 11 }]}>Moves: {movesCount}/50</Text>
        </View>

        {/* 8x8 Game Board */}
        <GameBoard
          pieces={pieces}
          selectedPieceId={selectedPieceId}
          legalMoves={legalMoves}
          activePlayer={activePlayer}
          isBotThinking={isBotThinking}
          onTileClick={handleTileClick}
          animatingPieceId={animatingPieceId}
          onAnimationComplete={onAnimationComplete}
        />

        {/* Bottom Status Bar: Player 1 status */}
        <View style={[styles.playerPanel, isShortScreen && { padding: 8, marginVertical: 2 }]}>
          <View style={styles.playerInfo}>
            <View style={[styles.playerIndicatorCircle, { backgroundColor: COLORS.player1.primary }]} />
            <Text style={[styles.playerName, isShortScreen && { fontSize: 12 }]}>Player 1 (Ivory)</Text>
          </View>
          {renderCapturedBar(2)}
        </View>

        {/* Controller Panel */}
        <View style={[
          styles.controlPanel, 
          { marginBottom: isThreeButton ? 12 : Math.max(insets.bottom, 12) },
          isShortScreen && { marginVertical: 2 }
        ]}>
          <TouchableOpacity
            style={[
              styles.controlButton, 
              !canUndo && styles.controlButtonDisabled,
              isShortScreen && { height: 38 }
            ]}
            onPress={undoMove}
            disabled={!canUndo}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="arrow-undo-outline" 
              size={isShortScreen ? 16 : 20} 
              color={canUndo ? COLORS.textPrimary : COLORS.textMuted} 
            />
            <Text style={[
              styles.controlButtonText, 
              isShortScreen && { fontSize: 12 },
              !canUndo && { color: COLORS.textMuted }
            ]}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              isShortScreen && { height: 38 }
            ]}
            onPress={restartGame}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="refresh-outline" 
              size={isShortScreen ? 16 : 20} 
              color={COLORS.textPrimary} 
            />
            <Text style={[
              styles.controlButtonText,
              isShortScreen && { fontSize: 12 }
            ]}>Reset</Text>
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
                  borderColor: winner === 0 ? '#4B5563' : winner === 1 ? COLORS.player1.primary : COLORS.player2.primary,
                  shadowColor: winner === 0 ? '#4B5563' : winner === 1 ? COLORS.player1.primary : COLORS.player2.primary,
                }
              ]}
            >
              <Ionicons 
                name={winner === 0 ? "flag" : "trophy"} 
                size={64} 
                color={
                  winner === 0 
                    ? '#9CA3AF' 
                    : winner === 1 
                    ? COLORS.player1.primary 
                    : COLORS.player2.primary
                } 
                style={styles.trophyIcon}
              />
              
              <Text style={styles.modalWinnerTitle}>
                {winner === 0 
                  ? 'Match Drawn!' 
                  : winner === 1 
                  ? 'Victory!' 
                  : (mode === 'VS_BOT' ? 'Defeat!' : 'Player 2 Wins!')}
              </Text>
              
              <Text style={styles.modalWinnerSubtitle}>
                {winner === 0 
                  ? 'The 50-move limit was reached with equal piece weightage.' 
                  : movesCount >= 50 
                  ? `50-move limit reached! Won by piece weightage.` 
                  : winner === 1
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
                  { backgroundColor: winner === 0 ? '#4B5563' : winner === 1 ? COLORS.player1.primary : COLORS.player2.primary }
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
      {isThreeButton && (
        <View style={{ height: insets.bottom, backgroundColor: '#000000' }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 3,
    justifyContent: 'space-between',
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
  capturedMiniPiece: {
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedMiniInnerRing: {
    borderWidth: 1,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedMiniText: {
    fontWeight: 'bold',
    textAlign: 'center',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'serif' },
    }),
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

