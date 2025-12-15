import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { GlassCard } from '../components/GlassCard';

export const ExercisesScreen: React.FC = () => {
  return (
    <Screen>
      <SectionTitle title="Exercises" />
      <GlassCard>
        <Text style={{ color: '#E6EAF5' }}>Exercises placeholder (text-only list coming later).</Text>
      </GlassCard>
    </Screen>
  );
};
