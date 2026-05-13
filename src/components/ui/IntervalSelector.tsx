import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';
import type { IntervalType } from '../../domain/types';

interface Option { label: string; intervalType: IntervalType; intervalDays: number; }

const PRESETS: Option[] = [
  { label: 'DAILY', intervalType: 'daily', intervalDays: 1 },
  { label: 'EVERY 2 DAYS', intervalType: 'every_n_days', intervalDays: 2 },
  { label: 'EVERY 3 DAYS', intervalType: 'every_n_days', intervalDays: 3 },
  { label: 'WEEKLY', intervalType: 'weekly', intervalDays: 7 },
];

interface IntervalSelectorProps {
  intervalType: IntervalType;
  intervalDays: number;
  disabled?: boolean;
  onChange: (type: IntervalType, days: number) => void;
}

export function IntervalSelector({ intervalType, intervalDays, disabled, onChange }: IntervalSelectorProps) {
  const isCustom = intervalType === 'every_n_days' && ![2, 3].includes(intervalDays);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
      <View style={styles.row}>
        {PRESETS.map(opt => {
          const selected = opt.intervalType === intervalType && opt.intervalDays === intervalDays;
          return (
            <Pressable
              key={opt.label}
              onPress={() => !disabled && onChange(opt.intervalType, opt.intervalDays)}
              style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
            >
              <Typography variant="label" color={selected ? colors.orange : colors.ink} style={{ fontSize: 11 }}>{opt.label}</Typography>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => !disabled && onChange('every_n_days', isCustom ? intervalDays : 5)}
          style={[styles.chip, isCustom && styles.selected, disabled && styles.disabled]}
        >
          <Typography variant="label" color={isCustom ? colors.orange : colors.ink} style={{ fontSize: 11 }}>CUSTOM</Typography>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.ink, borderRadius: 0 },
  selected: { borderWidth: 2, borderColor: colors.orange },
  disabled: { opacity: 0.4 },
});
