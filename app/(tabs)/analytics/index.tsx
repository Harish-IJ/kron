import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { useStreaks } from '@/hooks/useStreaks';

export default function AnalyticsScreen() {
  const { streaks, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

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

        {/* Placeholder for calendar heatmap */}
        <View style={styles.placeholder}>
          <Text style={styles.mutedText}>📊 Calendar heatmap coming in Phase 6</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { color: '#586162', fontSize: 14 },

  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2C3435' },

  content: { padding: 16, paddingBottom: 100 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#586162', marginTop: 4 },

  streakStat: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: { fontSize: 24, marginRight: 12 },
  statInfo: { flex: 1 },
  statName: { fontSize: 14, fontWeight: '600', color: '#2C3435' },
  statDetail: { fontSize: 12, color: '#586162', marginTop: 2 },

  placeholder: {
    marginTop: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});
