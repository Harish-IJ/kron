import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { useStreaks } from '@/hooks/useStreaks';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';

export default function AnalyticsScreen() {
  const { streaks, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  // Aggregate active days globally across all streaks for a simple heatmap
  // Real heatmap requires deeper querying, doing naive implementation by showing activity marks.
  const markedDates: any = {};
  streaks.forEach((item) => {
    item.weekSummary.forEach(day => {
      if (day.dayStatus === 'achieved') {
         markedDates[day.date] = { marked: true, dotColor: COLORS.primary };
      }
    });
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streaks.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {streaks.reduce(
                (max, s) => Math.max(max, s.streak.currentStreak),
                0
              )}
            </Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {streaks.filter((s) => s.pendingToday).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Per-streak stats */}
        {streaks.map((card) => (
          <View key={card.streak.id} style={styles.streakStat}>
            <Text style={styles.statEmoji}>{card.streak.emoji ?? '🔥'}</Text>
            <View style={styles.statInfo}>
              <Text style={styles.statName}>{card.streak.name}</Text>
              <Text style={styles.statDetail}>
                {card.streak.currentStreak} current · {card.streak.longestStreak}{' '}
                longest · {card.streak.totalAchieved} total
              </Text>
            </View>
          </View>
        ))}

        {/* Calendar heatmap */}
        <View style={styles.placeholder}>
          <Text style={styles.sectionTitle}>Global Activity Heatmap</Text>
          <Calendar
            markedDates={markedDates}
            theme={{
              arrowColor: COLORS.primary,
              todayTextColor: COLORS.primary,
              dotColor: COLORS.primary,
              textDayFontFamily: 'Inter_400Regular',
              textMonthFontFamily: 'Inter_600SemiBold',
              textDayHeaderFontFamily: 'Inter_500Medium',
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onSurfaceVariant },

  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { ...TYPOGRAPHY.displaySm, color: COLORS.onSurface },

  content: { padding: 16, paddingBottom: 100 },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.lg,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { ...TYPOGRAPHY.displaySm, color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase' },

  streakStat: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.md,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: { fontSize: 32, marginRight: 16 },
  statInfo: { flex: 1 },
  statName: { ...TYPOGRAPHY.titleMd, color: COLORS.onSurface },
  statDetail: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant, marginTop: 4 },

  placeholder: {
    marginTop: 24,
    padding: 24,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.titleSm,
    color: COLORS.onSurface,
    marginBottom: 16,
  }
});
