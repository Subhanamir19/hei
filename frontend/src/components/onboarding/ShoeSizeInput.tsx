import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from '../Chip';
import { colors, radii, spacing } from '../../theme/tokens';

export type ShoeUnit = 'cm' | 'eu' | 'us_m' | 'us_w';

export interface ShoeSizeValue {
  unit: ShoeUnit;
  value: string;
}

interface ShoeSizeInputProps {
  label: string;
  value: ShoeSizeValue;
  onChange: (next: ShoeSizeValue) => void;
  helperText?: string;
  errorText?: string;
  required?: boolean;
}

export const ShoeSizeInput: React.FC<ShoeSizeInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  errorText,
  required = false,
}) => {
  const setUnit = (unit: ShoeUnit) => onChange({ ...value, unit });

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
            label="EU"
            selected={value.unit === 'eu'}
            onPress={() => setUnit('eu')}
            style={styles.unitChip}
          />
          <Chip
            label="US (M)"
            selected={value.unit === 'us_m'}
            onPress={() => setUnit('us_m')}
            style={styles.unitChip}
          />
          <Chip
            label="US (W)"
            selected={value.unit === 'us_w'}
            onPress={() => setUnit('us_w')}
            style={styles.unitChip}
          />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="e.g. 42"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={value.value}
          onChangeText={(val) => onChange({ ...value, value: val })}
        />
        <Text style={styles.unitLabel}>{value.unit.toUpperCase().replace('_', ' ')}</Text>
      </View>
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
  unitRow: { flexDirection: 'row', flexWrap: 'wrap' },
  unitChip: { marginLeft: spacing.sm, marginTop: spacing.xs },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
