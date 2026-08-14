import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVEL_REGISTRY } from '../constants/levels';
import { COLORS } from '../constants/colors';
import HeaderBar from '../components/ui/HeaderBar';
import { Ionicons } from '@expo/vector-icons';

const DIFFICULTY_KEY = '@ankachaal_difficulty_level';

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Plays randomly, frequently blunders. Great for learning the basic rules.',
  2: 'Basic defense and simple movements, but prone to major tactical errors.',
  3: 'Thinks 2 moves ahead. Solid challenge for casual board game players.',
  4: 'Avoids basic traps and starts mounting coordinated grid attacks.',
  5: 'Thinks 3 moves ahead. Plays with balanced positional awareness.',
  6: 'Alert to player mistakes. Thinks 3 moves ahead and plays aggressively.',
  7: 'Formidable opponent. Thinks 4 moves ahead with deep safety checks.',
  8: 'Expert tactical calculations. Blunder rate is extremely low.',
  9: 'Thinks 5 moves ahead. Capable of complex, long-term strategies.',
  10: 'Flawless minimax depth calculations. Zero error rate.',
};

export default function ConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<number>(5);

  const { height: screenHeight } = Dimensions.get('window');
  const isShortScreen = screenHeight < 750;
  const isThreeButton = insets.bottom >= 30;

  // Load saved level on mount
  useEffect(() => {
    const loadLevel = async () => {
      try {
        const saved = await AsyncStorage.getItem(DIFFICULTY_KEY);
        if (saved) {
          setSelectedLevel(parseInt(saved, 10));
        }
      } catch (err) {
        console.error('Failed to load level settings:', err);
      }
    };
    loadLevel();
  }, []);

  const handleSelectLevel = async (level: number) => {
    setSelectedLevel(level);
    try {
      await AsyncStorage.setItem(DIFFICULTY_KEY, level.toString());
    } catch (err) {
      console.error('Failed to save level settings:', err);
    }
  };

  const getDifficultyCategory = (level: number) => {
    if (level <= 3) return { name: 'Easy', color: COLORS.accentBlue };
    if (level <= 6) return { name: 'Medium', color: COLORS.accentAmber };
    if (level <= 8) return { name: 'Hard', color: '#D946EF' }; // Pinkish/Purple
    return { name: 'Extreme', color: COLORS.accentPink };
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />

      <HeaderBar title="AI Difficulty Settings" />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: isThreeButton ? 24 : Math.max(insets.bottom, 16),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionHeading, isShortScreen && { marginVertical: 12 }]}>
          SELECT AI DIFFICULTY
        </Text>

        <View style={styles.listContainer}>
          {Object.values(LEVEL_REGISTRY).map((config) => {
            const isSelected = selectedLevel === config.level;
            const cat = getDifficultyCategory(config.level);
            const desc = LEVEL_DESCRIPTIONS[config.level] || '';

            return (
              <TouchableOpacity
                key={config.level}
                style={[
                  styles.levelCard,
                  isSelected && {
                    borderColor: cat.color,
                    backgroundColor: COLORS.surfaceSecondary,
                    shadowColor: cat.color,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                  }
                ]}
                onPress={() => handleSelectLevel(config.level)}
                activeOpacity={0.7}
              >
                {/* Badge/Level Number */}
                <View style={[styles.badge, { backgroundColor: cat.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: cat.color }]}>
                    {config.level}
                  </Text>
                </View>

                {/* Level Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.row}>
                    <Text style={styles.levelName}>{config.name}</Text>
                    <Text style={[styles.catTag, { color: cat.color }]}>
                      {cat.name.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.descriptionText}>{desc}</Text>
                  <Text style={styles.depthText}>
                    Search depth: {config.depth} {config.depth === 1 ? 'step' : 'steps'} • Error rate: {Math.round(config.blunderRate * 100)}%
                  </Text>
                </View>

                {/* Selected Indicator */}
                <View style={styles.checkContainer}>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={cat.color} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listContainer: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  catTag: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  depthText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  checkContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
