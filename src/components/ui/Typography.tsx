import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../../constants/theme';

interface TypographyProps extends TextProps {
  variant?: 'hero' | 'display' | 'headline' | 'label' | 'mono' | 'caption';
  color?: string;
}

export function Typography({ variant = 'label', color, style, children, ...props }: TypographyProps) {
  const isMono = variant === 'mono' || variant === 'caption';
  return (
    <Text
      style={[styles[variant], color ? { color } : undefined, style]}
      allowFontScaling={!isMono}
      maxFontSizeMultiplier={variant === 'hero' ? 1 : 2}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: fonts.sansBlack,
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    color: colors.ink,
    lineHeight: 72,
  },
  display: {
    fontFamily: fonts.sansBold,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
    lineHeight: 40,
  },
  headline: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.ink,
    lineHeight: 18,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.navy,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.navy,
    lineHeight: 14,
  },
});
