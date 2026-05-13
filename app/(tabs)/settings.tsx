import React, { useState } from 'react';
import { ScrollView, View, TextInput, StyleSheet, Alert } from 'react-native';
import { useStreak } from '../../src/hooks/use-streak';
import { useLogs } from '../../src/hooks/use-logs';
import { IntervalSelector } from '../../src/components/ui/IntervalSelector';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { Typography } from '../../src/components/ui/Typography';
import { exportAll } from '../../src/services/export-service';
import { requestNotificationPermission } from '../../src/services/notification-service';
import { colors, space, borders } from '../../src/constants/theme';
import type { IntervalType } from '../../src/domain/types';

export default function SettingsScreen() {
  const { streak, saveStreak, resetAll } = useStreak();
  const { logs } = useLogs();

  const [title, setTitle] = useState(streak?.title ?? '');
  const [intervalType, setIntervalType] = useState<IntervalType>(streak?.intervalType ?? 'daily');
  const [intervalDays, setIntervalDays] = useState(streak?.intervalDays ?? 1);
  const [saving, setSaving] = useState(false);
  const hasLogs = logs.length > 0;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await saveStreak({ title: title.trim(), intervalType, intervalDays, notificationTimes: streak?.notificationTimes ?? [] });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Streak', 'This will permanently delete all logs and streak history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: () => Alert.alert('Are you absolutely sure?', 'All data will be lost forever.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Reset Everything', style: 'destructive', onPress: resetAll },
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
              disabled={hasLogs}
              onChange={(t, d) => { setIntervalType(t); setIntervalDays(d); }}
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
          <SettingsRow label="EXPORT DATA" showChevron onPress={() => streak && exportAll(streak, logs)} />
          <SettingsRow label="ENABLE NOTIFICATIONS" showChevron onPress={requestNotificationPermission} />
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionLabel}>DANGER ZONE</Typography>
        <SecondaryButton label="RESET STREAK" onPress={handleReset} style={{ alignSelf: 'stretch' }} />
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
