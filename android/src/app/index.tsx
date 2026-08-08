import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import LevelSelector from '../components/ui/LevelSelector';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'VS_BOT' | 'PASS_AND_PLAY'>('VS_BOT');
  const [level, setLevel] = useState<number>(5); // Default is level 5: Strategist
  const [showRules, setShowRules] = useState<boolean>(false);
  const { stats, loadHistory } = useGameHistory();

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Glowing Neon Header / Logo */}
          <View style={styles.header}>
            <Text style={styles.logoText}>VECTORGRID</Text>
            <Text style={styles.tagline}>5x5 VECTOR STRATEGY GAME</Text>
          </View>

          {/* Quick Statistics Banner */}
          {stats && stats.totalGames > 0 && (
            <View style={styles.statsBanner}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Games</Text>
                <Text style={styles.statVal}>{stats.totalGames}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win % vs Bot</Text>
                <Text style={[styles.statVal, { color: COLORS.accentBlue }]}>
                  {stats.winRateVsBot}%
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Moves</Text>
                <Text style={styles.statVal}>{stats.avgMoves}</Text>
              </View>
            </View>
          )}

          {/* Game Mode Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>SELECT GAME MODE</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'VS_BOT' && { borderColor: COLORS.accentBlue, backgroundColor: COLORS.surfaceSecondary }
                ]}
                onPress={() => setMode('VS_BOT')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="hardware-chip-outline" 
                  size={24} 
                  color={mode === 'VS_BOT' ? COLORS.accentBlue : COLORS.textSecondary} 
                />
                <Text style={[styles.modeText, mode === 'VS_BOT' && { color: COLORS.textPrimary }]}>
                  VS AI Bot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'PASS_AND_PLAY' && { borderColor: COLORS.accentPink, backgroundColor: COLORS.surfaceSecondary }
                ]}
                onPress={() => setMode('PASS_AND_PLAY')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="people-outline" 
                  size={24} 
                  color={mode === 'PASS_AND_PLAY' ? COLORS.accentPink : COLORS.textSecondary} 
                />
                <Text style={[styles.modeText, mode === 'PASS_AND_PLAY' && { color: COLORS.textPrimary }]}>
                  Pass & Play
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Level Selector - Only show if VS Bot mode is selected */}
          {mode === 'VS_BOT' ? (
            <View style={styles.levelSelectorContainer}>
              <LevelSelector selectedLevel={level} onSelectLevel={setLevel} />
            </View>
          ) : (
            <View style={styles.modeInfoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.accentPink} />
              <Text style={styles.modeInfoText}>
                Pass & Play allows two players to play locally on this device. Take turns moving your pieces.
              </Text>
            </View>
          )}

          {/* Start Action Button */}
          <TouchableOpacity 
            style={[
              styles.startButton,
              { backgroundColor: mode === 'VS_BOT' ? COLORS.accentBlue : COLORS.accentPink }
            ]}
            onPress={handleStartGame}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>LAUNCH GAME</Text>
            <Ionicons name="play-forward" size={20} color={COLORS.background} />
          </TouchableOpacity>

          {/* Secondary Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowRules(!showRules)}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionButtonText}>Rules & Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/history')}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionButtonText}>History & Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Rules Dropdown Section */}
          {showRules && (
            <View style={styles.rulesBox}>
              <Text style={styles.rulesTitle}>Game Rules & Mechanics</Text>
              
              <Text style={styles.rulesBullet}>
                <Text style={styles.rulesBold}>1. Grid Movement Range: </Text>
                Unlike Chess, pieces move a distance determined by the <Text style={styles.rulesBold}>number on the current tile</Text> where the piece rests (1, 2, or 3), not by the piece type.
              </Text>

              <Text style={styles.rulesBullet}>
                <Text style={styles.rulesBold}>2. Scout (S): </Text>
                Must move <Text style={styles.rulesBold}>exactly N steps</Text> along any of the 8 straight or diagonal vectors. Blocked if another piece is in its intermediate path.
              </Text>

              <Text style={styles.rulesBullet}>
                <Text style={styles.rulesBold}>3. Rider (R): </Text>
                Can move <Text style={styles.rulesBold}>up to N steps</Text> along a chosen vector. Stoppped early if blocked by any piece (can capture enemy piece, but blocked by allies).
              </Text>

              <Text style={styles.rulesBullet}>
                <Text style={styles.rulesBold}>4. Victory: </Text>
                Capture all 3 of the opponent's pieces to win the game!
              </Text>
            </View>
          )}

        </ScrollView>
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 38,
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
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  levelSelectorContainer: {
    height: 280,
    marginBottom: 20,
  },
  modeInfoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginBottom: 24,
  },
  modeInfoText: {
    fontSize: 13,
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
    shadowColor: COLORS.glow1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 1.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rulesBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  rulesBullet: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  rulesBold: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});
