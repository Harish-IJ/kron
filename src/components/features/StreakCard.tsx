import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import type { Streak, StreakState } from '../../domain/types';
import { Typography } from '../ui/Typography';
import { colors, space, borders, shadows } from '../../constants/theme';

interface StreakCardProps {
  streak: Streak;
  streakState: StreakState;
  onPress: () => void;
}

export function StreakCard({ streak, streakState, onPress }: StreakCardProps) {
  const statusLabel = streakState.isCurrentBucketSatisfied ? 'DONE' : 'DUE TODAY';
  const statusColor = streakState.isCurrentBucketSatisfied ? colors.navy : colors.orange;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${streak.title}, ${streakState.currentStreak} day streak, ${statusLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Typography variant="caption" color={colors.navy} style={styles.title}>
          {streak.title.toUpperCase()}
        </Typography>
        <Typography variant="caption" color={statusColor} style={styles.status}>
          {statusLabel}
        </Typography>
      </View>
      <View style={styles.right}>
        <Typography variant="display" color={colors.ink}>
          {streakState.currentStreak}
        </Typography>
        <Typography variant="caption" color={colors.navy}>STREAK</Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space[5],
    backgroundColor: colors.base,
    borderWidth: borders.card.borderWidth,
    borderColor: borders.card.borderColor,
    marginBottom: space[3],
    ...shadows.card,
  },
  pressed: { opacity: 0.8 },
  left: { flex: 1 },
  right: { alignItems: 'flex-end', minWidth: 64 },
  title: { marginBottom: space[1] },
  status: {},
});
