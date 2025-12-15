import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
}) => (
  <View style={styles.container}>
    <View style={styles.textBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    <Text style={styles.step}>{`Step ${currentStep} of ${totalSteps}`}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  textBlock: { flex: 1, paddingRight: spacing.md },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  step: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
});
