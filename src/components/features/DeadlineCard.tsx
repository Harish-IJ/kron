import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KronCard } from '../ui/KronCard';
import { Typography } from '../ui/Typography';
import { colors, space } from '../../constants/theme';
import type { StreakState } from '../../domain/types';

interface DeadlineCardProps { streakState: StreakState; }

function formatDeadline(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeUntil(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs < 0) return 'EXPIRED';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 48) return `${Math.floor(hours / 24)}D LEFT`;
  if (hours > 0) return `${hours}H ${minutes}M LEFT`;
  return `${minutes}M LEFT`;
}

export function DeadlineCard({ streakState }: DeadlineCardProps) {
  return (
    <KronCard elevated={false} padding={16} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Typography variant="caption">NEXT DEADLINE</Typography>
          <Typography variant="headline">{formatDeadline(streakState.nextDeadline)}</Typography>
          <Typography variant="caption" color={`${colors.navy}80`}>{timeUntil(streakState.nextDeadline)}</Typography>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Typography variant="caption">WINDOWS</Typography>
          <Typography variant="headline">{streakState.completedBuckets}/{streakState.totalBuckets}</Typography>
          <Typography variant="caption" color={`${colors.navy}80`}>COMPLETED</Typography>
        </View>
      </View>
    </KronCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space[3] },
  row: { flexDirection: 'row', alignItems: 'center' },
  col: { flex: 1, gap: 4 },
  divider: { width: 1, height: 48, backgroundColor: colors.ink, marginHorizontal: 16 },
});
