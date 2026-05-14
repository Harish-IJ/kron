import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';

interface RatingSparklineProps { data: Array<{ date: string; rating: number }>; }

export function RatingSparkline({ data }: RatingSparklineProps) {
  if (data.length < 2) return null;
  const W = 300, H = 80, PAD = 16;
  const xScale = (i: number) => PAD + (i / (data.length - 1)) * (W - 2 * PAD);
  const yScale = (r: number) => H - PAD - ((r - 1) / 4) * (H - 2 * PAD);
  const points = data.map((d, i) => `${xScale(i)},${yScale(d.rating)}`).join(' ');

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" style={styles.label}>RATING TREND</Typography>
      <Svg width={W} height={H}>
        {[1,2,3,4,5].map(r => (
          <Line key={r} x1={0} y1={yScale(r)} x2={W} y2={yScale(r)} stroke={colors.ink} strokeOpacity={0.08} strokeWidth={1} />
        ))}
        <Polyline points={points} fill="none" stroke={colors.orange} strokeWidth={1.5} />
        {data.map((d, i) => <Circle key={i} cx={xScale(i)} cy={yScale(d.rating)} r={3} fill={colors.orange} />)}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: space[5] },
  label: { marginBottom: space[2] },
});
