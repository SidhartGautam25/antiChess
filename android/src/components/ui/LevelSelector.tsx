import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LEVEL_REGISTRY } from '../../constants/levels';
import { COLORS } from '../../constants/colors';

interface LevelSelectorProps {
  selectedLevel: number;
  onSelectLevel: (level: number) => void;
}

export default function LevelSelector({ selectedLevel, onSelectLevel }: LevelSelectorProps) {
  // Helper to determine difficulty category color
  const getDifficultyColor = (level: number) => {
    if (level <= 3) return COLORS.accentBlue; // Easy
    if (level <= 6) return COLORS.accentAmber; // Medium
    if (level <= 8) return '#D946EF'; // Hard
    return COLORS.accentPink; // Extreme (Champion/Grandmaster)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>AI DIFFICULTY LEVEL</Text>
      
      <ScrollView 
        horizontal 
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.horizontalList}
      >
        {Object.values(LEVEL_REGISTRY).map((config) => {
          const isSelected = selectedLevel === config.level;
          const diffColor = getDifficultyColor(config.level);
          
          return (
            <TouchableOpacity
              key={config.level}
              style={[
                styles.card,
                isSelected && { 
                  borderColor: diffColor, 
                  backgroundColor: COLORS.surfaceSecondary,
                  shadowColor: diffColor,
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 8,
                }
              ]}
              onPress={() => onSelectLevel(config.level)}
              activeOpacity={0.7}
            >
              <View style={[styles.badge, { backgroundColor: diffColor + '20' }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>
                  {config.level}
                </Text>
              </View>
              
              <Text style={styles.levelName} numberOfLines={1}>{config.name}</Text>
              <Text style={[styles.difficultyText, { color: diffColor }]}>
                {config.level <= 3 ? 'Easy' : config.level <= 6 ? 'Medium' : config.level <= 8 ? 'Hard' : 'Extreme'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  horizontalList: {
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  card: {
    width: 110,
    height: 125,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
