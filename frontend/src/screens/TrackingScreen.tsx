import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { radii } from '../theme/tokens';

const palette = {
  background: '#F2F4F7',
  card: '#FFFFFF',
  ink: '#1A1B20',
  muted: '#6A6F7A',
  track: '#DDE2E8',
  mint: '#57D3B3',
  purpleOverlay: '#7F55D7',
  silver: '#D9DCE2',
};

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

const tabs = ['Train', 'Program', 'Nutrition'];

const level1Nodes = [
  { label: '🔥', active: true, filled: true },
  { label: 'Day 2', active: true, filled: true },
  { label: 'Day 3', active: false, filled: false },
  { label: 'Day 4', active: false, filled: false },
  { label: 'Day 1', active: false, filled: false },
  { label: 'Day 7', active: false, filled: false },
  { label: '🏆', active: true, filled: true },
  { label: 'Day 5', active: false, filled: false },
];

const level2Nodes = [
  { label: 'Day 1', active: false, filled: false },
  { label: 'Day 2', active: false, filled: false },
  { label: '+', active: false, filled: false },
  { label: '👀', active: false, filled: false },
  { label: 'Day 4', active: false, filled: false },
];

const Node: React.FC<{ label: string; active?: boolean; filled?: boolean }> = ({ label, active, filled }) => (
  <View style={[styles.node, shadow, active && styles.nodeActive, filled && styles.nodeFilled]}>
    <Text style={[styles.nodeLabel, active && styles.nodeLabelActive]}>{label}</Text>
  </View>
);

export const TrackingScreen: React.FC = () => {
  return (
    <Screen backgroundColor={palette.background} statusBarStyle="dark-content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Your plan</Text>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <View style={[styles.segment, shadow]}>
          {tabs.map((t, idx) => (
            <View key={t} style={[styles.segmentItem, idx === 0 && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, idx === 0 && styles.segmentTextActive]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.hero, shadow]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(127,85,215,0.5)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>70 days left</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Level 1 🌶️</Text>
          <Text style={styles.sectionCount}>1/7</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFillMint, { width: '25%' }]} />
        </View>
        <View style={styles.nodeRow}>
          {level1Nodes.slice(0, 4).map((n, i) => (
            <React.Fragment key={`${n.label}-${i}`}>
              <Node label={n.label} active={n.active} filled={n.filled} />
              {i < 3 && <View style={styles.connector} />}
            </React.Fragment>
          ))}
        </View>
        <View style={[styles.nodeRow, { marginTop: 12 }]}>
          {level1Nodes.slice(4).map((n, i) => (
            <React.Fragment key={`${n.label}-${i}`}>
              <Node label={n.label} active={n.active} filled={n.filled} />
              {i < level1Nodes.slice(4).length - 1 && <View style={styles.connector} />}
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 22 }]}>
          <Text style={styles.sectionTitle}>Level 2 🌶️</Text>
          <Text style={styles.sectionCount}>0/7</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFillMint, { width: '0%' }]} />
        </View>
        <View style={styles.nodeRow}>
          {level2Nodes.map((n, i) => (
            <React.Fragment key={`${n.label}-${i}`}>
              <Node label={n.label} active={n.active} filled={n.filled} />
              {i < level2Nodes.length - 1 && <View style={styles.connector} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 12, paddingBottom: 32, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  icon: { fontSize: 22, color: palette.ink },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E6E8ED',
    borderRadius: radii.lg,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  segmentItemActive: { backgroundColor: palette.mint },
  segmentText: { fontSize: 15, fontWeight: '600', color: palette.muted },
  segmentTextActive: { color: '#FFFFFF' },
  hero: {
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: '#999',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  heroBadgeText: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: palette.ink },
  sectionCount: { fontSize: 15, fontWeight: '600', color: palette.muted },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.track,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFillMint: { height: '100%', backgroundColor: palette.mint },
  nodeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  node: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.silver,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: { backgroundColor: palette.mint },
  nodeFilled: {},
  nodeLabel: { fontSize: 14, fontWeight: '600', color: palette.muted },
  nodeLabelActive: { color: '#FFFFFF' },
  connector: {
    height: 4,
    width: 22,
    borderRadius: 999,
    backgroundColor: palette.silver,
  },
});
