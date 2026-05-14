import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { KronCard } from '../ui/KronCard';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';
import type { Streak, StreakState } from '../../domain/types';

interface HeroStreakCardProps {
  streak: Streak;
  streakState: StreakState;
}

function intervalLabel(streak: Streak): string {
  switch (streak.intervalType) {
    case 'daily': return 'DAILY';
    case 'weekly':
    case 'weekly_on_days': return 'WEEKLY';
    case 'monthly_on_dates': return 'MONTHLY';
    default: return `EVERY ${streak.intervalDays} DAYS`;
  }
}

export function HeroStreakCard({ streak, streakState }: HeroStreakCardProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: streakState.currentStreak,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [streakState.currentStreak, animValue]);

  const isSatisfied = streakState.isCurrentBucketSatisfied;

  return (
    <KronCard padding={20} style={styles.card}>
      <View style={styles.topRow}>
        <Typography variant="label" color={colors.navy}>{streak.title.toUpperCase()}</Typography>
        <View style={[styles.pill, isSatisfied ? styles.pillDone : styles.pillOpen]}>
          <Typography variant="caption" color={colors.base}>{isSatisfied ? '✓ LOGGED' : 'OPEN'}</Typography>
        </View>
      </View>
      <Animated.Text style={styles.heroNumber}>
        {animValue.interpolate({ inputRange: [0, Math.max(1, streakState.currentStreak)], outputRange: ['0', String(streakState.currentStreak)] })}
      </Animated.Text>
      <Typography variant="caption" color={colors.navy} style={styles.sub}>DAY STREAK</Typography>
      <View style={styles.bottomRow}>
        <Typography variant="caption" color={`${colors.navy}99`}>SINCE {streak.startDate}</Typography>
        <Typography variant="caption" color={colors.navy}>{intervalLabel(streak)}</Typography>
      </View>
    </KronCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space[3] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[3] },
  heroNumber: { fontFamily: 'Inter-Black', fontSize: 72, fontWeight: '900', letterSpacing: -2, color: colors.orange, lineHeight: 80 },
  sub: { marginTop: 2, marginBottom: space[3] },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0 },
  pillDone: { backgroundColor: colors.orange },
  pillOpen: { backgroundColor: colors.navy },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2] },
});
