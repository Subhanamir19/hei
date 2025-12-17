import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Path, Circle } from "react-native-svg";
import { Screen } from "../components/Screen";
import { useAuthStore } from "../state/auth";
import { getHeightDashboard } from "../api/height";
import { getTrackingSummary } from "../api/tracking";
import { HeightPrediction, TrackingSummary, HeightLog } from "../api/types";

const light = {
  background: "#F8F4EC",
  card: "#FFFFFF",
  cardMuted: "#F2EEE4",
  cardGold: "#F5D9A6",
  cardGoldBorder: "#F0CC83",
  border: "#E2DACA",
  textPrimary: "#121212",
  textSecondary: "#4A4A4A",
  accentPurple: "#9F7BFF",
  accentGreen: "#7CCB6E",
  accentDark: "#0D0A19",
};

const formatHeight = (cm?: number | null): string => {
  if (cm === undefined || cm === null) return "--";
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}"`;
};

const clampPercent = (value?: number | null): number | null => {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, value));
};

const formatInchesDelta = (predCm?: number | null, currentCm?: number | null): string => {
  if (predCm === undefined || predCm === null || currentCm === undefined || currentCm === null) return "--";
  const deltaInches = (predCm - currentCm) / 2.54;
  return `${Math.max(0, deltaInches).toFixed(1)} inches`;
};

