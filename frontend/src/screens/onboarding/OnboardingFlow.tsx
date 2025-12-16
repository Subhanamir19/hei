import React, { useMemo, useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Screen } from '../../components/Screen';
import { Chip } from '../../components/Chip';
import { WheelPicker } from '../../components/onboarding/WheelPicker';
import { useAuthStore } from '../../state/auth';
import { colors, radii, spacing } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { submitOnboarding, OnboardingPayload } from '../../api/onboarding';

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
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
  const navigation = useNavigation<any>();

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
        return form.currentHeight.cm >= 100 && form.currentHeight.cm <= 250;
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

  const buildPayload = (): OnboardingPayload => {
    const dateOfBirth = new Date(form.dob.year, form.dob.month - 1, form.dob.day).toISOString();
    return {
      gender: form.gender as string,
      dateOfBirth,
      ethnicity: form.ethnicity as string,
      parentHeightsCm: {
        mother: form.motherHeight.cm,
        father: form.fatherHeight.cm,
      },
      footSizeCm: Number(shoeToCm(form.footSize).toFixed(1)),
      workoutCapacity: form.workoutCapacity as string,
      averageSleepHours: form.averageSleepHours ?? 0,
      dreamHeightCm: form.dreamHeight.cm,
      initialHeightCm: form.currentHeight.cm,
      initialHeightRecordedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await submitOnboarding(payload);
      await setUser(res.userId);
      await setOnboardingCompleted(false);
      navigation.navigate('Preparing', { userId: res.userId });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to submit onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (!nextEnabled || submitting) return;
    if (stepIndex < steps.length) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    void handleSubmit();
  };

  const goBack = () => {
    setStepIndex((prev) => Math.max(1, prev - 1));
  };

  const renderWelcome = () => (
    <View style={styles.card}>
      <Text style={styles.headline}>Build your height plan</Text>
      <Text style={styles.body}>
        We&apos;ll collect a few details to predict your height potential and create your custom plan.
      </Text>
      <OnboardingButton label="Next" onPress={goNext} style={{ marginTop: spacing.xl }} />
    </View>
  );

  const renderGender = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Select your gender</Text>
      <View style={styles.chipWrap}>
        {genderOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setForm((prev) => ({ ...prev, gender: option.value }))}
            style={[
              styles.listCard,
              form.gender === option.value && styles.listCardSelected,
            ]}
          >
            <Text style={styles.listCardText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
    </View>
  );

const renderDob = () => (
  <View style={styles.card}>
    <Text style={styles.sectionLabel}>Date of birth</Text>
    <View style={styles.wheelRow}>
      <View style={styles.wheelColumn}>
        <WheelPicker
          data={monthOptions}
          selectedValue={form.dob.month}
          onChange={(month) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, month } }))}
          renderLabel={(m) => monthNames[m - 1]}
        />
      </View>
      <View style={styles.wheelColumn}>
        <WheelPicker
          data={dayOptions}
          selectedValue={form.dob.day}
          onChange={(day) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, day } }))}
          renderLabel={(d) => `${d}`}
        />
      </View>
      <View style={styles.wheelColumn}>
        <WheelPicker
          data={yearsOptions}
          selectedValue={form.dob.year}
          onChange={(year) => setForm((prev) => ({ ...prev, dob: { ...prev.dob, year } }))}
          renderLabel={(y) => `${y}`}
        />
      </View>
    </View>
    <OnboardingButton label="Next" onPress={goNext} />
  </View>
  );

  const renderEthnicity = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Ethnicity</Text>
      <View style={styles.chipWrap}>
        {ethnicityOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setForm((prev) => ({ ...prev, ethnicity: option.value }))}
            style={[
              styles.listCard,
              form.ethnicity === option.value && styles.listCardSelected,
            ]}
          >
            <Text style={styles.listCardText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
    </View>
  );

