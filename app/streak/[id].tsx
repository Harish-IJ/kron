import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useStreak } from '@/hooks/useStreak';
import { useStreakContext } from '@/contexts/StreakContext';
import * as streakService from '@/services/streakService';

export default function StreakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh: refreshDashboard } = useStreakContext();
  const { streak, card, analytics, isLoading, error, refresh } = useStreak(
    id!
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  if (error || !streak) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>{error ?? 'Streak not found'}</Text>
      </View>
    );
  }

  const handleLogProof = async () => {
    // Phase 6: bottom sheet. For now, quick-log with achieved status.
    try {
      await streakService.createLog({
        streakId: streak.id,
        status: 'achieved',
        note: 'Quick log from detail screen',
      });
      await refresh();
      await refreshDashboard();
      Alert.alert('Logged ✅');
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to log'
      );
    }
  };

  const handlePause = async () => {
    if (streak.status === 'paused') {
      await streakService.resumeStreak(streak.id);
    } else {
      await streakService.pauseStreak(streak.id);
    }
    await refresh();
    await refreshDashboard();
  };

  const handleArchive = () => {
    Alert.alert('Archive Streak', 'This will hide the streak from your dashboard.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await streakService.archiveStreak(streak.id);
          await refreshDashboard();
          router.back();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Streak', 'This will permanently delete all data for this streak.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await streakService.deleteStreak(streak.id);
          await refreshDashboard();
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{streak.emoji ?? '🔥'}</Text>
        <Text style={styles.heroCounter}>{streak.currentStreak}</Text>
        <Text style={styles.heroLabel}>day streak</Text>
        <Text style={styles.heroName}>{streak.name}</Text>
        {streak.description && (
          <Text style={styles.heroDesc}>{streak.description}</Text>
        )}
      </View>

      {/* Week dots */}
      {card && (
        <View style={styles.weekDots}>
          {card.weekSummary.map((day) => (
            <View key={day.date} style={styles.dotCol}>
              <View
                style={[
                  styles.dot,
                  day.dayStatus === 'achieved' && styles.dotAchieved,
                  day.dayStatus === 'not_achieved' && styles.dotNotAchieved,
                  day.dayStatus === 'pending' && styles.dotPending,
                ]}
              />
              <Text style={styles.dotLabel}>
                {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'narrow',
                })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats */}
      {analytics && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.totalAchieved}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics.completionRate}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleLogProof}>
          <Text style={styles.primaryButtonText}>Log Proof</Text>
        </Pressable>

        <View style={styles.secondaryActions}>
          <Pressable style={styles.secondaryButton} onPress={handlePause}>
            <Text style={styles.secondaryButtonText}>
              {streak.status === 'paused' ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push(`/edit-streak/${streak.id}`)}
          >
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleArchive}>
            <Text style={styles.secondaryButtonText}>Archive</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleDelete}>
            <Text style={[styles.secondaryButtonText, { color: '#D32F2F' }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoRow}>
          Schedule: {streak.scheduleType}
        </Text>
        <Text style={styles.infoRow}>
          Proof: {streak.proofType}
        </Text>
        <Text style={styles.infoRow}>
          Started: {streak.startDate}
        </Text>
        {streak.targetDays && (
          <Text style={styles.infoRow}>
            Target: {streak.targetDays} days
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  content: { padding: 24, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { color: '#586162', fontSize: 14 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroCounter: { fontSize: 56, fontWeight: '700', color: PRIMARY },
  heroLabel: { fontSize: 14, color: '#586162', marginTop: -4 },
  heroName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3435',
    marginTop: 12,
  },
  heroDesc: { fontSize: 14, color: '#586162', marginTop: 4, textAlign: 'center' },

  // Week dots
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dotCol: { alignItems: 'center', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' },
  dotAchieved: { backgroundColor: PRIMARY },
  dotNotAchieved: { backgroundColor: '#D68C7A' },
  dotPending: { backgroundColor: '#B9DCD3' },
  dotLabel: { fontSize: 10, color: '#586162' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: PRIMARY },
  statLabel: { fontSize: 11, color: '#586162', marginTop: 4 },

  // Actions
  actions: { marginBottom: 24 },
  primaryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryActions: { flexDirection: 'row', gap: 8 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '500', color: '#586162' },

  // Info
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: { fontSize: 14, color: '#586162', marginBottom: 6 },
});
