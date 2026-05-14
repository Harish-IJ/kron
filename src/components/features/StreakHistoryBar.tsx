import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';
import type { StreakRun } from '../../domain/analytics-engine';

export function StreakHistoryBar({ runs, longestStreak, startDate }: { runs: StreakRun[]; longestStreak: number; startDate: string }) {
  const today = new Date();
  const start = new Date(startDate + 'T00:00:00');
  const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const W = 300, H = 12;

  return (
    <View style={styles.wrapper}>
      <View style={styles.top}>
        <Typography variant="caption">STREAK HISTORY</Typography>
        <Typography variant="label" color={colors.navy}>{longestStreak} DAYS BEST</Typography>
      </View>
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={H} fill={colors.empty} />
        {runs.map((run, i) => {
          const offsetDays = Math.floor((new Date(run.startDate+'T00:00:00').getTime() - start.getTime()) / 86400000);
          const x = (offsetDays / totalDays) * W;
          const w = Math.max(2, (run.length / totalDays) * W);
          return <Rect key={i} x={x} y={0} width={w} height={H} fill={colors.navy} />;
        })}
      </Svg>
      <View style={styles.axis}>
        <Typography variant="caption" color={`${colors.navy}80`}>{startDate}</Typography>
        <Typography variant="caption" color={`${colors.navy}80`}>TODAY</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space[5] },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[2] },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
});
