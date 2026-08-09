import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { LEVEL_REGISTRY } from '../constants/levels';
import { useGameHistory } from '../hooks/useGameHistory';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const DIFFICULTY_KEY = '@ankachaal_difficulty_level';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'VS_BOT' | 'PASS_AND_PLAY'>('VS_BOT');
  const [level, setLevel] = useState<number>(5); // Default level 5: Strategist
  const { stats, loadHistory } = useGameHistory();

  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  // Reload history and level settings whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadSavedSettings = async () => {
        try {
          const savedLevel = await AsyncStorage.getItem(DIFFICULTY_KEY);
          if (savedLevel) {
            setLevel(parseInt(savedLevel, 10));
          }
        } catch (err) {
          console.error('Failed to load level settings:', err);
        }
      };
      loadSavedSettings();
      loadHistory();
    }, [loadHistory])
  );

  const handleStartGame = () => {
    router.push({
      pathname: '/game',
      params: { mode, level },
    });
  };

  const getDifficultyCategory = (lvl: number) => {
    if (lvl <= 3) return { name: 'Easy', color: COLORS.accentBlue };
    if (lvl <= 6) return { name: 'Medium', color: COLORS.accentAmber };
    if (lvl <= 8) return { name: 'Hard', color: '#D946EF' };
    return { name: 'Extreme', color: COLORS.accentPink };
  };

  const cat = getDifficultyCategory(level);

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />
      
      <View style={[
        styles.container, 
        { 
          paddingHorizontal: isShortScreen ? 16 : 24,
          paddingTop: isShortScreen ? 8 : 16,
          paddingBottom: isThreeButton ? 16 : Math.max(insets.bottom, 16)
        }
      ]}>
        
        {/* Top: Premium Logo & Title Emblem */}
        <View style={styles.headerSection}>
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
              style={[styles.logoImage, isShortScreen && { width: 42, height: 42 }]} 
              contentFit="contain"
            />
          </View>
          <Text style={[styles.logoText, isShortScreen && { fontSize: 26, letterSpacing: 2 }]}>ANKA-CHAAL</Text>
          <Text style={[styles.tagline, isShortScreen && { fontSize: 8, marginTop: 3 }]}>8x8 NUMBER-GRID TACTICAL CHESS</Text>
        </View>

        {/* Middle: Game Settings Container Card */}
        <View style={styles.configSection}>
          <View style={[styles.settingsCard, isShortScreen && { padding: 12 }]}>
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

            {/* Level Settings Summary Button or Mode Info */}
            {mode === 'VS_BOT' ? (
              <TouchableOpacity
                style={[styles.configLinkButton, isShortScreen && { height: 44, marginTop: 8 }]}
                onPress={() => router.push('/config')}
                activeOpacity={0.7}
              >
                <View style={styles.configLinkLeft}>
                  <Ionicons name="options-outline" size={18} color={cat.color} />
                  <Text style={[styles.configLinkText, isShortScreen && { fontSize: 12 }]}>
                    AI Difficulty: <Text style={{ color: cat.color }}>{LEVEL_REGISTRY[level]?.name}</Text>
                  </Text>
                </View>
                <View style={styles.configLinkRight}>
                  <Text style={[styles.changeLabel, { color: cat.color }, isShortScreen && { fontSize: 9 }]}>CONFIGURE</Text>
                  <Ionicons name="chevron-forward" size={14} color={cat.color} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.modeInfoBox, isShortScreen && { padding: 8, marginTop: 8 }]}>
                <Ionicons name="information-circle-outline" size={isShortScreen ? 16 : 18} color={COLORS.accentPink} />
                <Text style={[styles.modeInfoText, isShortScreen && { fontSize: 10, lineHeight: 14 }]}>
                  Pass & Play allows two players to play locally on this device. Take turns moving your pieces.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom: Play Action, Stats & Footer Buttons */}
        <View style={styles.actionSection}>
          {/* Play Action Button (Gold Gradient Style) */}
          <TouchableOpacity 
            style={[
              styles.startButton,
              isShortScreen && { height: 48, marginBottom: 12 },
              { backgroundColor: COLORS.accentAmber }
            ]}
            onPress={handleStartGame}
            activeOpacity={0.8}
          >
            <Text style={[styles.startButtonText, isShortScreen && { fontSize: 15 }]}>PLAY GAME</Text>
            <Ionicons name="play-forward" size={isShortScreen ? 16 : 20} color={COLORS.background} />
          </TouchableOpacity>

          {/* Quick Statistics Capsule */}
          {stats && stats.totalGames > 0 ? (
            <View style={[styles.statsBanner, isShortScreen && { padding: 10, marginBottom: 12 }]}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Games</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 13 }]}>{stats.totalGames}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win % vs Bot</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 13 }, { color: COLORS.accentBlue }]}>
                  {stats.winRateVsBot}%
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Moves</Text>
                <Text style={[styles.statVal, isShortScreen && { fontSize: 13 }]}>{stats.avgMoves}</Text>
              </View>
            </View>
          ) : (
            // Balance spacer when stats are not present
            <View style={{ height: isShortScreen ? 0 : 16 }} />
          )}

          {/* Secondary Action Buttons */}
          <View style={[styles.actionButtonsRow, isShortScreen && { gap: 8 }]}>
            <TouchableOpacity 
              style={[styles.actionButton, isShortScreen && { height: 40 }]}
              onPress={() => router.push('/rules')}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={isShortScreen ? 16 : 20} color={COLORS.accentBlue} />
              <Text style={[styles.actionButtonText, isShortScreen && { fontSize: 11 }]}>Rules & Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isShortScreen && { height: 40 }]}
              onPress={() => router.push('/history')}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart" size={isShortScreen ? 16 : 20} color={COLORS.accentBlue} />
              <Text style={[styles.actionButtonText, isShortScreen && { fontSize: 11 }]}>History & Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.3,
  },
  configSection: {
    justifyContent: 'center',
    flex: 1.1,
  },
  actionSection: {
    justifyContent: 'flex-end',
    flex: 1.6,
  },
  logoEmblem: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 2,
    borderColor: COLORS.accentAmber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.accentAmber,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 4,
    textShadowColor: COLORS.glow1 + '80',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accentBlue,
    letterSpacing: 2,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  configLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 12,
  },
  configLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configLinkText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  configLinkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modeInfoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
    marginTop: 12,
  },
  modeInfoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  startButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 1.5,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
});



