import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useActiveStreak } from '../../src/hooks/use-streak';
import { useLogs } from '../../src/hooks/use-logs';
import { IntervalSelector } from '../../src/components/ui/IntervalSelector';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { Typography } from '../../src/components/ui/Typography';
import { exportAll } from '../../src/services/export-service';
import { requestNotificationPermission } from '../../src/services/notification-service';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { colors, space, borders } from '../../src/constants/theme';
import type { IntervalType } from '../../src/domain/types';

export default function SettingsScreen() {
  const { streak, activeStreakId, updateStreak, updateStreakInterval, resetStreak, deleteStreak } = useActiveStreak();
  const { logs } = useLogs(activeStreakId ?? '');

  const [title, setTitle] = useState(streak?.title ?? '');
  const [intervalType, setIntervalType] = useState<IntervalType>(streak?.intervalType ?? 'daily');
  const [intervalDays, setIntervalDays] = useState(streak?.intervalDays ?? 1);
  const [intervalWeekdays, setIntervalWeekdays] = useState<number[]>(streak?.intervalWeekdays ?? []);
  const [intervalMonthDates, setIntervalMonthDates] = useState<number[]>(streak?.intervalMonthDates ?? []);
  const [saving, setSaving] = useState(false);
  const hasLogs = logs.length > 0;

  useEffect(() => {
    setTitle(streak?.title ?? '');
    setIntervalType(streak?.intervalType ?? 'daily');
    setIntervalDays(streak?.intervalDays ?? 1);
    setIntervalWeekdays(streak?.intervalWeekdays ?? []);
    setIntervalMonthDates(streak?.intervalMonthDates ?? []);
  }, [streak]);

  if (!activeStreakId || !streak) {
    return (
      <EmptyState
        headline="NO STREAK SELECTED"
        subtext="Select a streak from Home to manage settings."
        actionLabel="GO TO HOME"
        onAction={() => router.push('/(tabs)/' as any)}
      />
    );
  }

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (!hasLogs) {
        await updateStreakInterval(streak.id, intervalType, intervalDays, intervalWeekdays, intervalMonthDates);
      }
      await updateStreak(streak.id, { title: title.trim(), notificationTimes: streak.notificationTimes });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Streak', 'This will permanently delete all logs and streak history. The streak config will remain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you absolutely sure?', 'All logs for this streak will be lost forever.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Reset',
              style: 'destructive',
              onPress: async () => { await resetStreak(streak.id); },
            },
          ]),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Streak', 'This will permanently delete this streak and all its logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you absolutely sure?', 'This streak and all its data will be lost forever.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Delete',
              style: 'destructive',
              onPress: async () => {
                await deleteStreak(streak.id);
                router.replace('/(tabs)/' as any);
              },
            },
          ]),
      },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionLabel}>STREAK</Typography>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Typography variant="caption" color={colors.navy} style={{ marginBottom: 4 }}>TITLE</Typography>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="My Practice"
              placeholderTextColor={`${colors.ink}40`}
            />
          </View>
          <View style={styles.fieldRow}>
            <Typography variant="caption" color={colors.navy} style={{ marginBottom: space[2] }}>INTERVAL</Typography>
            <IntervalSelector
              intervalType={intervalType}
              intervalDays={intervalDays}
              intervalWeekdays={intervalWeekdays}
              intervalMonthDates={intervalMonthDates}
              disabled={hasLogs}
              onChange={(t, d, wd, md) => {
                setIntervalType(t);
                setIntervalDays(d);
                setIntervalWeekdays(wd);
                setIntervalMonthDates(md);
              }}
            />
            {hasLogs && (
              <Typography variant="caption" color={`${colors.orange}CC`} style={{ marginTop: space[2] }}>
                INTERVAL LOCKED AFTER FIRST LOG
              </Typography>
            )}
          </View>
        </View>
        <PrimaryButton label="SAVE SETTINGS" onPress={handleSave} loading={saving} style={{ marginTop: space[3] }} />
      </View>

      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionLabel}>DATA</Typography>
        <View style={styles.card}>
          <SettingsRow label="EXPORT DATA" showChevron onPress={() => exportAll(streak, logs)} />
          <SettingsRow label="ENABLE NOTIFICATIONS" showChevron onPress={requestNotificationPermission} />
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionLabel}>DANGER ZONE</Typography>
        <SecondaryButton label="RESET STREAK" onPress={handleReset} style={{ alignSelf: 'stretch', marginBottom: space[3] }} />
        <SecondaryButton label="DELETE STREAK" onPress={handleDelete} style={{ alignSelf: 'stretch' }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.base },
  content: { padding: space[5], paddingBottom: space[9] },
  section: { marginBottom: space[7] },
  sectionLabel: { marginBottom: space[3] },
  card: { borderWidth: borders.card.borderWidth, borderColor: borders.card.borderColor },
  fieldRow: { padding: space[5], borderBottomWidth: borders.divider.borderWidth, borderBottomColor: borders.divider.borderColor },
  input: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.ink, letterSpacing: 0.5 },
});
