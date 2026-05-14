import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { PrimaryButton } from './PrimaryButton';
import { colors, space } from '../../constants/theme';

interface EmptyStateProps {
  headline: string;
  subtext: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ headline, subtext, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Typography variant="headline" style={styles.headline}>{headline}</Typography>
      <Typography variant="mono" color={colors.navy} style={styles.sub}>{subtext}</Typography>
      {actionLabel && onAction && <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[7] },
  headline: { textAlign: 'center', marginBottom: space[3] },
  sub: { textAlign: 'center', marginBottom: space[5] },
  btn: { alignSelf: 'stretch' },
});
