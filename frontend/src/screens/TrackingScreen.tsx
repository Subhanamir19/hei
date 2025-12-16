import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, shadows } from '../theme/tokens';
import { useAuthStore } from '../state/auth';
import { getTrackingSummary } from '../api/tracking';
import { reportPain } from '../api/pain';
import { sendAiCoachMessage } from '../api/aiCoach';
import { TrackingSummary, PainSeverity } from '../api/types';

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

export const TrackingScreen: React.FC = () => {
  const userId = useAuthStore((s) => s.userId);
  const [painArea, setPainArea] = useState('');
  const [painSeverity, setPainSeverity] = useState<PainSeverity>('mild');
  const [painNotes, setPainNotes] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [coachReply, setCoachReply] = useState<string | null>(null);

  const {
    data: summaryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tracking', userId],
    queryFn: () => getTrackingSummary(userId as string),
    enabled: Boolean(userId),
  });

  const summary: TrackingSummary | undefined = summaryData?.trackingSummary;

  const painMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Missing user');
      return reportPain(userId, {
        area: painArea.trim(),
        severity: painSeverity,
        notes: painNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setPainArea('');
      setPainNotes('');
      void refetch();
    },
  });

  const coachMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Missing user');
      const res = await sendAiCoachMessage(userId, coachMessage);
      setCoachReply(res.reply);
    },
  });

  if (!userId) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>Complete onboarding to view tracking.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tracking</Text>
          <TouchableOpacity onPress={() => void refetch()}>
            <Text style={styles.refresh}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.neonCyan} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>Unable to load tracking summary.</Text> : null}

        {summary ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>This week</Text>
            <View style={styles.summaryRow}>
              <SummaryCard label="Completion" value={`${summary.currentWeekCompletionPercent}%`} />
              <SummaryCard
                label="Consistency delta"
                value={`${summary.consistencyDeltaPercent > 0 ? '+' : ''}${summary.consistencyDeltaPercent}%`}
              />
            </View>
            <View style={styles.summaryRow}>
              <SummaryCard label="Total tasks" value={`${summary.totalTasksCompleted}`} />
              <SummaryCard label="Active streak" value={`${summary.activeStreakDays} days`} />
            </View>
            <View style={styles.summaryRow}>
              <SummaryCard label="Pain events" value={`${summary.totalPainEvents}`} />
              <SummaryCard label="Recovery days" value={`${summary.recoveryDaysThisWeek}`} />
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Report pain</Text>
          <TextInput
            placeholder="Area (e.g., lower back)"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={painArea}
            onChangeText={setPainArea}
          />
          <View style={styles.pillRow}>
            {(['mild', 'moderate', 'severe'] as PainSeverity[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.pill,
                  painSeverity === level && styles.pillSelected,
                ]}
                onPress={() => setPainSeverity(level)}
              >
                <Text
                  style={[
                    styles.pillText,
                    painSeverity === level && styles.pillTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { minHeight: 80 }]}
            value={painNotes}
            onChangeText={setPainNotes}
            multiline
          />
          <TouchableOpacity
            style={[styles.primaryButton, painMutation.isPending && { opacity: 0.6 }]}
            onPress={() => {
              if (painMutation.isPending || !painArea.trim()) return;
              painMutation.mutate();
            }}
          >
            <Text style={styles.primaryButtonText}>
              {painMutation.isPending ? 'Sending...' : 'Submit pain report'}
            </Text>
          </TouchableOpacity>
          {painMutation.error ? <Text style={styles.error}>Failed to submit pain event.</Text> : null}
          {painMutation.isSuccess ? (
            <Text style={styles.success}>Pain event logged and recovery routine queued.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>AI coach</Text>
          <TextInput
            placeholder="Ask a question or request guidance"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={coachMessage}
            onChangeText={setCoachMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.primaryButton, coachMutation.isPending && { opacity: 0.6 }]}
            onPress={() => {
              if (coachMutation.isPending || !coachMessage.trim()) return;
              coachMutation.mutate();
            }}
          >
            <Text style={styles.primaryButtonText}>
              {coachMutation.isPending ? 'Sending...' : 'Send to coach'}
            </Text>
          </TouchableOpacity>
          {coachReply ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Coach reply</Text>
              <Text style={styles.replyText}>{coachReply}</Text>
            </View>
          ) : null}
          {coachMutation.error ? <Text style={styles.error}>Coach unavailable right now.</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  refresh: { color: colors.neonCyan, fontFamily: 'Poppins_600SemiBold' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  pillSelected: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
  },
  pillTextSelected: {
    color: '#0A0A0A',
  },
  primaryButton: {
    backgroundColor: colors.neonCyan,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0A0A0A',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  replyBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  replyLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: spacing.xs,
  },
  replyText: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.danger,
    fontFamily: 'Poppins_500Medium',
  },
  success: {
    color: colors.neonMint,
    fontFamily: 'Poppins_600SemiBold',
  },
});
