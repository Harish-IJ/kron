import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useTimeline } from '@/hooks/useTimeline';
import { addDays, today } from '@/db/helpers';
import { useState } from 'react';
import { Calendar } from 'react-native-calendars';

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
              [selectedDate]: { selected: true, selectedColor: PRIMARY }
            }}
            theme={{
              todayTextColor: PRIMARY,
              arrowColor: PRIMARY,
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

const PRIMARY = '#45645E';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mutedText: { color: '#586162', fontSize: 14 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },

  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#2C3435' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#586162' },
  toggleTextActive: { color: PRIMARY },

  calendarContainer: { padding: 16, backgroundColor: '#fff', margin: 16, borderRadius: 12 },

  dateNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
  },
  dateArrow: { fontSize: 20, color: PRIMARY, padding: 8 },
  dateText: { fontSize: 16, fontWeight: '600', color: '#2C3435' },
  disabled: { opacity: 0.3 },

  list: { padding: 16 },
  entry: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryEmoji: { fontSize: 24, marginRight: 12 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '600', color: '#2C3435' },
  entryNote: { fontSize: 12, color: '#586162', marginTop: 2 },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillAchieved: { backgroundColor: '#E8F5E9' },
  pillNotAchieved: { backgroundColor: '#FBE9E7' },
  pillText: { fontSize: 11, fontWeight: '500', color: '#2C3435' },
});
