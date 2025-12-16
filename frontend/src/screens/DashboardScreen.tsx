import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, shadows } from '../theme/tokens';
import { useAuthStore } from '../state/auth';
import { getHeightDashboard } from '../api/height';
import { getTrackingSummary } from '../api/tracking';
import { HeightPrediction, TrackingSummary, HeightLog } from '../api/types';

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
    data: dashboard,
    isLoading: loadingHeight,
    error: heightError,
    refetch: refetchHeight,
  } = useQuery({
    queryKey: ['height-dashboard', userId],
    queryFn: () => getHeightDashboard(userId as string),
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

  const latestPrediction: HeightPrediction | undefined = dashboard?.latestPrediction;
  const history = useMemo(() => dashboard?.predictionHistory ?? [], [dashboard]);
  const latestHeight: HeightLog | null | undefined = dashboard?.latestHeightLog;
  const dreamHeightCm = dashboard?.dreamHeightCm ?? null;
  const dobIso = dashboard?.dateOfBirth ?? null;
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
  const heightDeltaToDream =
    dreamHeightCm && latestPrediction
      ? Math.max(0, dreamHeightCm - latestPrediction.predictedAdultHeightCm)
      : null;

  const latestPoint = history.length ? history[history.length - 1] : null;
  const prevPoint = history.length > 1 ? history[history.length - 2] : null;
  const deltaInches =
    latestPoint && prevPoint
      ? ((latestPoint.predictedAdultHeightCm - prevPoint.predictedAdultHeightCm) / 2.54).toFixed(1)
      : null;

  const ageLabel = (() => {
    if (!dobIso || !latestPoint) return null;
    const dob = new Date(dobIso);
    const created = new Date(latestPoint.createdAt);
    const years = (created.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return years.toFixed(0);
  })();

  const chartPath = (() => {
    if (history.length < 2) return null;
    const points = history.map((p, idx) => {
      const x = 16 + idx * 30;
      const y = 140 - (p.predictedAdultHeightCm - history[0].predictedAdultHeightCm) * 0.5;
      return { x, y };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  })();

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
          <>
        <View style={styles.topRow}>
          <View style={[styles.statTile, styles.cardLight]}>
            <Text style={styles.tileLabel}>Current height</Text>
            <Text style={styles.tileValue}>
              {latestHeight ? formatHeight(latestHeight.heightCm) : '--'}
            </Text>
          </View>
          <View style={[styles.statTile, styles.cardGold]}>
            <Text style={[styles.tileLabel, { color: '#2B1C09' }]}>Predicted height</Text>
            <Text style={[styles.tileValue, { color: '#2B1C09' }]}>
              {formatHeight(latestPrediction.predictedAdultHeightCm + 5.08)}
            </Text>
          </View>
        </View>

            {heightDeltaToDream !== null ? (
              <View style={styles.ctaCard}>
                <Text style={styles.ctaText}>
                  Optimize up to {(heightDeltaToDream / 2.54).toFixed(1)} inches
                </Text>
                <Text style={styles.ctaCheck}>✓</Text>
              </View>
            ) : null}

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Height / Age</Text>
                {ageLabel ? <Text style={styles.chartBadge}>{ageLabel}</Text> : null}
              </View>
              <View style={styles.chartBody}>
                {chartPath ? (
                  <Svg width="100%" height="140" viewBox="0 0 260 140">
                    <Path d={chartPath} stroke="#A78BFA" strokeWidth={4} fill="none" />
                    <Circle cx="130" cy="70" r="12" fill="#0F0C19" stroke="#A78BFA" strokeWidth={5} />
                  </Svg>
                ) : (
                  <Text style={styles.chartPlaceholder}>More data needed to plot</Text>
                )}
                <View style={styles.calloutLeft}>
                  <Text style={styles.calloutText}>Monthly update</Text>
                </View>
                {deltaInches ? (
                  <View style={styles.calloutRight}>
                    <Text style={styles.calloutText}>+{deltaInches} inches</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Taller than {latestPrediction.percentile}% of your age
              </Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.metricCard, styles.cardLight]}>
                <Text style={[styles.metricLabel, { color: '#2B2C30' }]}>Dream height odds</Text>
                <View style={styles.metricValueRow}>
                  <Text style={[styles.metricValue, { color: '#2B2C30' }]}>
                    {latestPrediction.dreamHeightOddsPercent}%
                  </Text>
                  {dreamHeightCm ? (
                    <Text style={[styles.metricSub, { color: '#2B2C30' }]}>
                      ({formatHeight(dreamHeightCm)})
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.metricCard, styles.cardLight]}>
                <Text style={[styles.metricLabel, { color: '#2B2C30' }]}>Growth complete</Text>
                <Text style={[styles.metricValue, { color: '#2B2C30' }]}>
                  {latestPrediction.growthCompletionPercent}%
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {history.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Prediction history</Text>
            {history.map((p) => (
              <View key={p.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>{formatDate(p.createdAt)}</Text>
              <Text style={styles.historyHeight}>{formatHeight(p.predictedAdultHeightCm + 5.08)}</Text>
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
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statTile: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardLight: {
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#E7E2D6',
  },
  cardGold: {
    backgroundColor: '#F8E4C8',
    borderWidth: 1,
    borderColor: '#F1D7AF',
  },
  tileLabel: {
    color: '#2B2C30',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  tileValue: {
    color: '#0F1014',
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
  },
  ctaCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDFBF6',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#E7E2D6',
    ...shadows.card,
  },
  ctaText: {
    color: '#2B2C30',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  ctaCheck: {
    color: '#2B2C30',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  chartCard: {
    marginTop: spacing.md,
    backgroundColor: '#0F0C19',
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    color: '#EDE9FF',
    fontFamily: 'Poppins_600SemiBold',
  },
  chartBadge: {
    color: '#EDE9FF',
    fontFamily: 'Poppins_600SemiBold',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  chartBody: {
    position: 'relative',
    height: 140,
    justifyContent: 'center',
  },
  chartPlaceholder: {
    color: '#C7C4D7',
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
  },
  calloutLeft: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#F7F5F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    ...shadows.card,
  },
  calloutRight: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#F7F5F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    ...shadows.card,
  },
  calloutText: {
    color: '#2B2C30',
    fontFamily: 'Poppins_600SemiBold',
  },
  pill: {
    marginTop: spacing.md,
    backgroundColor: '#0F0C19',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pillText: {
    color: '#EDE9FF',
    fontFamily: 'Poppins_700Bold',
  },
  metricRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  metricCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E7E2D6',
  },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#2B2C30', marginBottom: spacing.xs },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  metricValue: { fontSize: 22, fontWeight: '700', color: '#2B2C30' },
  metricSub: { fontSize: 13, fontWeight: '600', color: '#3C3E45' },
});
