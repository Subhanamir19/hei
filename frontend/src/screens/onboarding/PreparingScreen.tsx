import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { colors, radii, spacing } from '../../theme/tokens';
import { getHeightReport } from '../../api/height';
import { getActiveRoutine } from '../../api/routine';
import { useAuthStore } from '../../state/auth';
import { useRoute } from '@react-navigation/native';

type Status = 'pending' | 'ready' | 'error';

interface PreparingParams {
  userId: string;
}

export const PreparingScreen: React.FC = () => {
  const route = useRoute<any>();
  const { userId } = route.params as PreparingParams;
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
  const [heightStatus, setHeightStatus] = useState<Status>('pending');
  const [routineStatus, setRoutineStatus] = useState<Status>('pending');
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const poll = async () => {
      attemptsRef.current += 1;
      let heightOk = false;
      let routineOk = false;

      try {
        await getHeightReport(userId);
        heightOk = true;
        setHeightStatus('ready');
      } catch {
        setHeightStatus('pending');
      }

      try {
        await getActiveRoutine(userId);
        routineOk = true;
        setRoutineStatus('ready');
      } catch {
        setRoutineStatus('pending');
      }

      if (heightOk && routineOk) {
        await setOnboardingCompleted(true);
        return;
      }

      if (attemptsRef.current >= 30) {
        setError('Taking longer than expected. Please retry or check your connection.');
        return;
      }

      const nextDelay = Math.min(1000 * Math.pow(1.5, attemptsRef.current), 10000);
      timerRef.current = setTimeout(poll, nextDelay);
    };

    poll();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [setOnboardingCompleted, userId]);

  const renderStatus = (label: string, status: Status) => {
    const color =
      status === 'ready' ? colors.neonMint : status === 'error' ? colors.danger : colors.textSecondary;
    return (
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={[styles.statusValue, { color }]}>
          {status === 'ready' ? 'Ready' : status === 'error' ? 'Error' : 'Preparing'}
        </Text>
      </View>
    );
  };

  return (
    <Screen backgroundColor="#0A0A0A" statusBarStyle="light-content">
      <View style={styles.container}>
        <Text style={styles.title}>Preparing your plan</Text>
        <Text style={styles.subtitle}>
          We&apos;re finalizing your prediction and routine. This usually takes under a minute.
        </Text>
        <View style={styles.card}>
          {renderStatus('Height report', heightStatus)}
          {renderStatus('Routine', routineStatus)}
          <ActivityIndicator color={colors.neonCyan} style={{ marginTop: spacing.lg }} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statusLabel: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  statusValue: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
    fontFamily: 'Poppins_500Medium',
  },
});
