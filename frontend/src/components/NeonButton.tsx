import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ label, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neonLime,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  label: {
    color: colors.background,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
});
