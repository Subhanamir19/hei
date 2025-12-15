import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from '../Chip';
import { colors, radii, spacing } from '../../theme/tokens';

export type HeightUnit = 'cm' | 'ft_in';

export interface HeightValue {
  unit: HeightUnit;
  cm: string;
  ft: string;
  inches: string;
}

interface HeightInputProps {
  label: string;
  value: HeightValue;
  onChange: (next: HeightValue) => void;
  helperText?: string;
  errorText?: string;
  required?: boolean;
}

export const HeightInput: React.FC<HeightInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  errorText,
  required = false,
}) => {
  const setUnit = (unit: HeightUnit) => onChange({ ...value, unit });

  const renderCmInput = () => (
    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        placeholder="e.g. 172"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        value={value.cm}
        onChangeText={(cm) => onChange({ ...value, cm })}
      />
      <Text style={styles.unitLabel}>cm</Text>
    </View>
  );

  const renderFtInInput = () => (
    <View style={styles.row}>
      <View style={[styles.inputGroup, { flex: 1 }]}>
        <TextInput
          style={styles.input}
          placeholder="ft"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={value.ft}
          onChangeText={(ft) => onChange({ ...value, ft })}
        />
        <Text style={styles.unitLabel}>ft</Text>
      </View>
      <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
        <TextInput
          style={styles.input}
          placeholder="in"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={value.inches}
          onChangeText={(inches) => onChange({ ...value, inches })}
        />
        <Text style={styles.unitLabel}>in</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <View style={styles.unitRow}>
          <Chip label="cm" selected={value.unit === 'cm'} onPress={() => setUnit('cm')} />
          <Chip
            label="ft / in"
            selected={value.unit === 'ft_in'}
            onPress={() => setUnit('ft_in')}
            style={{ marginLeft: spacing.sm }}
          />
        </View>
      </View>
      {value.unit === 'cm' ? renderCmInput() : renderFtInInput()}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
  },
  unitRow: { flexDirection: 'row' },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    paddingVertical: 4,
  },
  unitLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    marginLeft: spacing.sm,
  },
  helper: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
