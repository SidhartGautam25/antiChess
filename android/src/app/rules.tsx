import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/colors';
import HeaderBar from '../components/ui/HeaderBar';
import { Ionicons } from '@expo/vector-icons';

export default function RulesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Rules & Directions" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Intro Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="book-outline" size={48} color={COLORS.accentBlue} style={styles.heroIcon} />
          <Text style={styles.mainTitle}>ANKA-CHAAL</Text>
          <Text style={styles.subtitle}>"The Dance of Numbers"</Text>
          <Text style={styles.introParagraph}>
            Welcome to <Text style={styles.boldText}>Anka-Chaal</Text> (meaning "The Move of Numbers") — a fast-paced, high-voltage tactical chess game played on an 8x8 grid. Unlike traditional chess where pieces have fixed movements, in Anka-Chaal, <Text style={styles.boldText}>the board itself dictates the speed of your army</Text>!
          </Text>
        </View>

        {/* Core Mechanic Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer-outline" size={24} color={COLORS.accentBlue} />
            <Text style={styles.cardTitle}>Dynamic Momentum (N)</Text>
          </View>
          <Text style={styles.cardBody}>
            The number displayed inside each piece indicates its current momentum (<Text style={styles.boldText}>N</Text>), which changes dynamically as it steps across tiles of values <Text style={styles.boldText}>1, 2, or 3</Text>.
            {"\n\n"}
            Land on a <Text style={[styles.boldText, { color: COLORS.accentAmber }]}>3</Text>, and your piece gains speed; land on a <Text style={[styles.boldText, { color: COLORS.accentBlue }]}>1</Text>, and it slows to a tactical crawl. Use this momentum to outsmart and capture your opponent's forces!
          </Text>
        </View>

        {/* The Pieces Section */}
        <Text style={styles.sectionTitle}>Meet Your Army (6 Pieces Per Side)</Text>
        <Text style={styles.sectionSubtitle}>Each piece type has a unique movement style and point weight.</Text>

        {/* Piece 1: Rider */}
        <View style={[styles.card, styles.pieceCard]}>
          <View style={styles.pieceHeaderRow}>
            <View style={styles.pieceIdentity}>
              <View style={[styles.pieceIconBase, styles.riderIcon]}>
                <Text style={styles.pieceLetter}>R</Text>
              </View>
              <View>
                <Text style={styles.pieceName}>The Rider</Text>
                <Text style={styles.pieceTypeTag}>Sliding Spearhead</Text>
              </View>
            </View>
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>Weight: 3</Text>
            </View>
          </View>
          <Text style={styles.pieceDescription}>
            The sliding spearhead of your army. The Rider can slide along any of the 8 vectors (orthogonal or diagonal) <Text style={styles.boldText}>up to N steps</Text>.
            {"\n\n"}
            It can stop early or land on an enemy to capture them. However, it <Text style={styles.boldText}>cannot jump</Text> over obstacles and is blocked by any piece in its way.
          </Text>
        </View>

        {/* Piece 2: Jumper */}
        <View style={[styles.card, styles.pieceCard]}>
          <View style={styles.pieceHeaderRow}>
            <View style={styles.pieceIdentity}>
              <View style={[styles.pieceIconBase, styles.jumperIcon]}>
                <Text style={styles.pieceLetter}>J</Text>
              </View>
              <View>
                <Text style={styles.pieceName}>The Jumper</Text>
                <Text style={styles.pieceTypeTag}>Boundary-Breaker</Text>
              </View>
            </View>
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>Weight: 2</Text>
            </View>
          </View>
          <Text style={styles.pieceDescription}>
            The boundary-breaker! The Jumper moves <Text style={styles.boldText}>exactly N steps</Text> either in a Knight-like L-shape (e.g. 2 steps straight and 1 perpendicular when N=3) OR in a straight orthogonal direction.
            {"\n\n"}
            It <Text style={styles.boldText}>cannot move diagonally</Text> and it has <Text style={styles.boldText}>no obligation to turn</Text> (can go completely straight). Because it leaps over obstacles, it ignores intervening pieces, landing directly on its target square to capture.
          </Text>
        </View>

        {/* Piece 3: Scout */}
        <View style={[styles.card, styles.pieceCard]}>
          <View style={styles.pieceHeaderRow}>
            <View style={styles.pieceIdentity}>
              <View style={[styles.pieceIconBase, styles.scoutIcon]}>
                <Text style={styles.pieceLetter}>S</Text>
              </View>
              <View>
                <Text style={styles.pieceName}>The Scout</Text>
                <Text style={styles.pieceTypeTag}>Stealthy Sentinel</Text>
              </View>
            </View>
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>Weight: 1</Text>
            </View>
          </View>
          <Text style={styles.pieceDescription}>
            The stealthy sentinel. The Scout must travel <Text style={styles.boldText}>exactly N steps</Text> along any of the 8 vectors (orthogonal or diagonal).
            {"\n\n"}
            Unlike the Jumper, the Scout <Text style={styles.boldText}>cannot leap</Text>; if any piece is in its intermediate path, it is blocked. However, it can capture an opponent occupying its exact destination.
          </Text>
        </View>

        {/* Victory & Tiebreakers */}
        <View style={[styles.card, { borderColor: COLORS.accentPink + '40' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={24} color={COLORS.accentPink} />
            <Text style={styles.cardTitle}>Victory Conditions</Text>
          </View>
          <Text style={styles.cardBody}>
            Your ultimate goal is to wipe out all 6 of the opponent's pieces.
            {"\n\n"}
            To keep matches intense and competitive, there is a strict limit of <Text style={styles.boldText}>50 moves</Text>. If the game reaches 50 moves, the player with the higher total weightage of remaining pieces on the board wins:
            {"\n"}
            • <Text style={styles.boldText}>Rider</Text> = 3 points • <Text style={styles.boldText}>Jumper</Text> = 2 points • <Text style={styles.boldText}>Scout</Text> = 1 point
            {"\n\n"}
            If both players have the exact same remaining weightage, the game is declared a <Text style={styles.boldText}>Draw</Text>!
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
  },
  heroIcon: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentBlue,
    marginTop: 4,
    marginBottom: 16,
  },
  introParagraph: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  pieceCard: {
    paddingTop: 14,
  },
  pieceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
    paddingBottom: 12,
    marginBottom: 12,
  },
  pieceIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pieceIconBase: {
    width: 40,
    height: 40,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderIcon: {
    borderRadius: 20,
    borderColor: COLORS.accentBlue,
    backgroundColor: COLORS.accentBlue + '15',
  },
  jumperIcon: {
    borderRadius: 8, // Octagon placeholder
    borderColor: COLORS.accentAmber,
    backgroundColor: COLORS.accentAmber + '15',
    transform: [{ rotate: '22.5deg' }],
  },
  scoutIcon: {
    borderRadius: 6,
    borderColor: COLORS.accentPink,
    backgroundColor: COLORS.accentPink + '15',
  },
  pieceLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  pieceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  pieceTypeTag: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  weightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weightText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  pieceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
