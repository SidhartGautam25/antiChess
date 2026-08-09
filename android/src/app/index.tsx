import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import LevelSelector from '../components/ui/LevelSelector';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'VS_BOT' | 'PASS_AND_PLAY'>('VS_BOT');
  const [level, setLevel] = useState<number>(5); // Default is level 5: Strategist
  const { stats, loadHistory } = useGameHistory();

  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  // Reload history and stats when screen mounts
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleStartGame = () => {
    router.push({
      pathname: '/game',
      params: { mode, level },
    });
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />
      
      <View style={[styles.container, { paddingHorizontal: isShortScreen ? 12 : 20 }]}>
        <ScrollView 
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 12,
              paddingBottom: isThreeButton ? 16 : Math.max(insets.bottom, 12) 
            }
          ]} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Premium Logo & Title Emblem */}
          <View style={[styles.header, isShortScreen && { marginBottom: 12 }]}>
            <View style={[
              styles.logoEmblem,
              isShortScreen && {
                width: 70,
                height: 70,
                borderRadius: 35,
                marginBottom: 8,
              }
            ]}>
              <Image 
                source={require('../../assets/images/game-logo.svg')} 
                style={[styles.logoImage, isShortScreen && { width: 40, height: 40 }]} 
                contentFit="contain"
              />
            </View>
            <Text style={[styles.logoText, isShortScreen && { fontSize: 24, letterSpacing: 2 }]}>ANKA-CHAAL</Text>
            <Text style={[styles.tagline, isShortScreen && { fontSize: 9, marginTop: 3 }]}>8x8 NUMBER-GRID TACTICAL CHESS</Text>
          </View>

          {/* Sleek Game Settings Container Card */}
          <View style={[styles.settingsCard, isShortScreen && { padding: 12, marginBottom: 12 }]}>
            <Text style={styles.cardHeading}>GAME CONFIGURATION</Text>
            
            {/* Segmented Pill Selector for Game Mode */}
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  isShortScreen && { height: 40 },
                  mode === 'VS_BOT' && { borderColor: COLORS.accentBlue, backgroundColor: COLORS.surfaceSecondary }
                ]}
                onPress={() => setMode('VS_BOT')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="hardware-chip-outline" 
                  size={isShortScreen ? 16 : 20} 
                  color={mode === 'VS_BOT' ? COLORS.accentBlue : COLORS.textSecondary} 
                />
                <Text style={[styles.modeText, isShortScreen && { fontSize: 12 }, mode === 'VS_BOT' && { color: COLORS.textPrimary }]}>
                  VS AI Bot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  isShortScreen && { height: 40 },
                  mode === 'PASS_AND_PLAY' && { borderColor: COLORS.accentPink, backgroundColor: COLORS.surfaceSecondary }
                ]}
                onPress={() => setMode('PASS_AND_PLAY')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="people-outline" 
                  size={isShortScreen ? 16 : 20} 
                  color={mode === 'PASS_AND_PLAY' ? COLORS.accentPink : COLORS.textSecondary} 
                />
                <Text style={[styles.modeText, isShortScreen && { fontSize: 12 }, mode === 'PASS_AND_PLAY' && { color: COLORS.textPrimary }]}>
                  Pass & Play
                </Text>
              </TouchableOpacity>
            </View>

            {/* Level Selector - Only show if VS Bot mode is selected */}
            {mode === 'VS_BOT' ? (
              <View style={styles.levelSelectorContainer}>
                <LevelSelector selectedLevel={level} onSelectLevel={setLevel} />
              </View>
            ) : (
              <View style={[styles.modeInfoBox, isShortScreen && { padding: 10, marginTop: 8 }]}>
                <Ionicons name="information-circle-outline" size={isShortScreen ? 16 : 20} color={COLORS.accentPink} />
                <Text style={[styles.modeInfoText, isShortScreen && { fontSize: 11, lineHeight: 15 }]}>
                  Pass & Play allows two players to play locally on this device. Take turns moving your pieces.
                </Text>
              </View>
            )}
          </View>

          {/* Play Action Button (Gold Gradient Style) */}
          <TouchableOpacity 
            style={[
              styles.startButton,
              isShortScreen && { height: 48, marginBottom: 16 },
              { backgroundColor: COLORS.accentAmber }
            ]}
            onPress={handleStartGame}
            activeOpacity={0.8}
          >
            <Text style={[styles.startButtonText, isShortScreen && { fontSize: 16 }]}>PLAY GAME</Text>
            <Ionicons name="play-forward" size={isShortScreen ? 16 : 20} color={COLORS.background} />
          </TouchableOpacity>

          {/* Quick Statistics Capsule */}
          {stats && stats.totalGames > 0 && (
            <View style={[styles.statsBanner, isShortScreen && { padding: 10, marginBottom: 16 }]}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Games</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 14 }]}>{stats.totalGames}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win % vs Bot</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 14 }, { color: COLORS.accentBlue }]}>
                  {stats.winRateVsBot}%
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Moves</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 14 }]}>{stats.avgMoves}</Text>
              </View>
            </View>
          )}

          {/* Secondary Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, isShortScreen && { height: 40 }]}
              onPress={() => router.push('/rules')}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={isShortScreen ? 16 : 20} color={COLORS.accentBlue} />
              <Text style={[styles.actionButtonText, isShortScreen && { fontSize: 12 }]}>Rules & Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isShortScreen && { height: 40 }]}
              onPress={() => router.push('/history')}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart" size={isShortScreen ? 16 : 20} color={COLORS.accentBlue} />
              <Text style={[styles.actionButtonText, isShortScreen && { fontSize: 12 }]}>History & Stats</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
  },
  scrollContent: {
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmblem: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 2,
    borderColor: COLORS.accentAmber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accentAmber,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 4,
    textShadowColor: COLORS.glow1 + '80',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.accentBlue,
    letterSpacing: 2,
    marginTop: 6,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  levelSelectorContainer: {
    marginTop: 8,
  },
  modeInfoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginTop: 12,
  },
  modeInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  startButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 1.5,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});


