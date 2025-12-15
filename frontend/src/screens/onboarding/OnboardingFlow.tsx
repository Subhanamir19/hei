import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { StepHeader } from '../../components/StepHeader';
import { ProgressDots } from '../../components/ProgressDots';
import { Chip } from '../../components/Chip';
import { NeonButton } from '../../components/NeonButton';
import { WheelPicker } from '../../components/onboarding/WheelPicker';
import { useAuthStore } from '../../state/auth';
import { colors, radii, spacing } from '../../theme/tokens';

type Gender = 'male' | 'female' | 'non_binary' | 'unspecified';
type Ethnicity =
  | 'asian'
  | 'black'
  | 'hispanic_latino'
  | 'white'
  | 'middle_eastern'
  | 'indigenous'
  | 'mixed'
  | 'other'
  | 'prefer_not_to_say';
type WorkoutCapacity = 'low' | 'moderate' | 'high';

interface HeightSelection {
  unit: 'cm' | 'ft_in';
  cm: number;
  ft: number;
  inches: number;
}

interface ShoeSelection {
  unit: 'cm' | 'eu' | 'us_m' | 'us_w';
  value: number;
}

interface DobSelection {
  day: number;
  month: number;
  year: number;
}

interface FormState {
  gender?: Gender;
  dob: DobSelection;
  ethnicity?: Ethnicity;
  motherHeight: HeightSelection;
  fatherHeight: HeightSelection;
  includeCurrentHeight: boolean;
  currentHeight: HeightSelection;
  footSize: ShoeSelection;
  workoutCapacity?: WorkoutCapacity;
  averageSleepHours?: number;
  dreamHeight: HeightSelection;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'unspecified', label: 'Prefer not to say' },
];

const ethnicityOptions: { value: Ethnicity; label: string }[] = [
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black' },
  { value: 'hispanic_latino', label: 'Hispanic / Latino' },
  { value: 'white', label: 'White' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const workoutOptions: { value: WorkoutCapacity; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'New to training' },
  { value: 'moderate', label: 'Moderate', description: '1-3x weekly' },
  { value: 'high', label: 'High', description: '4x+ weekly' },
];

const heightCmOptions = Array.from({ length: 131 }, (_, i) => 120 + i); // 120-250
const footSizeCmOptions = Array.from({ length: 18 }, (_, i) => 18 + i); // 18-35
const sleepHourOptions = Array.from({ length: 17 }, (_, i) => i); // 0-16

const yearsOptions = (() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const maxYear = currentYear - 10;
  const minYear = currentYear - 70;
  return Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
})();
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

const toCmFromFeet = (ft: number, inches: number) => Math.round(ft * 30.48 + inches * 2.54);

const cmToFeetInches = (cm: number): { ft: number; inches: number } => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - ft * 12);
  return { ft, inches };
};

const formatHeight = (h: HeightSelection) => `${h.cm} cm`;
const formatFootSize = (s: ShoeSelection) => `${shoeToCm(s).toFixed(1)} cm`;

const shoeToCm = (value: ShoeSelection): number => {
  switch (value.unit) {
    case 'cm':
      return value.value;
    case 'eu':
      return value.value / 1.5;
    case 'us_m':
      return (value.value + 23.5) / 1.5;
    case 'us_w':
      return (value.value + 22) / 1.5;
    default:
      return value.value;
  }
};

const initialHeight = (cm: number): HeightSelection => {
  const { ft, inches } = cmToFeetInches(cm);
  return { unit: 'cm', cm, ft, inches };
};

const initialForm: FormState = {
  dob: { day: 1, month: 1, year: yearsOptions[0] },
  motherHeight: initialHeight(165),
  fatherHeight: initialHeight(175),
  includeCurrentHeight: false,
  currentHeight: initialHeight(170),
  footSize: { unit: 'cm', value: 26 },
  dreamHeight: initialHeight(180),
  averageSleepHours: 7,
};

const steps = [
  'Welcome',
  'Gender',
  'Date of birth',
  'Ethnicity',
  'Mother height',
  'Father height',
  'Current height',
  'Foot size',
  'Workout capacity',
  'Sleep hours',
  'Dream height',
  'Review',
];

