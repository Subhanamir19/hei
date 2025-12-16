import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, shadows } from '../theme/tokens';
import { useAuthStore } from '../state/auth';
import { getHeightReport } from '../api/height';
import { getTrackingSummary } from '../api/tracking';
import { HeightPrediction, TrackingSummary } from '../api/types';

const formatHeight = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}" (${cm} cm)`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const DashboardScreen: React.FC = () => {
  const userId = useAuthStore((s) => s.userId);

  const {
    data: heightReport,
    isLoading: loadingHeight,
    error: heightError,
    refetch: refetchHeight,
  } = useQuery({
    queryKey: ['height-report', userId],
    queryFn: () => getHeightReport(userId as string),
    enabled: Boolean(userId),
  });

  const {
    data: trackingData,
    isLoading: loadingTracking,
    error: trackingError,
    refetch: refetchTracking,
  } = useQuery({
    queryKey: ['tracking-summary', userId],
    queryFn: () => getTrackingSummary(userId as string),
    enabled: Boolean(userId),
  });

  const latestPrediction: HeightPrediction | undefined = heightReport?.latestPrediction;
  const history = useMemo(() => heightReport?.predictionHistory ?? [], [heightReport]);
  const tracking: TrackingSummary | undefined = trackingData?.trackingSummary;

  if (!userId) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>Complete onboarding to view your dashboard.</Text>
        </View>
      </Screen>
    );
  }

  const showLoading = loadingHeight || loadingTracking;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity onPress={() => { void refetchHeight(); void refetchTracking(); }}>
            <Text style={styles.refresh}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {showLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.neonCyan} />
          </View>
        ) : null}

        {heightError ? (
          <Text style={styles.error}>Height data unavailable. Pull to refresh after onboarding.</Text>
        ) : null}

        {trackingError ? (
          <Text style={styles.error}>Tracking data unavailable. Try refreshing.</Text>
        ) : null}

        {latestPrediction ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Height prediction</Text>
            <View style={styles.statRow}>
              <StatCard label="Predicted adult height" value={formatHeight(latestPrediction.predictedAdultHeightCm)} />
              <StatCard label="Percentile" value={`${latestPrediction.percentile}%`} />
            </View>
            <View style={[styles.statRow, { marginTop: spacing.sm }]}>
              <StatCard label="Dream height odds" value={`${latestPrediction.dreamHeightOddsPercent}%`} />
              <StatCard label="Growth completion" value={`${latestPrediction.growthCompletionPercent}%`} />
            </View>
          </View>
        ) : null}

        {history.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Prediction history</Text>
            {history.map((p) => (
              <View key={p.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>{formatDate(p.createdAt)}</Text>
                  <Text style={styles.historyHeight}>{formatHeight(p.predictedAdultHeightCm)}</Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>{p.percentile} %ile</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tracking ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Tracking summary</Text>
            <View style={styles.statRow}>
              <StatCard label="This week" value={`${tracking.currentWeekCompletionPercent}%`} />
              <StatCard
                label="Consistency delta"
                value={`${tracking.consistencyDeltaPercent > 0 ? '+' : ''}${tracking.consistencyDeltaPercent}%`}
              />
            </View>
            <View style={[styles.statRow, { marginTop: spacing.sm }]}>
              <StatCard label="Total tasks done" value={`${tracking.totalTasksCompleted}`} />
              <StatCard label="Pain events" value={`${tracking.totalPainEvents}`} />
            </View>
            <View style={[styles.statRow, { marginTop: spacing.sm }]}>
              <StatCard label="Active streak" value={`${tracking.activeStreakDays} days`} />
              <StatCard label="Recovery days" value={`${tracking.recoveryDaysThisWeek}`} />
            </View>
          </View>
        ) : null}
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
  refresh: {
    color: colors.neonCyan,
    fontFamily: 'Poppins_600SemiBold',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  historyHeight: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
  },
  historyBadge: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyBadgeText: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
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
});
