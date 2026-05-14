import React, { useState } from 'react';
import { ScrollView, View, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useActiveStreak } from '../../src/hooks/use-streak';
import { IntervalSelector } from '../../src/components/ui/IntervalSelector';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { Typography } from '../../src/components/ui/Typography';
import { colors, space, borders } from '../../src/constants/theme';
import type { IntervalType } from '../../src/domain/types';

export default function NewStreakModal() {
  const { createStreak } = useActiveStreak();
  const [title, setTitle] = useState('');
  const [intervalType, setIntervalType] = useState<IntervalType>('daily');
  const [intervalDays, setIntervalDays] = useState(1);
  const [intervalWeekdays, setIntervalWeekdays] = useState<number[]>([]);
  const [intervalMonthDates, setIntervalMonthDates] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createStreak({
        title: title.trim(),
        intervalType,
        intervalDays,
        intervalWeekdays,
        intervalMonthDates,
        notificationTimes: [],
      });
      router.back();
    } finally {
      setSaving(false);
    }
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
              autoFocus
            />
          </View>
          <View style={styles.fieldRow}>
            <Typography variant="caption" color={colors.navy} style={{ marginBottom: space[2] }}>INTERVAL</Typography>
            <IntervalSelector
              intervalType={intervalType}
              intervalDays={intervalDays}
              intervalWeekdays={intervalWeekdays}
              intervalMonthDates={intervalMonthDates}
              disabled={false}
              onChange={(t, d, wd, md) => {
                setIntervalType(t);
                setIntervalDays(d);
                setIntervalWeekdays(wd);
                setIntervalMonthDates(md);
              }}
            />
          </View>
        </View>
        <PrimaryButton
          label="CREATE STREAK"
          onPress={handleCreate}
          loading={saving}
          disabled={!title.trim()}
          style={{ marginTop: space[3] }}
        />
        <SecondaryButton
          label="CANCEL"
          onPress={() => router.back()}
          style={{ marginTop: space[2], alignSelf: 'stretch' }}
        />
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
