import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { GlassCard } from '../components/GlassCard';

export const ProfileScreen: React.FC = () => {
  return (
    <Screen>
      <SectionTitle title="Profile / Settings" />
      <GlassCard>
        <Text style={{ color: '#E6EAF5' }}>Settings & subscription placeholder.</Text>
      </GlassCard>
    </Screen>
  );
};
