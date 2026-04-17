import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import * as streakService from '@/services/streakService';
import { useStreakContext } from '@/contexts/StreakContext';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII } from '@/constants/theme';
import type { ScheduleType, ProofType, VisualizationType } from '@/db/types';

// Theming overrides for user-selected colors instead of default ones
const USER_COLORS = ['#45645E', '#7BA1B0', '#D68C7A', '#3F6472', '#8B7355', '#6B5B73'];
const EMOJIS = ['🏃', '✍️', '🧘', '💧', '📚', '🎨', '🎵', '💪', '🧠', '🌱'];

export default function CreateStreakScreen() {
  const router = useRouter();
  const { refresh, setCreating } = useStreakContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [color, setColor] = useState(USER_COLORS[0]);
  
  // Frequency State
  const [freqMode, setFreqMode] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sun, 1=Mon...
  const [intervalDays, setIntervalDays] = useState('2');
  
  // Time State
  const [timeMode, setTimeMode] = useState<'all_day' | 'time'>('all_day');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('');
  
  // Proof State
  const [proofType, setProofType] = useState<ProofType>('media');
  
  // Reminder State
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  
  const REMINDER_OPTS = ['On time', '5 min before', '10 min before', '15 min before', '30 min before'];
  const WEEKDAYS = [{l:'S',v:0},{l:'M',v:1},{l:'T',v:2},{l:'W',v:3},{l:'T',v:4},{l:'F',v:5},{l:'S',v:6}];

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleReminder = (opt: string) => {
    setSelectedReminders(prev => prev.includes(opt) ? prev.filter(r => r !== opt) : [...prev, opt]);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your ritual a name.');
      return;
    }

    setCreating(true);
    try {
      // Map front-end state to strictly typed db limits
      let finalScheduleType: ScheduleType = 'daily';
      if (freqMode === 'weekly') finalScheduleType = 'weekdays';
      if (freqMode === 'custom') finalScheduleType = 'interval';
      
      await streakService.createStreak({
        name: name.trim(),
        description: description.trim() || undefined,
        emoji,
        color,
        scheduleType: finalScheduleType,
        proofType,
        visualizationType: 'counter_dots',
      });

      await refresh();
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create streak'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surfaceContainerHighest }}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>The Quiet Ritual</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Hero Moment */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>New Ritual</Text>
          <Text style={styles.subtitle}>Begin an intentional sequence of growth</Text>
        </View>

        <View style={styles.formSection}>
          {/* Streak Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Streak Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Morning Meditation"
                placeholderTextColor={COLORS.outlineVariant}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Context (Optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Why does this matter?"
                placeholderTextColor={COLORS.outlineVariant}
                multiline
              />
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.gridRow}>
              {(['daily', 'weekly', 'custom'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.gridBtn, freqMode === s && styles.gridBtnActive]}
                  onPress={() => setFreqMode(s)}
                >
                  <MaterialIcons 
                    name={s === 'daily' ? 'calendar-today' : s === 'weekly' ? 'date-range' : 'event-repeat'} 
                    size={24} 
                    color={freqMode === s ? '#fff' : COLORS.onSurfaceVariant} 
                    style={{ marginBottom: 8 }} 
                  />
                  <Text style={[styles.gridBtnText, freqMode === s && styles.gridBtnTextActive]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Conditional Frequency Sub-inputs */}
            {freqMode === 'weekly' && (
              <View style={styles.subInputContainer}>
                <View style={styles.weekDaysRow}>
                  {WEEKDAYS.map((d, i) => (
                    <Pressable key={i} style={[styles.dayCircle, selectedDays.includes(d.v) && styles.dayCircleActive]} onPress={() => toggleDay(d.v)}>
                      <Text style={[styles.dayCircleText, selectedDays.includes(d.v) && styles.dayCircleTextActive]}>{d.l}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            
            {freqMode === 'custom' && (
              <View style={styles.subInputContainer}>
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input} 
                    value={intervalDays} 
                    onChangeText={setIntervalDays} 
                    placeholder="Repeat every X days (e.g. 2)" 
                    placeholderTextColor={COLORS.outlineVariant} 
                    keyboardType="number-pad" 
                  />
                </View>
              </View>
            )}
          </View>

          {/* Time of the Day */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time of the Day</Text>
            <View style={styles.gridRow}>
              {(['all_day', 'time'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.gridBtn, timeMode === s && styles.gridBtnActive]}
                  onPress={() => setTimeMode(s)}
                >
                  <MaterialIcons 
                    name={s === 'all_day' ? 'wb-sunny' : 'schedule'} 
                    size={24} 
                    color={timeMode === s ? '#fff' : COLORS.onSurfaceVariant} 
                    style={{ marginBottom: 8 }} 
                  />
                  <Text style={[styles.gridBtnText, timeMode === s && styles.gridBtnTextActive]}>
                    {s === 'all_day' ? 'All Day' : 'Time'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Conditional Time Sub-inputs */}
            {timeMode === 'time' && (
              <View style={styles.subInputContainer}>
                <View style={[styles.gridRow, { gap: 12 }]}>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.label, { fontSize: 9, marginBottom: 8 }]}>Start Time</Text>
                     <View style={styles.inputContainer}>
                       <TextInput style={[styles.input, { fontSize: 16, paddingVertical: 12 }]} value={startTime} onChangeText={setStartTime} placeholder="08:00 AM" placeholderTextColor={COLORS.outlineVariant} />
                     </View>
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.label, { fontSize: 9, marginBottom: 8 }]}>End (Optional)</Text>
                     <View style={styles.inputContainer}>
                       <TextInput style={[styles.input, { fontSize: 16, paddingVertical: 12 }]} value={endTime} onChangeText={setEndTime} placeholder="--:--" placeholderTextColor={COLORS.outlineVariant} />
                     </View>
                   </View>
                </View>
              </View>
            )}
          </View>

          {/* Gentle Reminders */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reminders</Text>
            <View style={styles.reminderRow}>
              <View style={styles.reminderIconWrapper}>
                <MaterialIcons name="notifications-active" size={24} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>Gentle Notifications</Text>
                <Text style={styles.reminderSubtext}>Select when you want to be softly reminded</Text>
              </View>
            </View>
            <View style={[styles.chipRow, { marginTop: 16 }]}>
              {REMINDER_OPTS.map((opt) => (
                <Pressable key={opt} style={[styles.reminderPill, selectedReminders.includes(opt) && styles.reminderPillActive]} onPress={() => toggleReminder(opt)}>
                  <Text style={[styles.reminderPillText, selectedReminders.includes(opt) && styles.reminderPillTextActive]}>{opt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footerCTA}>
        <Pressable style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Start Streak</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 249, 0.7)', zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { ...TYPOGRAPHY.titleMd, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  closeBtn: { padding: 4 },

  content: { padding: 24, paddingBottom: 120 },

  heroSection: { marginBottom: 32 },
  title: { ...TYPOGRAPHY.displayLg, color: COLORS.primary, marginTop: 8 },
  subtitle: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, marginTop: 8, textTransform: 'uppercase' },

  formSection: { gap: 24 },
  inputGroup: {},
  label: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADII.md,
    padding: 4,
  },
  input: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  gridRow: { flexDirection: 'row', gap: 16 },
  gridBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 24,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnActive: { backgroundColor: COLORS.primary },
  gridBtnText: { ...TYPOGRAPHY.labelSm, color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  gridBtnTextActive: { color: COLORS.surfaceContainerHighest, fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  
  subInputContainer: { marginTop: 16 },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceContainerLowest, padding: 8, borderRadius: RADII.md },
  dayCircle: { width: 36, height: 36, borderRadius: RADII.full, justifyContent: 'center', alignItems: 'center' },
  dayCircleActive: { backgroundColor: COLORS.primaryContainer },
  dayCircleText: { ...TYPOGRAPHY.labelMd, color: COLORS.onSurfaceVariant },
  dayCircleTextActive: { color: COLORS.primary, fontWeight: '700' },
  
  reminderPill: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1, borderColor: 'rgba(171, 180, 181, 0.15)',
  },
  reminderPillActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  reminderPillText: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  reminderPillTextActive: { color: COLORS.onPrimaryContainer, fontWeight: '700' },

  reminderRow: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADII.md,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reminderIconWrapper: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    borderRadius: RADII.full,
  },
  reminderTitle: { ...TYPOGRAPHY.titleSm, color: COLORS.onSurface },
  reminderSubtext: { ...TYPOGRAPHY.bodySm, color: COLORS.onSurfaceVariant },

  footerCTA: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(248, 249, 249, 0.8)',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    borderRadius: RADII.full,
    alignItems: 'center',
    ...SHADOWS.floating,
  },
  createButtonText: { ...TYPOGRAPHY.labelSm, color: COLORS.surfaceContainerHighest, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
