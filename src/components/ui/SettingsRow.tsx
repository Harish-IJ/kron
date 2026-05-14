import React from 'react';
import { View, Pressable, StyleSheet, PressableProps } from 'react-native';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { colors, borders } from '../../constants/theme';

interface SettingsRowProps extends PressableProps {
  label: string;
  value?: string;
  showChevron?: boolean;
}

export function SettingsRow({ label, value, showChevron = false, ...props }: SettingsRowProps) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} {...props}>
      <Typography variant="label">{label}</Typography>
      <View style={styles.right}>
        {value && <Typography variant="mono" color={colors.navy}>{value}</Typography>}
        {showChevron && <Icon name="chevron-right" size={16} color={colors.navy} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: borders.divider.borderWidth, borderBottomColor: borders.divider.borderColor },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.6 },
});
