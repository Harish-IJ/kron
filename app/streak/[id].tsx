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
import { useLoggingContext } from '@/contexts/LoggingContext';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';
import * as streakService from '@/services/streakService';

export default function StreakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh: refreshDashboard } = useStreakContext();
  const { openLoggingSheet } = useLoggingContext();
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

  const handleLogProof = () => {
    openLoggingSheet(streak.id, streak.proofType);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 32, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onSurfaceVariant },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32 },
  heroEmoji: { fontSize: 56, marginBottom: 12 },
  heroCounter: { ...TYPOGRAPHY.displayLg, color: COLORS.primary },
  heroLabel: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: -8, textTransform: 'uppercase' },
  heroName: { ...TYPOGRAPHY.titleMd, color: COLORS.onSurface, marginTop: 16 },
  heroDesc: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center' },

  // Week dots
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  dotCol: { alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: RADII.full, backgroundColor: COLORS.surfaceContainerLow },
  dotAchieved: { backgroundColor: COLORS.primary },
  dotNotAchieved: { backgroundColor: COLORS.tertiaryContainer },
  dotPending: { backgroundColor: COLORS.primaryFixedDim },
  dotLabel: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant },

  // Stats
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.lg,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { ...TYPOGRAPHY.displaySm, color: COLORS.primary },
  statLabel: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase' },

  // Actions
  actions: { marginBottom: 32 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: RADII.full,
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.floating,
  },
  primaryButtonText: { ...TYPOGRAPHY.bodyLg, color: COLORS.surfaceContainerHighest, fontWeight: '600' },
  secondaryActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  secondaryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceContainerHighest, // Slightly elevated from background
    paddingVertical: 14,
    borderRadius: RADII.full,
    alignItems: 'center',
  },
  secondaryButtonText: { ...TYPOGRAPHY.bodySm, fontWeight: '500', color: COLORS.onSurfaceVariant },

  // Info
  infoSection: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.lg,
    padding: 24,
  },
  infoRow: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant, marginBottom: 8 },
});
