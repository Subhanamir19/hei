import React from 'react';
import { Text, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, action, style }) => (
  <View style={[styles.row, style]}>
    <Text style={styles.title}>{title}</Text>
    {action}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
  },
});
