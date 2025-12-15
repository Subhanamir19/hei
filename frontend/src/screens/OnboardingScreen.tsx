import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { NeonButton } from '../components/NeonButton';
import { useAuthStore } from '../state/auth';

export const OnboardingScreen: React.FC = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const handleSubmit = async () => {
    // Placeholder: normally call API
    await setUser('demo-user');
    await setOnboardingCompleted(true);
  };

  return (
    <Screen>
      <SectionTitle title="Onboarding" />
      <Text style={{ color: '#E6EAF5', marginBottom: 16 }}>
        Placeholder onboarding form. Submit to simulate completion.
      </Text>
      <NeonButton label="Submit" onPress={handleSubmit} />
    </Screen>
  );
};
