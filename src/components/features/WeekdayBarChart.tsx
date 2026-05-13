import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';

const DAYS = ['S','M','T','W','T','F','S'];

export function WeekdayBarChart({ pattern }: { pattern: number[] }) {
  const maxVal = Math.max(1, ...pattern);
  const peakDay = pattern.indexOf(Math.max(...pattern));
  const BAR_H = 60;

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" style={styles.label}>WEEKDAY PATTERN</Typography>
      <View style={styles.chart}>
        {pattern.map((val, i) => {
          const barHeight = Math.max(2, (val / maxVal) * BAR_H);
          return (
            <View key={i} style={styles.col}>
              <View style={{ height: BAR_H - barHeight }} />
              <View style={{ position: 'relative', width: 24 }}>
                {i === peakDay && val > 0 && <View style={styles.peak} />}
                <View style={[styles.bar, { height: barHeight }]} />
              </View>
              <Typography variant="caption" style={styles.dayLabel}>{DAYS[i]}</Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space[5] },
  label: { marginBottom: space[3] },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  col: { alignItems: 'center' },
  bar: { width: 24, backgroundColor: colors.navy },
  peak: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.orange, zIndex: 1 },
  dayLabel: { marginTop: 4 },
});
