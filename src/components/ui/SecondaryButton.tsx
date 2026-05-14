import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';

interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SecondaryButton({ label, disabled, style, onPress, accessibilityLabel }: SecondaryButtonProps) {
  return (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && styles.pressed, style]}
      disabled={disabled}
      onPress={onPress}
    >
      <Typography variant="label">{label}</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 44, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: `${colors.ink}80` },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
});
