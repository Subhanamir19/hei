import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { radii } from '../theme/tokens';

const palette = {
  background: '#F6EFD9',
  card: '#FFFFFF',
  cardAlt: '#F6D9AC',
  ink: '#111217',
  muted: '#565B68',
  divider: '#E2E4EA',
  track: '#E7E9EF',
  purple: '#8A48F6',
  purple2: '#B36DFB',
  green: '#96BF5D',
  blackCard: '#0E0A16',
};

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export const DashboardScreen: React.FC = () => {
  return (
    <Screen backgroundColor={palette.background} statusBarStyle="dark-content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>‹</Text>
          <Text style={styles.title}>Last Report</Text>
          <Text style={styles.icon}>⚙️</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current height</Text>
            <Text style={styles.statValue}>5&apos;11&quot;</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAlt]}>
            <Text style={[styles.statLabel, { color: palette.ink }]}>Predicted height</Text>
            <Text style={[styles.statValue, { color: palette.ink }]}>6&apos;2&quot;</Text>
          </View>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaText}>Optimize up to 1.1 inches ☑️</Text>
        </View>

        <View style={[styles.chartCard, shadow]}>
          <Text style={styles.chartTitle}>Height / Age</Text>
          <Svg width="100%" height="170" viewBox="0 0 320 170">
            <Path
              d="M16 140 C 90 120, 150 115, 205 95 S 280 70 304 62"
              stroke={palette.purple2}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx="168" cy="108" r="12" fill={palette.background} stroke={palette.purple} strokeWidth={6} />
            <Circle cx="168" cy="108" r="5" fill={palette.purple} />
          </Svg>
          <View style={[styles.callout, styles.calloutLeft]}>
            <Text style={styles.calloutText}>Monthly update</Text>
          </View>
          <View style={[styles.callout, styles.calloutRight]}>
            <Text style={styles.calloutText}>+0.1 inches</Text>
          </View>
        </View>

        <View style={[styles.rankPill, shadow]}>
          <Text style={styles.rankText}>Taller than 76.7% of your age 🌐</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metricCard, shadow]}>
            <Text style={styles.metricLabel}>Dream height odds</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>68%</Text>
              <Text style={styles.metricSub}>(6&apos;3&quot;)</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFillGreen, { width: '68%' }]} />
            </View>
          </View>
          <View style={[styles.metricCard, shadow]}>
            <Text style={styles.metricLabel}>Growth complete</Text>
            <Text style={styles.metricValue}>89.8%</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFillPurple, { width: '90%' }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8, paddingBottom: 32, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  icon: { fontSize: 22, color: palette.ink },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink, flex: 1, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.divider,
    ...shadow,
  },
  statCardAlt: { backgroundColor: palette.cardAlt, borderColor: palette.cardAlt },
  statLabel: { fontSize: 12, color: palette.muted, fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 28, color: palette.ink, fontWeight: '700' },
  ctaCard: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.divider,
    ...shadow,
  },
  ctaText: { fontSize: 16, fontWeight: '600', color: palette.ink },
  chartCard: {
    backgroundColor: palette.blackCard,
    borderRadius: radii.lg,
    padding: 16,
    position: 'relative',
  },
  chartTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  callout: {
    position: 'absolute',
    backgroundColor: palette.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    ...shadow,
  },
  calloutLeft: { top: 10, left: 14 },
  calloutRight: { bottom: 12, right: 14 },
  calloutText: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  rankPill: {
    backgroundColor: '#0F0D16',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  rankText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  metricLabel: { fontSize: 12, fontWeight: '600', color: palette.muted, marginBottom: 8 },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: '700', color: palette.ink },
  metricSub: { fontSize: 13, fontWeight: '600', color: palette.muted },
  barTrack: { height: 10, borderRadius: 999, backgroundColor: palette.track, overflow: 'hidden' },
  barFillGreen: { height: '100%', backgroundColor: palette.green },
  barFillPurple: { height: '100%', backgroundColor: palette.purple },
});