const renderHeightPicker = (
  label: string,
  key: 'motherHeight' | 'fatherHeight' | 'currentHeight' | 'dreamHeight',
  wrapCard: boolean = true,
  showButton: boolean = true,
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
            <View style={styles.wheelColumn}>
              <WheelPicker
                data={[...Array(8)].map((_, i) => i + 3)} // 3-10 ft
                selectedValue={height.ft}
                onChange={(ft) => {
                  const cm = toCmFromFeet(ft, height.inches);
                  updateHeight(key, () => ({ ...height, ft, cm }));
                }}
                renderLabel={(ft) => `${ft} ft`}
              />
            </View>
            <View style={styles.wheelColumn}>
              <WheelPicker
                data={[...Array(12)].map((_, i) => i)} // 0-11 in
                selectedValue={height.inches}
                onChange={(inches) => {
                  const cm = toCmFromFeet(height.ft, inches);
                  updateHeight(key, () => ({ ...height, inches, cm }));
                }}
                renderLabel={(inch) => `${inch} in`}
              />
            </View>
          </View>
        )}
        {showButton ? <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} /> : null}
      </View>
    );

    if (!wrapCard) return content;

    return <View style={styles.card}>{content}</View>;
  };

  const renderCurrentHeight = () => (
    <View style={styles.card}>
      {renderHeightPicker('Current height', 'currentHeight', false, false)}
      <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
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
        const toHalf = (val: number) => Math.round(val * 2) / 2;
        if (nextUnit === 'cm') nextValue = clamp(Math.round(cm * 10) / 10, 18, 35);
        if (nextUnit === 'eu') nextValue = clamp(toHalf(cm * 1.5), 34, 55);
        if (nextUnit === 'us_m') nextValue = clamp(toHalf(cm * 1.5 - 23.5), 4, 21.5);
        if (nextUnit === 'us_w') nextValue = clamp(toHalf(cm * 1.5 - 22), 5, 22.5);
        return { ...prev, footSize: { unit: nextUnit, value: nextValue } };
      });
    };

    const renderData = () => {
      if (unit === 'cm') return footSizeCmOptions;
      if (unit === 'eu') return Array.from({ length: 43 }, (_, i) => 34 + i * 0.5); // 34-55 in 0.5
      if (unit === 'us_m') return Array.from({ length: 35 }, (_, i) => 4 + i * 0.5); // 4-21.5
      if (unit === 'us_w') return Array.from({ length: 35 }, (_, i) => 5 + i * 0.5); // 5-22.5
      return footSizeCmOptions;
    };

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>Foot size</Text>
          <View style={styles.rowCenter}>
            {unitOptions.map((opt, idx) => {
              const pillStyle: StyleProp<ViewStyle> = [
                styles.unitChip,
                idx > 0 ? styles.chipSpacing : undefined,
              ];
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={unit === opt.value}
                  onPress={() => setUnit(opt.value)}
                  style={pillStyle}
                />
              );
            })}
          </View>
        </View>
        <Text style={styles.centerLabel}>Select your size</Text>
        <WheelPicker
          data={renderData()}
          selectedValue={form.footSize.value}
          onChange={(value) => updateShoe(() => ({ ...form.footSize, value }))}
          renderLabel={(v) => `${v} ${unit.toUpperCase().replace('_', ' ')}`}
        />
        <Text style={styles.helperText}>{`≈ ${formatFootSize(form.footSize)}`}</Text>
        <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
      </View>
    );
  };

  const renderWorkout = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Workout capacity</Text>
      {workoutOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => setForm((prev) => ({ ...prev, workoutCapacity: opt.value }))}
          style={[
            styles.workoutCard,
            form.workoutCapacity === opt.value && styles.workoutCardSelected,
          ]}
        >
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioOuter,
                form.workoutCapacity === opt.value && styles.radioOuterSelected,
              ]}
            >
              {form.workoutCapacity === opt.value ? <View style={styles.radioInner} /> : null}
            </View>
            <View>
              <Text style={styles.workoutLabel}>{opt.label}</Text>
              <Text style={styles.body}>{opt.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
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
      <OnboardingButton label="Next" onPress={goNext} disabled={!nextEnabled} />
    </View>
  );

  const renderReview = () => (
  <View style={styles.card}>
    <Text style={styles.sectionLabel}>Review</Text>
    <SummaryRow label="Gender" value={form.gender ?? '—'} />
    <SummaryRow
      label="Date of birth"
      value={`${monthNames[form.dob.month - 1]} ${form.dob.day}, ${form.dob.year}`}
    />
    <SummaryRow label="Ethnicity" value={form.ethnicity ?? '—'} />
    <SummaryRow label="Mother height" value={formatHeight(form.motherHeight)} />
    <SummaryRow label="Father height" value={formatHeight(form.fatherHeight)} />
    <SummaryRow label="Current height" value={formatHeight(form.currentHeight)} />
    <SummaryRow label="Foot size" value={formatFootSize(form.footSize)} />
    <SummaryRow label="Workout" value={form.workoutCapacity ?? '—'} />
    <SummaryRow label="Sleep" value={`${form.averageSleepHours ?? '—'} h`} />
    <SummaryRow label="Dream height" value={formatHeight(form.dreamHeight)} />
    <Text style={[styles.body, { marginTop: spacing.md }]}>
      Tap Submit to proceed. We&apos;ll prepare your prediction and routine next.
    </Text>
    {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
    <OnboardingButton
      label={submitting ? 'Submitting...' : 'Submit'}
      onPress={goNext}
      disabled={submitting}
    />
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

  return (
    <Screen backgroundColor="#0A0A0A" statusBarStyle="light-content">
      <Header
        stepIndex={stepIndex}
        totalSteps={steps.length}
        title={steps[stepIndex - 1]}
        onBack={stepIndex > 1 ? goBack : undefined}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {renderStep()}
      </ScrollView>
    </Screen>
  );
};

interface SummaryRowProps {
  label: string;
  value: string;
}

interface HeaderProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ stepIndex, totalSteps, title, onBack }) => {
  const progress = Math.min(stepIndex / totalSteps, 1);
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.langPill}>
          <Text style={styles.langFlag}>US</Text>
          <Text style={styles.langText}>EN</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.headline}>{title}</Text>
      <Text style={styles.body}>
        This will be used to predict your height potential & create your custom plan.
      </Text>
    </View>
  );
};

const OnboardingButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({
  label,
  onPress,
  disabled,
  style,
}) => (
  <Pressable onPress={disabled ? undefined : onPress} style={[style, { opacity: disabled ? 0.5 : 1 }]}>
    <LinearGradient colors={['#A259FF', '#7739F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
      <Text style={styles.primaryLabel}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
  },
  langFlag: { marginRight: spacing.xs, fontSize: 14 },
  langText: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  progressFill: {
    backgroundColor: '#A259FF',
    borderRadius: 999,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headline: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: spacing.sm,
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
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: spacing.md,
  },
  wheelColumn: {
    flex: 1,
  },
  listCard: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: spacing.sm,
  },
  listCardSelected: {
    borderColor: '#A259FF',
  },
  listCardText: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'column',
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
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSpacing: {
    marginLeft: spacing.sm,
  },
  unitChip: {
    minWidth: 64,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  centerLabel: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  workoutCard: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    backgroundColor: '#1A1A1A',
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioOuterSelected: {
    borderColor: '#A259FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A259FF',
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
  error: {
    color: colors.danger,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: spacing.sm,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryLabel: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});




