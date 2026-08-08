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
      
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
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
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
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
              
              <View style={styles.textContainer}>
                <Text style={styles.levelName}>{config.name}</Text>
                <Text style={styles.subtext}>
                  Depth: {config.depth} • Blunder: {Math.round(config.blunderRate * 100)}%
                </Text>
              </View>
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
    flex: 1,
  },
  heading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  grid: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    marginLeft: 14,
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
