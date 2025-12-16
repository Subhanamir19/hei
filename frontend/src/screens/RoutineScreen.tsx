import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, shadows } from '../theme/tokens';
import { useAuthStore } from '../state/auth';
import { getActiveRoutine } from '../api/routine';
import { createTaskLog } from '../api/tracking';
import { Routine, RoutineTask, CreateTaskLogResponse } from '../api/types';

const TaskBadge: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

const TaskCard: React.FC<{
  task: RoutineTask;
  onComplete: () => void;
  isLoading: boolean;
  lastLogged?: boolean;
}> = ({ task, onComplete, isLoading, lastLogged }) => (
  <View style={[styles.taskCard, lastLogged && styles.taskCardHighlight]}>
    <View style={styles.taskHeader}>
      <Text style={styles.taskTitle}>{task.name}</Text>
      <TaskBadge label={task.type} />
    </View>
    <Text style={styles.taskMeta}>
      {task.reps ? `${task.reps} reps` : ''}{task.reps && task.durationMinutes ? ' · ' : ''}
      {task.durationMinutes ? `${task.durationMinutes} min` : ''}
    </Text>
    <TouchableOpacity
      style={[styles.primaryButton, isLoading && { opacity: 0.6 }]}
      onPress={isLoading ? undefined : onComplete}
    >
      <Text style={styles.primaryButtonText}>{isLoading ? 'Logging...' : 'Mark done'}</Text>
    </TouchableOpacity>
  </View>
);

export const RoutineScreen: React.FC = () => {
  const userId = useAuthStore((s) => s.userId);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [lastLoggedTaskId, setLastLoggedTaskId] = useState<string | null>(null);

  const {
    data: routineData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['routine', userId],
    queryFn: () => getActiveRoutine(userId as string),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (routineData?.routine?.routineDays?.length) {
      setSelectedDay(routineData.routine.routineDays[0].index);
    }
  }, [routineData]);

  const routine: Routine | undefined = routineData?.routine;

  const tasksForDay: RoutineTask[] = useMemo(() => {
    if (!routine) return [];
    const day = routine.routineDays.find((d) => d.index === selectedDay);
    return (day?.routineTasks ?? []) as RoutineTask[];
  }, [routine, selectedDay]);

  const logMutation = useMutation<CreateTaskLogResponse, Error, string>({
    mutationFn: async (taskId: string) => {
      if (!userId || !routine) throw new Error('Missing user or routine');
      return createTaskLog(userId, {
        routineId: routine.id,
        dayIndex: selectedDay,
        taskId,
        date: new Date().toISOString(),
        completed: true,
      });
    },
    onSuccess: (_res, taskId) => {
      setLastLoggedTaskId(taskId);
    },
  });

  if (!userId) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>Complete onboarding to view your routine.</Text>
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
          <View>
            <Text style={styles.title}>Routine</Text>
            {routine ? (
              <Text style={styles.subtitle}>
                {routine.month} · {routine.status === 'recovery' ? 'Recovery' : 'Active'}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => void refetch()}>
            <Text style={styles.refresh}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.neonCyan} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>No routine yet. Finish onboarding to generate one.</Text> : null}

        {routine ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysRow}
            >
              {routine.routineDays.map((day) => (
                <TouchableOpacity
                  key={day.index}
                  style={[
                    styles.dayPill,
                    day.index === selectedDay && styles.dayPillSelected,
                  ]}
                  onPress={() => setSelectedDay(day.index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      day.index === selectedDay && styles.dayTextSelected,
                    ]}
                  >
                    Day {day.index}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.tasksContainer}>
              <Text style={styles.sectionLabel}>Tasks</Text>
              {tasksForDay.length === 0 ? (
                <Text style={styles.body}>No tasks for this day.</Text>
              ) : (
                tasksForDay.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => logMutation.mutate(task.id)}
                    isLoading={logMutation.isPending && logMutation.variables === task.id}
                    lastLogged={lastLoggedTaskId === task.id}
                  />
                ))
              )}
            </View>
          </>
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
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  refresh: { color: colors.neonCyan, fontFamily: 'Poppins_600SemiBold' },
  daysRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  dayPillSelected: {
    backgroundColor: colors.neonCyan,
    borderColor: colors.neonCyan,
  },
  dayText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
  },
  dayTextSelected: {
    color: '#0A0A0A',
  },
  tasksContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  taskCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  taskCardHighlight: {
    borderColor: colors.neonMint,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  taskMeta: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  error: {
    color: colors.danger,
    fontFamily: 'Poppins_500Medium',
  },
});
