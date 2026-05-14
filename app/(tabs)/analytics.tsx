import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useActiveStreak } from '../../src/hooks/use-streak';
import { useAnalytics } from '../../src/hooks/use-analytics';
import { FullHeatmap } from '../../src/components/features/FullHeatmap';
import { StreakHistoryBar } from '../../src/components/features/StreakHistoryBar';
import { WeekdayBarChart } from '../../src/components/features/WeekdayBarChart';
import { RatingSparkline } from '../../src/components/features/RatingSparkline';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { KronCard } from '../../src/components/ui/KronCard';
import { Typography } from '../../src/components/ui/Typography';
import { colors, space } from '../../src/constants/theme';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <KronCard elevated style={styles.statCard}>
      <Typography variant="caption" color={colors.navy}>{label}</Typography>
      <Typography variant="display" color={colors.ink}>{value}</Typography>
      {sub && <Typography variant="caption" color={`${colors.navy}80`}>{sub}</Typography>}
    </KronCard>
  );
}

export default function AnalyticsScreen() {
  const { streak, activeStreakId } = useActiveStreak();
  const analytics = useAnalytics();

  if (!activeStreakId) {
    return (
      <EmptyState
        headline="NO STREAK SELECTED"
        subtext="Select a streak from Home to view analytics."
        actionLabel="GO TO HOME"
        onAction={() => router.push('/(tabs)/' as any)}
      />
    );
  }

  if (!streak || !analytics) {
    return <EmptyState headline="NO ENTRIES YET" subtext="Analytics appear after you start logging." />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statRow}>
        <StatCard
          label="COMPLETION"
          value={`${analytics.completionPercent}%`}
          sub={`${analytics.completedBuckets} OF ${analytics.totalBuckets} WINDOWS`}
        />
        <StatCard label="CONSISTENCY" value={`${analytics.consistencyScore}`} sub="SCORE / 100" />
      </View>
      <FullHeatmap cells={analytics.heatmapData} />
      <StreakHistoryBar runs={analytics.streakHistory} longestStreak={analytics.longestStreak} startDate={streak.startDate} />
      <WeekdayBarChart pattern={analytics.weekdayPattern} />
      {analytics.ratingTrend.length >= 2 && <RatingSparkline data={analytics.ratingTrend} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5], paddingBottom: space[9] },
  statRow: { flexDirection: 'row', gap: space[3], marginBottom: space[5] },
  statCard: { flex: 1 },
});
