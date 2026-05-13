import React, { useState } from 'react';
import {
  View, Pressable, ScrollView, Modal, TextInput, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Typography } from './Typography';
import { PrimaryButton } from './PrimaryButton';
import { colors, space } from '../../constants/theme';
import type { IntervalType } from '../../domain/types';

interface Option { label: string; intervalType: IntervalType; intervalDays: number; }

const PRESETS: Option[] = [
  { label: 'DAILY', intervalType: 'daily', intervalDays: 1 },
  { label: 'EVERY 2D', intervalType: 'every_n_days', intervalDays: 2 },
  { label: 'EVERY 3D', intervalType: 'every_n_days', intervalDays: 3 },
  { label: 'WEEKLY', intervalType: 'weekly', intervalDays: 7 },
];

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type ModalMode = 'every_n_days' | 'weekly_on_days' | 'monthly_on_dates' | 'daily';

interface IntervalSelectorProps {
  intervalType: IntervalType;
  intervalDays: number;
  intervalWeekdays?: number[];
  intervalMonthDates?: number[];
  disabled?: boolean;
  onChange: (type: IntervalType, days: number, weekdays: number[], monthDates: number[]) => void;
}

export function IntervalSelector({
  intervalType, intervalDays, intervalWeekdays = [], intervalMonthDates = [], disabled, onChange,
}: IntervalSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('every_n_days');
  const [modalDays, setModalDays] = useState(5);
  const [modalWeekdays, setModalWeekdays] = useState<number[]>([]);
  const [modalDatesText, setModalDatesText] = useState('');

  const isPreset = PRESETS.some(p => p.intervalType === intervalType && p.intervalDays === intervalDays);
  const isCustom = !isPreset;

  const openModal = () => {
    if (disabled) return;
    if (intervalType === 'weekly_on_days') {
      setModalMode('weekly_on_days');
      setModalWeekdays([...(intervalWeekdays ?? [])]);
    } else if (intervalType === 'monthly_on_dates') {
      setModalMode('monthly_on_dates');
      setModalDatesText((intervalMonthDates ?? []).join(', '));
    } else if (intervalType === 'every_n_days') {
      setModalMode('every_n_days');
      setModalDays(intervalDays);
    } else {
      setModalMode('every_n_days');
      setModalDays(5);
    }
    setModalVisible(true);
  };

  const toggleWeekday = (idx: number) => {
    setModalWeekdays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const handleApply = () => {
    if (modalMode === 'daily') {
      onChange('daily', 1, [], []);
      setModalVisible(false);
    } else if (modalMode === 'every_n_days') {
      const d = Math.max(2, Math.min(90, modalDays));
      onChange('every_n_days', d, [], []);
      setModalVisible(false);
    } else if (modalMode === 'weekly_on_days') {
      if (modalWeekdays.length === 0) return;
      onChange('weekly_on_days', 7, modalWeekdays, []);
      setModalVisible(false);
    } else if (modalMode === 'monthly_on_dates') {
      const dates = modalDatesText
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= 31);
      const unique = [...new Set(dates)].sort((a, b) => a - b);
      if (unique.length === 0) return;
      onChange('monthly_on_dates', 30, [], unique);
      setModalVisible(false);
    }
  };

  const applyDisabled =
    (modalMode === 'weekly_on_days' && modalWeekdays.length === 0) ||
    (modalMode === 'monthly_on_dates' && modalDatesText.trim() === '');

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
        <View style={styles.row}>
          {PRESETS.map(opt => {
            const selected = opt.intervalType === intervalType && opt.intervalDays === intervalDays;
            return (
              <Pressable
                key={opt.label}
                onPress={() => !disabled && onChange(opt.intervalType, opt.intervalDays, [], [])}
                style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
              >
                <Typography variant="label" color={selected ? colors.orange : colors.ink} style={{ fontSize: 11 }}>
                  {opt.label}
                </Typography>
              </Pressable>
            );
          })}
          <Pressable
            onPress={openModal}
            style={[styles.chip, isCustom && styles.chipSelected, disabled && styles.chipDisabled]}
          >
            <Typography variant="label" color={isCustom ? colors.orange : colors.ink} style={{ fontSize: 11 }}>
              {isCustom ? customLabel(intervalType, intervalDays, intervalWeekdays, intervalMonthDates) : 'CUSTOM'}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Typography variant="headline">CUSTOM INTERVAL</Typography>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <Typography variant="label" color={colors.navy}>CLOSE</Typography>
              </Pressable>
            </View>

            {/* Mode chips */}
            <View style={styles.modeRow}>
              {(
                [
                  { key: 'daily', label: 'DAILY' },
                  { key: 'every_n_days', label: 'EVERY N DAYS' },
                  { key: 'weekly_on_days', label: 'WEEKLY' },
                  { key: 'monthly_on_dates', label: 'MONTHLY' },
                ] as { key: ModalMode; label: string }[]
              ).map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setModalMode(key)}
                  style={[styles.modeChip, modalMode === key && styles.modeChipSelected]}
                >
                  <Typography
                    variant="label"
                    style={{ fontSize: 10 }}
                    color={modalMode === key ? colors.orange : colors.ink}
                  >
                    {label}
                  </Typography>
                </Pressable>
              ))}
            </View>

            {/* Sub-config */}
            <View style={styles.configArea}>
              {modalMode === 'daily' && (
                <Typography variant="caption" color={`${colors.ink}70`}>
                  Log once every calendar day. Streak breaks on any missed day.
                </Typography>
              )}

              {modalMode === 'every_n_days' && (
                <View>
                  <Typography variant="caption" style={{ marginBottom: space[3] }}>DAYS BETWEEN LOGS</Typography>
                  <View style={styles.counter}>
                    <Pressable
                      onPress={() => setModalDays(d => Math.max(2, d - 1))}
                      style={styles.counterBtn}
                    >
                      <Typography variant="headline">−</Typography>
                    </Pressable>
                    <Typography variant="headline" style={styles.counterVal}>{modalDays}</Typography>
                    <Pressable
                      onPress={() => setModalDays(d => Math.min(90, d + 1))}
                      style={styles.counterBtn}
                    >
                      <Typography variant="headline">+</Typography>
                    </Pressable>
                  </View>
                  <Typography variant="mono" color={`${colors.ink}60`} style={{ marginTop: space[3] }}>
                    LOG ONCE EVERY {modalDays} DAYS
                  </Typography>
                </View>
              )}

              {modalMode === 'weekly_on_days' && (
                <View>
                  <Typography variant="caption" style={{ marginBottom: space[3] }}>
                    SELECT DAYS TO LOG
                  </Typography>
                  <View style={styles.dayRow}>
                    {WEEKDAYS.map((day, idx) => {
                      const sel = modalWeekdays.includes(idx);
                      return (
                        <Pressable
                          key={day}
                          onPress={() => toggleWeekday(idx)}
                          style={[styles.dayChip, sel && styles.dayChipSelected]}
                        >
                          <Typography
                            variant="label"
                            style={{ fontSize: 10 }}
                            color={sel ? colors.orange : colors.ink}
                          >
                            {day}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                  {modalWeekdays.length === 0 && (
                    <Typography variant="caption" color={colors.orange} style={{ marginTop: space[2] }}>
                      SELECT AT LEAST ONE DAY
                    </Typography>
                  )}
                </View>
              )}

              {modalMode === 'monthly_on_dates' && (
                <View>
                  <Typography variant="caption" style={{ marginBottom: space[2] }}>
                    DATES OF MONTH (COMMA-SEPARATED)
                  </Typography>
                  <Typography variant="mono" color={`${colors.ink}50`} style={{ marginBottom: space[3] }}>
                    e.g. 1, 5, 10, 24  (values 1–31)
                  </Typography>
                  <TextInput
                    style={styles.dateInput}
                    value={modalDatesText}
                    onChangeText={setModalDatesText}
                    placeholder="3, 5, 10, 24"
                    placeholderTextColor={`${colors.ink}30`}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>

            <PrimaryButton
              label="APPLY INTERVAL"
              onPress={handleApply}
              style={applyDisabled ? { opacity: 0.4 } : undefined}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function customLabel(
  type: IntervalType,
  days: number,
  weekdays: number[],
  monthDates: number[],
): string {
  if (type === 'weekly_on_days' && weekdays.length > 0) {
    const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return weekdays.map(d => names[d]).join('/');
  }
  if (type === 'monthly_on_dates' && monthDates.length > 0) {
    const preview = monthDates.slice(0, 3).join(',');
    return monthDates.length > 3 ? `${preview}…` : preview;
  }
  if (type === 'every_n_days') return `EVERY ${days}D`;
  return 'CUSTOM';
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.ink },
  chipSelected: { borderWidth: 2, borderColor: colors.orange },
  chipDisabled: { opacity: 0.4 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.base,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    padding: space[5],
    paddingBottom: space[9],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[5],
  },
  modeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: space[5] },
  modeChip: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.ink },
  modeChipSelected: { borderWidth: 2, borderColor: colors.orange },
  configArea: { minHeight: 90, marginBottom: space[5] },
  counter: { flexDirection: 'row', alignItems: 'center', gap: space[5] },
  counterBtn: {
    width: 44, height: 44,
    borderWidth: 2, borderColor: colors.ink,
    justifyContent: 'center', alignItems: 'center',
  },
  counterVal: { minWidth: 52, textAlign: 'center' },
  dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.ink },
  dayChipSelected: { borderWidth: 2, borderColor: colors.orange },
  dateInput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 14,
    color: colors.ink,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: space[3],
  },
});
