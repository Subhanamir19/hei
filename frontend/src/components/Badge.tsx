import React from 'react';
import { Text, View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

interface BadgeProps {
  label: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, style }) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  text: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
});