export const OnboardingFlow: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const updateHeight = (key: keyof FormState, updater: (h: HeightSelection) => HeightSelection) => {
    setForm((prev) => ({ ...prev, [key]: updater(prev[key] as HeightSelection) }));
  };

  const updateShoe = (updater: (s: ShoeSelection) => ShoeSelection) => {
    setForm((prev) => ({ ...prev, footSize: updater(prev.footSize) }));
  };

  const nextEnabled = useMemo(() => {
    switch (stepIndex) {
      case 1:
        return true;
      case 2:
        return Boolean(form.gender);
      case 3:
        return true; // DOB always valid within pickers
      case 4:
        return Boolean(form.ethnicity);
      case 5:
        return form.motherHeight.cm >= 100 && form.motherHeight.cm <= 250;
      case 6:
        return form.fatherHeight.cm >= 100 && form.fatherHeight.cm <= 250;
      case 7:
        return form.includeCurrentHeight ? form.currentHeight.cm >= 100 && form.currentHeight.cm <= 250 : true;
      case 8:
        return shoeToCm(form.footSize) >= 18 && shoeToCm(form.footSize) <= 35;
      case 9:
        return Boolean(form.workoutCapacity);
      case 10:
        return form.averageSleepHours !== undefined && form.averageSleepHours >= 0 && form.averageSleepHours <= 16;
      case 11:
        return form.dreamHeight.cm >= 100 && form.dreamHeight.cm <= 250;
      case 12:
        return true;
      default:
        return false;
    }
  }, [form, stepIndex]);

  const goNext = () => {
    if (!nextEnabled) return;
    if (stepIndex < steps.length) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    void setUser('demo-user');
    void setOnboardingCompleted(true);
    Alert.alert('Ready', 'Phase 2 will connect to backend submission.');
  };

  const goBack = () => {
    setStepIndex((prev) => Math.max(1, prev - 1));
  };

  const renderWelcome = () => (
    <View style={styles.card}>
      <Text style={styles.headline}>Build your height plan</Text>
      <Text style={styles.body}>We’ll collect a few details to personalize predictions and routines.</Text>
      <NeonButton label="Start" onPress={goNext} style={{ marginTop: spacing.xl }} />
    </View>
  );

  const renderGender = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Select your gender</Text>
      <View style={styles.chipWrap}>
        {genderOptions.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={form.gender === option.value}
            onPress={() => setForm((prev) => ({ ...prev, gender: option.value }))}
            style={styles.chip}
          />
        ))}
      </View>
    </View>
  );

  const renderDob = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Date of birth</Text>
      <View style={styles.wheelRow}>
        <WheelPicker data={monthOptions} selectedValue={form.dob.month} onChange={(month) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, month } }))} renderLabel={(m) => `Month ${m}`} />
        <WheelPicker data={dayOptions} selectedValue={form.dob.day} onChange={(day) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, day } }))} renderLabel={(d) => `Day ${d}`} />
        <WheelPicker data={yearsOptions} selectedValue={form.dob.year} onChange={(year) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, year } }))} renderLabel={(y) => `${y}`} />
      </View>
    </View>
  );

  const renderEthnicity = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Ethnicity</Text>
      <View style={styles.chipWrap}>
        {ethnicityOptions.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={form.ethnicity === option.value}
            onPress={() => setForm((prev) => ({ ...prev, ethnicity: option.value }))}
            style={styles.chip}
          />
        ))}
      </View>
    </View>
  );

  const renderHeightPicker = (
    label: string,
    key: 'motherHeight' | 'fatherHeight' | 'currentHeight' | 'dreamHeight',
    wrapCard: boolean = true,
  ) => {
    const height = form[key];
    const cmMode = height.unit === 'cm';

    const setUnit = (unit: 'cm' | 'ft_in') => {
      if (unit === 'cm') {
        setForm((prev) => ({ ...prev, [key]: { ...height, unit: 'cm' } }));
      } else {
        const { ft, inches } = cmToFeetInches(height.cm);
        setForm((prev) => ({ ...prev, [key]: { ...height, unit: 'ft_in', ft, inches } }));
      }
    };

    const content = (
      <View>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <View style={styles.row}>
            <Chip label="cm" selected={cmMode} onPress={() => setUnit('cm')} />
            <Chip
              label="ft/in"
              selected={!cmMode}
              onPress={() => setUnit('ft_in')}
              style={styles.chipSpacing}
            />
          </View>
        </View>
        {cmMode ? (
          <WheelPicker
            data={heightCmOptions}
            selectedValue={height.cm}
            onChange={(cm) => updateHeight(key, () => ({ ...height, cm }))}
            renderLabel={(val) => `${val} cm`}
          />
        ) : (
          <View style={styles.wheelRow}>
            <WheelPicker
              data={[...Array(8)].map((_, i) => i + 4)} // 4-11 ft
              selectedValue={height.ft}
              onChange={(ft) => {
                const cm = toCmFromFeet(ft, height.inches);
                updateHeight(key, () => ({ ...height, ft, cm }));
              }}
              renderLabel={(ft) => `${ft} ft`}
            />
            <WheelPicker
              data={[...Array(12)].map((_, i) => i)}
              selectedValue={height.inches}
              onChange={(inches) => {
                const cm = toCmFromFeet(height.ft, inches);
                updateHeight(key, () => ({ ...height, inches, cm }));
              }}
              renderLabel={(inch) => `${inch} in`}
            />
          </View>
        )}
      </View>
    );

    if (!wrapCard) return content;

    return <View style={styles.card}>{content}</View>;
  };

  const renderCurrentHeight = () => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionLabel}>Current height (optional)</Text>
        <Chip
          label={form.includeCurrentHeight ? 'Included' : 'Skip'}
          selected={form.includeCurrentHeight}
          onPress={() =>
            setForm((prev) => ({ ...prev, includeCurrentHeight: !prev.includeCurrentHeight }))
          }
        />
      </View>
      {form.includeCurrentHeight ? (
        renderHeightPicker('Current height', 'currentHeight', false)
      ) : (
        <Text style={styles.body}>You can add this later in tracking.</Text>
      )}
    </View>
  );

  const renderFootSize = () => {
    const unit = form.footSize.unit;
    const unitOptions: { label: string; value: ShoeSelection['unit'] }[] = [
      { label: 'cm', value: 'cm' },
      { label: 'EU', value: 'eu' },
      { label: 'US (M)', value: 'us_m' },
      { label: 'US (W)', value: 'us_w' },
    ];

    const setUnit = (nextUnit: ShoeSelection['unit']) => {
      setForm((prev) => {
        const cm = shoeToCm(prev.footSize);
        let nextValue = prev.footSize.value;
        const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
        if (nextUnit === 'cm') nextValue = clamp(Math.round(cm * 10) / 10, 18, 35);
        if (nextUnit === 'eu') nextValue = clamp(Math.round(cm * 1.5), 34, 55);
        if (nextUnit === 'us_m') nextValue = clamp(Math.round(cm * 1.5 - 23.5), 4, 21);
        if (nextUnit === 'us_w') nextValue = clamp(Math.round(cm * 1.5 - 22), 5, 22);
        return { ...prev, footSize: { unit: nextUnit, value: nextValue } };
      });
    };

    const renderData = () => {
      if (unit === 'cm') return footSizeCmOptions;
      if (unit === 'eu') return Array.from({ length: 22 }, (_, i) => 34 + i); // 34-55
      if (unit === 'us_m') return Array.from({ length: 18 }, (_, i) => 4 + i); // 4-21
      if (unit === 'us_w') return Array.from({ length: 18 }, (_, i) => 5 + i); // 5-22
      return footSizeCmOptions;
    };

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>Foot size</Text>
          <View style={styles.row}>
            {unitOptions.map((opt, idx) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={unit === opt.value}
                onPress={() => setUnit(opt.value)}
                style={idx > 0 ? styles.chipSpacing : undefined}
              />
            ))}
          </View>
        </View>
        <WheelPicker
          data={renderData()}
          selectedValue={form.footSize.value}
          onChange={(value) => updateShoe(() => ({ ...form.footSize, value }))}
          renderLabel={(v) => `${v} ${unit.toUpperCase().replace('_', ' ')}`}
        />
        <Text style={styles.helperText}>{`≈ ${formatFootSize(form.footSize)}`}</Text>
      </View>
    );
  };

  const renderWorkout = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Workout capacity</Text>
      <View style={styles.chipWrap}>
        {workoutOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setForm((prev) => ({ ...prev, workoutCapacity: opt.value }))}
            style={[
              styles.workoutCard,
              form.workoutCapacity === opt.value && styles.workoutCardSelected,
            ]}
          >
            <Text style={styles.workoutLabel}>{opt.label}</Text>
            <Text style={styles.body}>{opt.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSleep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Average sleep (hours)</Text>
      <WheelPicker
        data={sleepHourOptions}
        selectedValue={form.averageSleepHours ?? 7}
        onChange={(hours) => setForm((prev) => ({ ...prev, averageSleepHours: hours }))}
        renderLabel={(h) => `${h} h`}
      />
    </View>
  );

  const renderReview = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Review</Text>
      <SummaryRow label="Gender" value={form.gender ?? '—'} />
      <SummaryRow
        label="Date of birth"
        value={`${form.dob.year}-${String(form.dob.month).padStart(2, '0')}-${String(form.dob.day).padStart(2, '0')}`}
      />
      <SummaryRow label="Ethnicity" value={form.ethnicity ?? '—'} />
      <SummaryRow label="Mother height" value={formatHeight(form.motherHeight)} />
      <SummaryRow label="Father height" value={formatHeight(form.fatherHeight)} />
      <SummaryRow
        label="Current height"
        value={form.includeCurrentHeight ? formatHeight(form.currentHeight) : 'Not provided'}
      />
      <SummaryRow label="Foot size" value={formatFootSize(form.footSize)} />
      <SummaryRow label="Workout" value={form.workoutCapacity ?? '—'} />
      <SummaryRow label="Sleep" value={`${form.averageSleepHours ?? '—'} h`} />
      <SummaryRow label="Dream height" value={formatHeight(form.dreamHeight)} />
      <Text style={[styles.body, { marginTop: spacing.md }]}>
        Tap Finish to proceed. Phase 2 will submit and handle readiness.
      </Text>
    </View>
  );

  const renderStep = () => {
    switch (stepIndex) {
      case 1:
        return renderWelcome();
      case 2:
        return renderGender();
      case 3:
        return renderDob();
      case 4:
        return renderEthnicity();
      case 5:
        return renderHeightPicker("Mother's height", 'motherHeight');
      case 6:
        return renderHeightPicker("Father's height", 'fatherHeight');
      case 7:
        return renderCurrentHeight();
      case 8:
        return renderFootSize();
      case 9:
        return renderWorkout();
      case 10:
        return renderSleep();
      case 11:
        return renderHeightPicker('Dream height', 'dreamHeight');
      case 12:
        return renderReview();
      default:
        return null;
    }
  };

  const primaryLabel = stepIndex === steps.length ? 'Finish' : 'Next';

  return (
    <Screen>
      <ProgressDots total={steps.length} current={stepIndex} />
      <StepHeader
        title={steps[stepIndex - 1]}
        subtitle="Complete each step to personalize your plan."
        currentStep={stepIndex}
        totalSteps={steps.length}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
      <View style={styles.footer}>
        {stepIndex > 1 ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
            <Text style={styles.secondaryLabel}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <NeonButton
          label={primaryLabel}
          onPress={goNext}
          style={{ flex: 1, marginLeft: stepIndex > 1 ? spacing.md : 0, opacity: nextEnabled ? 1 : 0.5 }}
        />
      </View>
    </Screen>
  );
};

interface SummaryRowProps {
  label: string;
  value: string;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headline: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginBottom: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSpacing: {
    marginLeft: spacing.sm,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  workoutCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
  },
  workoutCardSelected: {
    borderColor: colors.neonCyan,
  },
  workoutLabel: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryLabel: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
});
