import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { useGameHistory } from '../hooks/useGameHistory';
import HeaderBar from '../components/ui/HeaderBar';
import { LEVEL_REGISTRY } from '../constants/levels';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, stats, isLoading, loadHistory, clearHistory } = useGameHistory();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Format match duration (seconds -> MM:SS or SSs)
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Format timestamp to user friendly relative or absolute date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isVsBot = item.mode === 'VS_BOT';
    const isPlayer1Winner = item.winner === 1;
    
    // Icon styles based on match type
    const matchIcon = isVsBot ? 'hardware-chip-outline' : 'people-outline';
    const outcomeColor = isPlayer1Winner ? COLORS.player1.primary : COLORS.player2.primary;

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardType}>
            <Ionicons name={matchIcon} size={18} color={COLORS.textSecondary} />
            <Text style={styles.cardTypeText}>
              {isVsBot ? `VS Bot (${LEVEL_REGISTRY[item.level]?.name || `Lvl ${item.level}`})` : 'Pass & Play'}
            </Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.outcomeRow}>
            <Text style={styles.outcomeLabel}>Outcome:</Text>
            <Text style={[styles.outcomeValue, { color: outcomeColor }]}>
              {isPlayer1Winner 
                ? (isVsBot ? 'VICTORY' : 'Player 1 Won') 
                : (isVsBot ? 'DEFEAT' : 'Player 2 Won')}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.cardStat}>
              <Ionicons name="footsteps-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.cardStatText}>{item.movesCount} Moves</Text>
            </View>
            <View style={styles.cardStat}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.cardStatText}>{formatDuration(item.duration)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderStatsDashboard = () => {
    if (!stats || stats.totalGames === 0) return null;

    return (
      <View style={styles.dashboard}>
        {/* Main Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>TOTAL GAMES</Text>
            <Text style={styles.statCardValue}>{stats.totalGames}</Text>
            <Text style={styles.statCardSub}>
              {stats.vsBotGames} Bot • {stats.passAndPlayGames} Local
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>WIN RATE VS BOT</Text>
            <Text style={[styles.statCardValue, { color: COLORS.accentBlue }]}>
              {stats.winRateVsBot}%
            </Text>
            <Text style={styles.statCardSub}>
              {stats.playerWinsVsBot} Wins / {stats.vsBotGames} Plays
            </Text>
          </View>
        </View>

        {/* Secondary averages card */}
        <View style={styles.averagesCard}>
          <View style={styles.averageItem}>
            <Text style={styles.avgLabel}>Avg Moves / Match</Text>
            <Text style={styles.avgValue}>{stats.avgMoves}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.averageItem}>
            <Text style={styles.avgLabel}>Avg Match Duration</Text>
            <Text style={styles.avgValue}>{formatDuration(stats.avgDuration)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Match History & Stats" />

      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={72} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No Matches Logged</Text>
            <Text style={styles.emptyText}>
              Play a match against the AI Bot or local Pass & Play to view your stats here!
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.replace('/')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>GO TO MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderStatsDashboard()}
            ListFooterComponent={
              <TouchableOpacity 
                style={styles.clearBtn} 
                onPress={clearHistory}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.accentPink} />
                <Text style={styles.clearBtnText}>CLEAR HISTORY & STATS</Text>
              </TouchableOpacity>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  dashboard: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 6,
  },
  statCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  averagesCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  avgValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTypeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outcomeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  outcomeValue: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.accentPink + '40',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.accentPink,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    height: 48,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
});
