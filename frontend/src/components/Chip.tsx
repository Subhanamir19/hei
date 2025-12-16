import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress, style }) => {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected, style]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipSelected: {
    borderColor: colors.neonCyan,
    backgroundColor: '#142038',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
});
