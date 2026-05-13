import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';

interface RatingBadgeProps {
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange?: (rating: 1 | 2 | 3 | 4 | 5 | null) => void;
  readonly?: boolean;
}

export function RatingBadge({ value, onChange, readonly = false }: RatingBadgeProps) {
  const handlePress = (n: 1 | 2 | 3 | 4 | 5) => {
    if (readonly || !onChange) return;
    onChange(value === n ? null : n);
  };
  return (
    <View style={styles.row}>
      {([1, 2, 3, 4, 5] as const).map(n => (
        <Pressable
          key={n}
          onPress={() => handlePress(n)}
          style={[styles.badge, value === n && styles.active]}
          hitSlop={8}
          accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >
          <Typography variant="label" color={value === n ? colors.base : `${colors.ink}50`} style={{ fontSize: 12 }}>
            ★ {n}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: `${colors.ink}30`, borderRadius: 0, minWidth: 44, alignItems: 'center' },
  active: { backgroundColor: colors.orange, borderColor: colors.orange },
});
