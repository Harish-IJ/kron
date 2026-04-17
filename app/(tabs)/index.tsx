import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useStreaks } from '@/hooks/useStreaks';
import { useStreakContext } from '@/contexts/StreakContext';
import { useLoggingContext } from '@/contexts/LoggingContext';
import type { StreakCard } from '@/db/types';

export default function HomeScreen() {
  const router = useRouter();
  const { streaks, isLoading, isRefreshing, isEmpty, refresh } = useStreaks();
  const { openLoggingSheet } = useLoggingContext();

  const handleGlobalLog = () => {
    // Quick log: prioritize the first pending streak, else pick the first active streak
    const targetStreak = streaks.find(s => s.pendingToday)?.streak || streaks[0]?.streak;
    if (targetStreak) {
      openLoggingSheet(targetStreak.id, 'media');
    }
  };

  // === Empty State ===
  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyTitle}>Start your first ritual</Text>
        <Text style={styles.emptySubtext}>
          Begin an intentional sequence of growth
        </Text>
        <Pressable
          style={styles.emptyButton}
          onPress={() => router.push('/create-streak')}
        >
          <Text style={styles.emptyButtonText}>Create Streak</Text>
        </Pressable>
      </View>
    );
  }

  // === Loading State ===
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading rituals…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>The Quiet Ritual</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.push('/create-streak')}
        >
          <MaterialIcons name="add" size={32} color={COLORS.onSurface} />
        </Pressable>
      </View>

      {/* Streak Cards */}
      <FlatList
        data={streaks}
        keyExtractor={(item) => item.streak.id}
        renderItem={({ item }) => (
          <StreakCardItem
            card={item}
            onPress={() => router.push(`/streak/${item.streak.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
      />

      {/* FAB - Adjusted position to clear bottom tabs */}
      <Pressable
        style={styles.fab}
        onPress={handleGlobalLog}
      >
        <MaterialIcons name="camera-alt" size={24} color={COLORS.surfaceContainerHighest} />
        <Text style={styles.fabText}>Log</Text>
      </Pressable>
    </View>
  );
}

// === Streak Card Component ===

function StreakCardItem({
  card,
  onPress,
}: {
  card: StreakCard;
  onPress: () => void;
}) {
  const { streak, todayStatus, weekSummary, pendingToday } = card;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{streak.emoji ?? '🔥'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{streak.name}</Text>
          <Text style={styles.cardStatus}>
            {pendingToday ? 'Pending today' : todayStatus.dayStatus}
          </Text>
        </View>
        <Text style={styles.cardCounter}>{streak.currentStreak}</Text>
      </View>

      {/* Week dots */}
      <View style={styles.weekDots}>
        {weekSummary.map((day) => (
          <View
            key={day.date}
            style={[
              styles.dot,
              day.dayStatus === 'achieved' && styles.dotAchieved,
              day.dayStatus === 'not_achieved' && styles.dotNotAchieved,
              day.dayStatus === 'pending' && styles.dotPending,
              day.dayStatus === 'missed' && styles.dotMissed,
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

// === Styles (skeleton — no polish) ===

import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onSurfaceVariant },

  // Header
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: { ...TYPOGRAPHY.displaySm, color: COLORS.onSurface },
  headerDate: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase' },
  headerButton: {
    padding: 8,
    marginRight: -8,
  },

  // List
  list: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.lg,
    padding: 24, // Added more padding to break the tight grid feel
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardInfo: { flex: 1 },
  cardName: { ...TYPOGRAPHY.titleMd, color: COLORS.onSurface },
  cardStatus: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase' },
  cardCounter: {
    ...TYPOGRAPHY.displayLg,
    color: COLORS.primary,
  },

  // Week dots
  weekDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  dotAchieved: { backgroundColor: COLORS.primary },
  dotNotAchieved: { backgroundColor: COLORS.tertiaryContainer },
  dotPending: { backgroundColor: COLORS.primaryFixedDim },
  dotMissed: { backgroundColor: COLORS.outlineVariant },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 24 },
  emptyTitle: { ...TYPOGRAPHY.displaySm, textAlign: 'center', color: COLORS.onSurface, marginBottom: 8 },
  emptySubtext: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: RADII.full,
    ...SHADOWS.floating,
  },
  emptyButtonText: { ...TYPOGRAPHY.bodyLg, color: COLORS.surfaceContainerHighest, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 96, // Increased from 32 to safely clear the tab bar layout
    right: 24,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: RADII.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.floating,
  },
  fabText: { ...TYPOGRAPHY.bodyLg, color: COLORS.surfaceContainerHighest, fontWeight: '700' },
});
