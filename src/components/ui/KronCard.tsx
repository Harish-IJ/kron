import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, borders, shadows } from '../../constants/theme';

interface KronCardProps extends ViewProps {
  elevated?: boolean;
  padding?: number;
}

export function KronCard({ elevated = true, padding = 16, style, children, ...props }: KronCardProps) {
  return (
    <View style={[styles.card, elevated && styles.shadow, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.base,
    borderWidth: borders.card.borderWidth,
    borderColor: borders.card.borderColor,
    borderRadius: 0,
  },
  shadow: {
    shadowColor: shadows.card.shadowColor,
    shadowOffset: shadows.card.shadowOffset,
    shadowOpacity: shadows.card.shadowOpacity,
    shadowRadius: shadows.card.shadowRadius,
    elevation: shadows.card.elevation,
  },
});
