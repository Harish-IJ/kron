import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, loading, disabled, style, onPress }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [styles.btn, isDisabled && styles.disabled, pressed && styles.pressed, style]}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading
        ? <ActivityIndicator color={colors.base} accessibilityLiveRegion="polite" />
        : <Typography variant="label" color={colors.base}>{label}</Typography>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 50, backgroundColor: colors.orange, borderRadius: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