export const DashboardScreen: React.FC = () => {
  const userId = useAuthStore((s) => s.userId);

  const {
    data: dashboard,
    isLoading: loadingHeight,
    error: heightError,
    refetch: refetchHeight,
  } = useQuery({
    queryKey: ["height-dashboard", userId],
    queryFn: () => getHeightDashboard(userId as string),
    enabled: Boolean(userId),
  });

  const {
    data: trackingData,
    isLoading: loadingTracking,
    error: trackingError,
    refetch: refetchTracking,
  } = useQuery({
    queryKey: ["tracking-summary", userId],
    queryFn: () => getTrackingSummary(userId as string),
    enabled: Boolean(userId),
  });

  const latestPrediction: HeightPrediction | undefined = dashboard?.latestPrediction;
  const history = useMemo(() => dashboard?.predictionHistory ?? [], [dashboard]);
  const latestHeight: HeightLog | null | undefined = dashboard?.latestHeightLog;
  const dreamHeightCm = dashboard?.dreamHeightCm ?? null;
  const percentile = clampPercent(latestPrediction?.percentile);
  const dreamOdds = clampPercent(latestPrediction?.dreamHeightOddsPercent);
  const growthComplete = clampPercent(latestPrediction?.growthCompletionPercent);

  const ageLabel = useMemo(() => {
    if (!dashboard?.dateOfBirth || !latestPrediction) return null;
    const dob = new Date(dashboard.dateOfBirth);
    const created = new Date(latestPrediction.createdAt);
    const years = (created.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return `${Math.max(0, Math.round(years))}`;
  }, [dashboard?.dateOfBirth, latestPrediction]);

  const chartPath = useMemo(() => {
    if (!history.length) return null;
    const baseY = 140;
    const spread = history.length === 1 ? 1 : history.length - 1;
    const minCm = Math.min(...history.map((p) => p.predictedAdultHeightCm));
    const maxCm = Math.max(...history.map((p) => p.predictedAdultHeightCm));
    const range = Math.max(1, maxCm - minCm);
    const points = history.map((p, idx) => {
      const x = 12 + (idx / spread) * 236;
      const y = baseY - ((p.predictedAdultHeightCm - minCm) / range) * 90;
      return { x, y };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return { d, last: points[points.length - 1], prev: points[points.length - 2] ?? points[points.length - 1] };
  }, [history]);

  const deltaInches = useMemo(() => {
    if (!latestPrediction || history.length < 2) return null;
    const prev = history[history.length - 2];
    const diff = (latestPrediction.predictedAdultHeightCm - prev.predictedAdultHeightCm) / 2.54;
    return diff.toFixed(1);
  }, [history, latestPrediction]);

  const optimizeLabel = formatInchesDelta(latestPrediction?.predictedAdultHeightCm, latestHeight?.heightCm);

  if (!userId) {
    return (
      <Screen backgroundColor={light.background} statusBarStyle="dark-content">
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Complete onboarding to view your dashboard.</Text>
        </View>
      </Screen>
    );
  }

  const showLoading = loadingHeight || loadingTracking;

  return (
    <Screen backgroundColor={light.background} statusBarStyle="dark-content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Last Report</Text>
          </View>
          <TouchableOpacity style={styles.gear} onPress={() => { void refetchHeight(); void refetchTracking(); }}>
            <Text style={styles.gearIcon}>??</Text>
          </TouchableOpacity>
        </View>

        {showLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={light.accentPurple} />
          </View>
        ) : null}

        {heightError ? (
          <Text style={styles.error}>Height data unavailable. Refresh after onboarding.</Text>
        ) : null}

        {trackingError ? (
          <Text style={styles.error}>Tracking data unavailable. Try refreshing.</Text>
        ) : null}

        <View style={styles.tilesRow}>
          <View style={[styles.tile, styles.tileLight]}>
            <Text style={styles.tileLabel}>Current height</Text>
            <Text style={styles.tileValue}>{formatHeight(latestHeight?.heightCm)}</Text>
          </View>
          <View style={[styles.tile, styles.tileGold]}>
            <Text style={[styles.tileLabel, styles.tileLabelDark]}>Predicted height</Text>
            <Text style={[styles.tileValue, styles.tileValueDark]}>
              {formatHeight(latestPrediction?.predictedAdultHeightCm)}
            </Text>
          </View>
        </View>

        <View style={styles.pillButton}>
          <Text style={styles.pillText}>Optimize up to {optimizeLabel}</Text>
          <Text style={styles.checkIcon}>?</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Height / Age</Text>
            {ageLabel ? <Text style={styles.chartBadge}>{ageLabel}</Text> : null}
          </View>
          <View style={styles.chartBody}>
            {chartPath ? (
              <>
                <Svg width="100%" height="140" viewBox="0 0 260 140">
                  <Path d={chartPath.d} stroke={light.accentPurple} strokeWidth={4} fill="none" />
                  <Circle cx={chartPath.last.x} cy={chartPath.last.y} r="12" fill={light.accentDark} stroke={light.accentPurple} strokeWidth={5} />
                </Svg>
                <View style={[styles.callout, styles.calloutLeft]}>
                  <Text style={styles.calloutText}>Monthly update</Text>
                </View>
                <View style={[styles.callout, styles.calloutRight]}>
                  <Text style={styles.calloutText}>{deltaInches ? `+${deltaInches} inches` : "+0.0 inches"}</Text>
                </View>
                <View style={styles.chartBubble}>
                  <Text style={styles.chartBubbleText}>{formatHeight(latestPrediction?.predictedAdultHeightCm)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.chartPlaceholder}>More data needed to plot</Text>
            )}
          </View>
        </View>

        <View style={styles.percentPill}>
          <Text style={styles.percentPillText}>
            Taller than {percentile ?? "--"}% of your age ??
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricShadow]}>
            <Text style={styles.metricLabel}>Dream height odds</Text>
            <Text style={styles.metricValue}>{dreamOdds !== null ? `${dreamOdds}%` : "--"}</Text>
            <View style={[styles.progressBar, { backgroundColor: "#E9F5E5" }]}>
              <View style={[styles.progressFill, { width: `${dreamOdds ?? 0}%`, backgroundColor: light.accentGreen }]} />
            </View>
            {dreamHeightCm ? (
              <Text style={styles.metricSub}>({formatHeight(dreamHeightCm)})</Text>
            ) : null}
          </View>
          <View style={[styles.metricCard, styles.metricShadow]}>
            <Text style={styles.metricLabel}>Growth complete</Text>
            <Text style={styles.metricValue}>{growthComplete !== null ? `${growthComplete}%` : "--"}</Text>
            <View style={[styles.progressBar, { backgroundColor: "#EFE8FF" }]}>
              <View style={[styles.progressFill, { width: `${growthComplete ?? 0}%`, backgroundColor: light.accentPurple }]} />
            </View>
            <Text style={styles.metricSub}>Progress toward predicted height</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, paddingHorizontal: 16, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backIcon: { fontSize: 26, color: light.textPrimary },
  gear: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: light.border,
  },
  gearIcon: { fontSize: 18 },
  title: {
    fontSize: 28,
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: light.textPrimary,
    fontFamily: "Poppins_600SemiBold",
  },
  error: {
    color: "#C0392B",
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tileLight: { backgroundColor: light.card },
  tileGold: { backgroundColor: light.cardGold, borderColor: light.cardGoldBorder },
  tileLabel: {
    color: light.textSecondary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 4,
  },
  tileLabelDark: { color: "#3C2A12" },
  tileValue: {
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
  },
  tileValueDark: { color: "#2B1A08" },
  pillButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: light.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: light.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pillText: {
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  checkIcon: { fontSize: 16, color: light.textPrimary },
  chartCard: {
    marginTop: 6,
    backgroundColor: light.accentDark,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chartTitle: {
    color: "#F6F2FF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  chartBadge: {
    color: "#F6F2FF",
    fontFamily: "Poppins_600SemiBold",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chartBody: {
    position: "relative",
    height: 150,
    justifyContent: "center",
  },
  chartPlaceholder: {
    color: "#C7C4D7",
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
  },
  callout: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  calloutLeft: {
    left: -6,
    bottom: 38,
  },
  calloutRight: {
    right: -6,
    bottom: 20,
  },
  calloutText: {
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
  },
  chartBubble: {
    position: "absolute",
    top: 10,
    left: "48%",
    transform: [{ translateX: -20 }],
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  chartBubbleText: {
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  percentPill: {
    marginTop: 6,
    backgroundColor: light.accentDark,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  percentPillText: {
    color: "#F5F3FF",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: light.border,
  },
  metricShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  metricLabel: {
    color: light.textSecondary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    color: light.textPrimary,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  metricSub: {
    color: light.textSecondary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});
