import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useStreak } from '../../src/hooks/use-streak';
import { useAnalytics } from '../../src/hooks/use-analytics';
import { HeroStreakCard } from '../../src/components/features/HeroStreakCard';
import { DeadlineCard } from '../../src/components/features/DeadlineCard';
import { MiniHeatmap } from '../../src/components/features/MiniHeatmap';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { colors, space } from '../../src/constants/theme';

export default function HomeScreen() {
  const { streak, streakState, isLoading } = useStreak();
  const analytics = useAnalytics();

  if (isLoading) return null;

  if (!streak || !streakState) {
    return (
      <EmptyState
        headline="NO STREAK"
        subtext="Configure your practice in Settings."
        actionLabel="GO TO SETTINGS"
        onAction={() => router.push('/(tabs)/settings')}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HeroStreakCard streak={streak} streakState={streakState} />
      <DeadlineCard streakState={streakState} />
      {analytics && <MiniHeatmap cells={analytics.heatmapData} />}
      <PrimaryButton label="LOG TODAY" onPress={() => router.push('/log/new')} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5], paddingBottom: space[9] },
  cta: { marginTop: space[2] },
});
