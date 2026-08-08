import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import LevelSelector from '../components/ui/LevelSelector';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

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
            <Image 
              source={require('../../assets/images/game-logo.svg')} 
              style={styles.logoImage} 
              contentFit="contain"
            />
            <Text style={styles.logoText}>ANKA-CHAAL</Text>
            <Text style={styles.tagline}>8x8 NUMBER-GRID TACTICAL CHESS</Text>
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
              <Text style={styles.rulesTitle}>Anka-Chaal: The Dance of Numbers</Text>
              
              <Text style={styles.rulesIntro}>
                Welcome to <Text style={styles.rulesBold}>Anka-Chaal</Text> (meaning "The Move of Numbers") — a fast-paced, high-voltage tactical chess game played on an 8x8 grid. Unlike traditional chess where pieces have fixed movements, in Anka-Chaal, <Text style={styles.rulesBold}>the board itself dictates the speed of your army</Text>!
                {"\n\n"}
                The number displayed inside each piece indicates its current momentum (<Text style={styles.rulesBold}>N</Text>), which changes dynamically as it steps across tiles of values <Text style={styles.rulesBold}>1, 2, or 3</Text>. Land on a 3, and your piece gains speed; land on a 1, and it slows to a tactical crawl.
              </Text>

              <Text style={styles.rulesSectionHeader}>Meet Your Army (6 Pieces Per Side)</Text>
              
              <View style={styles.rulePieceContainer}>
                <Text style={styles.rulesBullet}>
                  <Text style={styles.rulesBold}>• The Rider (Circular Shape • Weight: 3): </Text>
                  The sliding spearhead of your army. Valued at <Text style={styles.rulesBold}>3 points</Text>, the Rider can slide along any of the 8 vectors (orthogonal or diagonal) <Text style={styles.rulesBold}>up to N steps</Text>. It can stop early or land on an enemy to capture them. However, it cannot jump over obstacles and is blocked by any piece in its way.
                </Text>

                <Text style={styles.rulesBullet}>
                  <Text style={styles.rulesBold}>• The Jumper (Octagonal Shape • Weight: 2): </Text>
                  The boundary-breaker! Valued at <Text style={styles.rulesBold}>2 points</Text>, the Jumper moves exactly <Text style={styles.rulesBold}>N steps</Text> either in a Knight-like L-shape (e.g. 2 steps straight and 1 perpendicular when N=3) OR in a straight orthogonal direction. It cannot move diagonally. Because it leaps over obstacles, it ignores intervening pieces, landing directly on its target square to capture.
                </Text>

                <Text style={styles.rulesBullet}>
                  <Text style={styles.rulesBold}>• The Scout (Square Shape • Weight: 1): </Text>
                  The stealthy sentinel. Valued at <Text style={styles.rulesBold}>1 point</Text>, the Scout must travel <Text style={styles.rulesBold}>exactly N steps</Text> along any of the 8 vectors. Unlike the Jumper, the Scout cannot leap; if any piece is in its intermediate path, it is blocked. However, it can capture an opponent occupying its exact destination.
                </Text>
              </View>

              <Text style={styles.rulesSectionHeader}>The Climax: Victory & Tiebreakers</Text>
              <Text style={styles.rulesIntro}>
                Your ultimate goal is to wipe out all 6 of the opponent's pieces. 
                {"\n\n"}
                To keep matches intense and competitive, there is a strict limit of <Text style={styles.rulesBold}>50 moves</Text>. If the game reaches 50 moves, the player with the higher total weightage of remaining pieces on the board wins:
                {"\n"}
                • Rider = 3 points • Jumper = 2 points • Scout = 1 point
                {"\n\n"}
                If both players have the exact same remaining weightage, the game is declared a Draw!
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
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 16,
    borderRadius: 20,
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
  rulesIntro: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  rulesSectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
    paddingBottom: 4,
  },
  rulePieceContainer: {
    marginVertical: 4,
    gap: 4,
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
