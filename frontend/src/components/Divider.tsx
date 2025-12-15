import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

interface DividerProps {
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ style }) => (
  <View style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
});
