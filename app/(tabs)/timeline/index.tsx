import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useTimeline } from '@/hooks/useTimeline';
import { addDays, today } from '@/db/helpers';
import { useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';

export default function TimelineScreen() {
  const router = useRouter();
  const { entries, isLoading, selectedDate, setDate, refresh } = useTimeline();

  const [viewMode, setViewMode] = useState<'daily'|'monthly'>('daily');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timeline</Text>
        <View style={styles.toggleRow}>
          <Pressable 
            style={[styles.toggleBtn, viewMode === 'daily' && styles.toggleActive]} 
            onPress={() => setViewMode('daily')}
          >
            <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>Daily</Text>
          </Pressable>
          <Pressable 
            style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleActive]} 
            onPress={() => setViewMode('monthly')}
          >
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </Pressable>
        </View>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <Pressable onPress={() => setDate(addDays(selectedDate, -1))}>
          <Text style={styles.dateArrow}>←</Text>
        </Pressable>
        <Pressable onPress={() => setDate(today())}>
          <Text style={styles.dateText}>
            {selectedDate === today()
              ? 'Today'
              : new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                  'en-US',
                  { weekday: 'short', month: 'short', day: 'numeric' }
                )}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (selectedDate < today()) setDate(addDays(selectedDate, 1));
          }}
        >
          <Text
            style={[
              styles.dateArrow,
              selectedDate >= today() && styles.disabled,
            ]}
          >
            →
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {viewMode === 'monthly' ? (
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => {
              setDate(day.dateString);
              setViewMode('daily');
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: COLORS.primary }
            }}
            theme={{
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
              textDayFontFamily: 'Inter_400Regular',
              textMonthFontFamily: 'Inter_600SemiBold',
              textDayHeaderFontFamily: 'Inter_500Medium',
            }}
          />
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Loading…</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.mutedText}>No entries for this day</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.log.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.entry}
              onPress={() => router.push(`/streak/${item.streak.id}`)}
            >
              <Text style={styles.entryEmoji}>
                {item.streak.emoji ?? '🔥'}
              </Text>
              <View style={styles.entryInfo}>
                <Text style={styles.entryName}>{item.streak.name}</Text>
                <Text style={styles.entryNote}>
                  {item.log.note ?? item.log.status}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  item.log.status === 'achieved'
                    ? styles.pillAchieved
                    : styles.pillNotAchieved,
                ]}
              >
                <Text style={styles.pillText}>{item.log.status}</Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { ...TYPOGRAPHY.bodyLg, color: COLORS.onSurfaceVariant },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },

  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { ...TYPOGRAPHY.displaySm, color: COLORS.onSurface },
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADII.sm, padding: 4 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADII.sm },
  toggleActive: { backgroundColor: COLORS.surfaceContainerHighest, ...SHADOWS.floating },
  toggleText: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant },
  toggleTextActive: { color: COLORS.primary },

  calendarContainer: { padding: 16, backgroundColor: COLORS.surfaceContainerHighest, margin: 16, borderRadius: RADII.lg },

  dateNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
  },
  dateArrow: { ...TYPOGRAPHY.titleMd, color: COLORS.primary, padding: 8 },
  dateText: { ...TYPOGRAPHY.titleMd, color: COLORS.onSurface },
  disabled: { opacity: 0.3 },

  list: { padding: 16 },
  entry: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADII.md,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryEmoji: { fontSize: 32, marginRight: 16 },
  entryInfo: { flex: 1 },
  entryName: { ...TYPOGRAPHY.titleSm, color: COLORS.onSurface },
  entryNote: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant, marginTop: 4 },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.full,
  },
  pillAchieved: { backgroundColor: COLORS.primaryContainer },
  pillNotAchieved: { backgroundColor: COLORS.tertiaryContainer },
  pillText: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurface, textTransform: 'uppercase' },
});
