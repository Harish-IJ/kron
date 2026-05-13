import React from 'react';
import { Pressable, StyleSheet, PressableProps } from 'react-native';
import { Typography } from './Typography';
import { colors } from '../../constants/theme';

interface SecondaryButtonProps extends PressableProps {
  label: string;
}

export function SecondaryButton({ label, disabled, style, ...props }: SecondaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && styles.pressed, style as object]}
      disabled={disabled}
      {...props}
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
