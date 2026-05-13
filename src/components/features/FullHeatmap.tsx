import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Typography } from '../ui/Typography';
import { colors, borders, space } from '../../constants/theme';
import type { HeatmapCell } from '../../domain/analytics-engine';

const CELL = 5, GAP = 1, WEEKS = 52, DAYS = 7;

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function FullHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const cellMap = new Map<string, HeatmapCell>(cells.map(c => [c.date, c]));
  const today = new Date();
  const todayStr = toDateStr(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * DAYS - 1));

  const weeks: { date: string; cell: HeatmapCell | undefined }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; cell: HeatmapCell | undefined }[] = [];
    for (let d = 0; d < DAYS; d++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + w * 7 + d);
      const ds = toDateStr(dt);
      week.push({ date: ds, cell: cellMap.get(ds) });
    }
    weeks.push(week);
  }

  const svgW = WEEKS * (CELL + GAP);
  const svgH = DAYS * (CELL + GAP) + 14;

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" style={styles.label}>52-WEEK ACTIVITY</Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgW} height={svgH}>
          {weeks.map((week, wi) =>
            week.map(({ date, cell }, di) => {
              const isPast = date <= todayStr;
              const fill = cell && cell.logCount > 0
                ? colors.navy
                : isPast && cell !== undefined
                ? `${colors.orange}66`
                : colors.empty;
              return <Rect key={`${wi}-${di}`} x={wi*(CELL+GAP)} y={di*(CELL+GAP)+14} width={CELL} height={CELL} fill={fill} />;
            })
          )}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: borders.divider.borderWidth, borderColor: borders.divider.borderColor, padding: space[4], marginBottom: space[5] },
  label: { marginBottom: space[2] },
});
