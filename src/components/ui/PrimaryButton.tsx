import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, PressableProps } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
}

export function PrimaryButton({ label, loading, disabled, style, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, isDisabled && styles.disabled, pressed && styles.pressed, style as object]}
      disabled={isDisabled}
      {...props}
    >
      {loading
        ? <ActivityIndicator color={colors.base} />
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
