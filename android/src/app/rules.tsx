import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import HeaderBar from '../components/ui/HeaderBar';
import { Ionicons } from '@expo/vector-icons';

export default function RulesScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />

      <HeaderBar title="Rules & Directions" />
      
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: isThreeButton ? 24 : Math.max(insets.bottom, 16),
            paddingHorizontal: isShortScreen ? 12 : 16,
            paddingTop: isShortScreen ? 12 : 16,
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Intro Hero Section */}
        <View style={[styles.heroSection, isShortScreen && { marginBottom: 12, paddingVertical: 8 }]}>
          <Ionicons 
            name="book-outline" 
            size={isShortScreen ? 36 : 48} 
            color={COLORS.accentBlue} 
            style={[styles.heroIcon, isShortScreen && { marginBottom: 8 }]} 
          />
          <Text style={[styles.mainTitle, isShortScreen && { fontSize: 22 }]}>ANKA-CHAAL</Text>
          <Text style={[styles.subtitle, isShortScreen && { fontSize: 12, marginBottom: 8 }]}>"The Dance of Numbers"</Text>
          <Text style={[styles.introParagraph, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            Welcome to <Text style={styles.boldText}>Anka-Chaal</Text> (meaning "The Move of Numbers") — a fast-paced, high-voltage tactical chess game played on an 8x8 grid. Unlike traditional chess where pieces have fixed movements, in Anka-Chaal, <Text style={styles.boldText}>the board itself dictates the speed of your army</Text>!
          </Text>
        </View>

        {/* Core Mechanic Card */}
        <View style={[styles.card, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer-outline" size={isShortScreen ? 20 : 24} color={COLORS.accentBlue} />
            <Text style={[styles.cardTitle, isShortScreen && { fontSize: 14 }]}>Dynamic Momentum (N)</Text>
          </View>
          <Text style={[styles.cardBody, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            The number displayed inside each piece indicates its current momentum (<Text style={styles.boldText}>N</Text>), which changes dynamically as it steps across tiles of values <Text style={styles.boldText}>1, 2, or 3</Text>.
            {"\n\n"}
            Land on a <Text style={[styles.boldText, { color: COLORS.accentAmber }]}>3</Text>, and your piece gains speed; land on a <Text style={[styles.boldText, { color: COLORS.accentBlue }]}>1</Text>, and it slows to a tactical crawl. Use this momentum to outsmart and capture your opponent's forces!
          </Text>
        </View>

        {/* The Pieces Section */}
        <Text style={[styles.sectionTitle, isShortScreen && { fontSize: 16, marginTop: 4, marginBottom: 2 }]}>Meet Your Army (8 Pieces Per Side)</Text>
        <Text style={[styles.sectionSubtitle, isShortScreen && { fontSize: 11, marginBottom: 8 }]}>Each piece type has a unique movement style and point weight.</Text>

        {/* Piece 1: Rider */}
        <View style={[styles.card, styles.pieceCard, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={[styles.pieceHeaderRow, isShortScreen && { paddingBottom: 8, marginBottom: 8 }]}>
            <View style={styles.pieceIdentity}>
              <View style={[
                styles.pieceIconBase, 
                styles.riderIcon,
                isShortScreen && { width: 30, height: 30 }
              ]}>
                <Text style={[styles.pieceLetter, isShortScreen && { fontSize: 14 }]}>R</Text>
              </View>
              <View>
                <Text style={[styles.pieceName, isShortScreen && { fontSize: 14 }]}>The Rider</Text>
                <Text style={[styles.pieceTypeTag, isShortScreen && { fontSize: 11 }]}>Sliding Spearhead</Text>
              </View>
            </View>
            <View style={[styles.weightBadge, isShortScreen && { paddingVertical: 2, paddingHorizontal: 8 }]}>
              <Text style={[styles.weightText, isShortScreen && { fontSize: 11 }]}>Weight: 3</Text>
            </View>
          </View>
          <Text style={[styles.pieceDescription, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            The sliding spearhead of your army. The Rider can slide along any of the 8 vectors (orthogonal or diagonal) <Text style={styles.boldText}>up to N steps</Text>.
            {"\n\n"}
            It can stop early or land on an enemy to capture them. However, it <Text style={styles.boldText}>cannot jump</Text> over obstacles and is blocked by any piece in its way.
          </Text>
        </View>

        {/* Piece 2: Jumper */}
        <View style={[styles.card, styles.pieceCard, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={[styles.pieceHeaderRow, isShortScreen && { paddingBottom: 8, marginBottom: 8 }]}>
            <View style={styles.pieceIdentity}>
              <View style={[
                styles.pieceIconBase, 
                styles.jumperIcon,
                isShortScreen && { width: 30, height: 30 }
              ]}>
                <Text style={[styles.pieceLetter, isShortScreen && { fontSize: 14 }]}>J</Text>
              </View>
              <View>
                <Text style={[styles.pieceName, isShortScreen && { fontSize: 14 }]}>The Jumper</Text>
                <Text style={[styles.pieceTypeTag, isShortScreen && { fontSize: 11 }]}>Boundary-Breaker</Text>
              </View>
            </View>
            <View style={[styles.weightBadge, isShortScreen && { paddingVertical: 2, paddingHorizontal: 8 }]}>
              <Text style={[styles.weightText, isShortScreen && { fontSize: 11 }]}>Weight: 2</Text>
            </View>
          </View>
          <Text style={[styles.pieceDescription, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            The boundary-breaker! The Jumper moves <Text style={styles.boldText}>exactly N steps</Text> either in a Knight-like L-shape (e.g. 2 steps straight and 1 perpendicular when N=3) OR in a straight orthogonal direction.
            {"\n\n"}
            It <Text style={styles.boldText}>cannot move diagonally</Text> and it has <Text style={styles.boldText}>no obligation to turn</Text> (can go completely straight). Because it leaps over obstacles, it ignores intervening pieces, landing directly on its target square to capture.
          </Text>
        </View>

        {/* Piece 3: Scout */}
        <View style={[styles.card, styles.pieceCard, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={[styles.pieceHeaderRow, isShortScreen && { paddingBottom: 8, marginBottom: 8 }]}>
            <View style={styles.pieceIdentity}>
              <View style={[
                styles.pieceIconBase, 
                styles.scoutIcon,
                isShortScreen && { width: 30, height: 30 }
              ]}>
                <Text style={[styles.pieceLetter, isShortScreen && { fontSize: 14 }]}>S</Text>
              </View>
              <View>
                <Text style={[styles.pieceName, isShortScreen && { fontSize: 14 }]}>The Scout</Text>
                <Text style={[styles.pieceTypeTag, isShortScreen && { fontSize: 11 }]}>Stealthy Sentinel</Text>
              </View>
            </View>
            <View style={[styles.weightBadge, isShortScreen && { paddingVertical: 2, paddingHorizontal: 8 }]}>
              <Text style={[styles.weightText, isShortScreen && { fontSize: 11 }]}>Weight: 1</Text>
            </View>
          </View>
          <Text style={[styles.pieceDescription, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            The stealthy sentinel. The Scout must travel <Text style={styles.boldText}>exactly N steps</Text> along any of the 8 vectors (orthogonal or diagonal).
            {"\n\n"}
            Unlike the Jumper, the Scout <Text style={styles.boldText}>cannot leap</Text>; if any piece is in its intermediate path, it is blocked. However, it can capture an opponent occupying its exact destination.
          </Text>
        </View>

        {/* Piece 4: Infiltrator (Ghost) */}
        <View style={[styles.card, styles.pieceCard, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={[styles.pieceHeaderRow, isShortScreen && { paddingBottom: 8, marginBottom: 8 }]}>
            <View style={styles.pieceIdentity}>
              <View style={[
                styles.pieceIconBase, 
                styles.infiltratorIcon,
                isShortScreen && { width: 30, height: 30 }
              ]}>
                <Text style={[styles.pieceLetter, isShortScreen && { fontSize: 14 }]}>I</Text>
              </View>
              <View>
                <Text style={[styles.pieceName, isShortScreen && { fontSize: 14 }]}>The Infiltrator (Ghost)</Text>
                <Text style={[styles.pieceTypeTag, isShortScreen && { fontSize: 11 }]}>Unpredictable Specter</Text>
              </View>
            </View>
            <View style={[styles.weightBadge, isShortScreen && { paddingVertical: 2, paddingHorizontal: 8 }]}>
              <Text style={[styles.weightText, isShortScreen && { fontSize: 11 }]}>Weight: 4</Text>
            </View>
          </View>
          <Text style={[styles.pieceDescription, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            The unpredictable specter! The Infiltrator (Ghost) slides along any of the 8 vectors (orthogonal or diagonal) <Text style={styles.boldText}>up to 4 - N steps</Text>.
            {"\n\n"}
            Because its maximum steps are inverted relative to momentum (<Text style={styles.boldText}>4 - N</Text>), it moves faster on slow tiles (3 steps on 1s) and slower on fast tiles (1 step on 3s). It cannot jump and is blocked by intervening pieces.
          </Text>
        </View>

        {/* Victory & Tiebreakers */}
        <View style={[styles.card, { borderColor: COLORS.accentPink + '40' }, isShortScreen && { padding: 12, marginBottom: 12 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={isShortScreen ? 20 : 24} color={COLORS.accentPink} />
            <Text style={[styles.cardTitle, isShortScreen && { fontSize: 14 }]}>Victory Conditions</Text>
          </View>
          <Text style={[styles.cardBody, isShortScreen && { fontSize: 12, lineHeight: 18 }]}>
            Your ultimate goal is to wipe out all 8 of the opponent's pieces.
            {"\n\n"}
            To keep matches intense and competitive, there is a strict limit of <Text style={styles.boldText}>50 moves</Text>. If the game reaches 50 moves, the player with the higher total weightage of remaining pieces on the board wins:
            {"\n"}
            • <Text style={styles.boldText}>Infiltrator</Text> = 4 points • <Text style={styles.boldText}>Rider</Text> = 3 points • <Text style={styles.boldText}>Jumper</Text> = 2 points • <Text style={styles.boldText}>Scout</Text> = 1 point
            {"\n\n"}
            If both players have the exact same remaining weightage, the game is declared a <Text style={styles.boldText}>Draw</Text>!
          </Text>
        </View>

      </ScrollView>
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
  scrollContent: {
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
  infiltratorIcon: {
    borderRadius: 20,
    borderColor: COLORS.accentPurple,
    backgroundColor: COLORS.accentPurple + '15',
    borderStyle: 'dashed',
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

