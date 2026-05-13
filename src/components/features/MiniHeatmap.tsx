import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { KronCard } from '../ui/KronCard';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';
import type { HeatmapCell } from '../../domain/analytics-engine';

const CELL = 8;
const GAP = 2;
const WEEKS = 12;
const DAYS = 7;

interface MiniHeatmapProps {
  cells: HeatmapCell[];
}

export function MiniHeatmap({ cells }: MiniHeatmapProps) {
  const cellMap = new Map<string, HeatmapCell>(cells.map(c => [c.date, c]));
  const today = new Date();
  const todayStr = toDateStr(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * DAYS - 1));

  const grid: { date: string; cell: HeatmapCell | undefined }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; cell: HeatmapCell | undefined }[] = [];
    for (let d = 0; d < DAYS; d++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + w * 7 + d);
      const ds = toDateStr(dt);
      week.push({ date: ds, cell: cellMap.get(ds) });
    }
    grid.push(week);
  }

  const svgW = WEEKS * (CELL + GAP) - GAP;
  const svgH = DAYS * (CELL + GAP) - GAP;

  return (
    <KronCard elevated={false} padding={12} style={styles.card}>
      <View style={styles.labelRow}>
        <Typography variant="caption">12-WEEK HISTORY</Typography>
        <View style={styles.legend}>
          <Svg width={8} height={8}>
            <Rect width={8} height={8} fill={colors.navy} />
          </Svg>
          <Typography variant="caption" style={{ marginLeft: 3 }}>
            DONE
          </Typography>
          <Svg width={8} height={8} style={{ marginLeft: 6 }}>
            <Rect width={8} height={8} fill={colors.orange} opacity={0.4} />
          </Svg>
          <Typography variant="caption" style={{ marginLeft: 3 }}>
            MISSED
          </Typography>
        </View>
      </View>
      <Svg width={svgW} height={svgH}>
        {grid.map((week, wi) =>
          week.map(({ date, cell }, di) => {
            const isPast = date <= todayStr;
            const fill =
              cell && cell.logCount > 0
                ? colors.navy
                : isPast && cell !== undefined && cell.logCount === 0
                  ? `${colors.orange}66`
                  : colors.empty;
            return (
              <Rect
                key={`${wi}-${di}`}
                x={wi * (CELL + GAP)}
                y={di * (CELL + GAP)}
                width={CELL}
                height={CELL}
                fill={fill}
              />
            );
          })
        )}
      </Svg>
    </KronCard>
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: { marginBottom: space[3] },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[3],
  },
  legend: { flexDirection: 'row', alignItems: 'center' },
});
