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

import { useStreaks } from '@/hooks/useStreaks';
import { useStreakContext } from '@/contexts/StreakContext';
import type { StreakCard } from '@/db/types';

export default function HomeScreen() {
  const router = useRouter();
  const { streaks, isLoading, isRefreshing, isEmpty, refresh } = useStreaks();

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
        <Text style={styles.headerTitle}>The Quiet Ritual</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
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

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/create-streak')}
      >
        <Text style={styles.fabText}>+</Text>
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

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#586162', fontSize: 16 },

  // Header
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2C3435' },
  headerDate: { fontSize: 14, color: '#586162', marginTop: 4 },

  // List
  list: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardEmoji: { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#2C3435' },
  cardStatus: { fontSize: 12, color: '#586162', marginTop: 2 },
  cardCounter: {
    fontSize: 32,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Week dots
  weekDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  dotAchieved: { backgroundColor: PRIMARY },
  dotNotAchieved: { backgroundColor: '#D68C7A' },
  dotPending: { backgroundColor: '#B9DCD3' },
  dotMissed: { backgroundColor: '#E0E0E0' },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#2C3435' },
  emptySubtext: {
    fontSize: 14,
    color: '#586162',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
});
