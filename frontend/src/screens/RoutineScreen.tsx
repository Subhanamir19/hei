import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/Screen';
import { radii } from '../theme/tokens';

const palette = {
  background: '#F6EFD9',
  card: '#FFFFFF',
  ink: '#111217',
  muted: '#565B68',
  track: '#E5E7EC',
  purple: '#8A48F6',
  purple2: '#B36DFB',
  green: '#96BF5D',
  shadow: '#000',
  pill: '#EEE8DB',
  border: '#E3E5EA',
};

const shadow = {
  shadowColor: palette.shadow,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

const dates = [
  { day: '2', month: 'Jan' },
  { day: '3', month: 'Jan' },
  { day: '4', month: 'Jan' },
  { day: '5', month: 'Jan', selected: true },
  { day: '6', month: 'Jan' },
  { day: '7', month: 'Jan' },
  { day: '8', month: 'Jan' },
];

const tasks = [
  { title: '1 glass of milk + honey', icon: '🥛 🍯', done: true, streak: 0.85, progress: 0.7 },
  { title: '5m of bar hanging', icon: '🪑', done: false, streak: 0.6, progress: 0.2 },
  { title: 'Consume 2g of fish oil', icon: '🐟', done: true, streak: 0.5, progress: 0.5 },
  { title: '3 x (10) Cobra stretch', icon: '🐍', done: false, streak: 0.65, progress: 0.35 },
  { title: '1500 mg Glucosamine', icon: '💊', done: true, streak: 0.75, progress: 0.6 },
];

export const RoutineScreen: React.FC = () => {
  return (
    <Screen backgroundColor={palette.background} statusBarStyle="dark-content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily Routine</Text>
          <Text style={styles.icon}>⚙️</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesRow}
        >
          {dates.map((d) => (
            <View
              key={`${d.day}-${d.month}`}
              style={[styles.datePill, d.selected && styles.datePillSelected, shadow]}
            >
              <Text style={[styles.dateDay, d.selected && styles.dateDaySelected]}>{d.day}</Text>
              <Text style={[styles.dateMonth, d.selected && styles.dateMonthSelected]}>{d.month}</Text>
            </View>
          ))}
        </ScrollView>

        <LinearGradient
          colors={[palette.purple, palette.purple2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.streakCard, shadow]}
        >
          <Text style={styles.streakLabel}>Streaks 🔥</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakValue}>7</Text>
          </View>
        </LinearGradient>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>In progress</Text>
          <Text style={styles.progressLabel}>5/10</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>

        <View style={styles.list}>
          {tasks.map((task) => (
            <View key={task.title} style={[styles.taskCard, shadow]}>
              <View style={styles.taskRow}>
                <View style={[styles.status, task.done ? styles.statusDone : styles.statusTodo]} />
                <Text style={styles.taskTitle}>
                  {task.title} {task.icon}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFillPurple, { width: `${Math.round(task.streak * 100)}%` }]} />
              </View>
              <View style={[styles.barTrack, { marginTop: 4 }]}>
                <View style={[styles.barFillGreen, { width: `${Math.round(task.progress * 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8, paddingBottom: 24, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: palette.ink },
  icon: { fontSize: 22, color: palette.ink },
  datesRow: { gap: 10, paddingVertical: 4, paddingHorizontal: 4 },
  datePill: {
    width: 64,
    height: 70,
    borderRadius: radii.lg,
    backgroundColor: palette.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  datePillSelected: {
    backgroundColor: '#8C5AF4',
    borderColor: '#8C5AF4',
  },
  dateDay: { fontSize: 20, fontWeight: '700', color: palette.ink },
  dateMonth: { fontSize: 12, fontWeight: '600', color: palette.muted, marginTop: 4 },
  dateDaySelected: { color: '#FFFFFF' },
  dateMonthSelected: { color: '#F3E8FF' },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
  },
  streakLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  streakBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  streakValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  progressLabel: { fontSize: 15, fontWeight: '600', color: palette.ink },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.track,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: palette.purple },
  list: { gap: 12 },
  taskCard: {
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  status: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D0D4DD' },
  statusDone: { backgroundColor: '#0F1115', borderColor: '#0F1115' },
  statusTodo: { backgroundColor: '#FFFFFF' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: palette.ink, flex: 1 },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: palette.track, overflow: 'hidden' },
  barFillPurple: { height: '100%', backgroundColor: palette.purple },
  barFillGreen: { height: '100%', backgroundColor: palette.green },
});
