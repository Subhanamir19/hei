import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../state/auth';
import { OnboardingFlow } from '../screens/onboarding/OnboardingFlow';
import { PreparingScreen } from '../screens/onboarding/PreparingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RoutineScreen } from '../screens/RoutineScreen';
import { TrackingScreen } from '../screens/TrackingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ExercisesScreen } from '../screens/ExercisesScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const MainTabs = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#11162A', borderTopColor: '#1F2A44' },
      tabBarActiveTintColor: '#9EF01A',
      tabBarInactiveTintColor: '#A8B2D1',
    }}
  >
    <Tabs.Screen name="Dashboard" component={DashboardScreen} />
    <Tabs.Screen name="Routine" component={RoutineScreen} />
    <Tabs.Screen name="Tracking" component={TrackingScreen} />
    <Tabs.Screen name="Exercises" component={ExercisesScreen} />
    <Tabs.Screen name="Profile" component={ProfileScreen} />
  </Tabs.Navigator>
);

export const AppNavigator: React.FC = () => {
  const userId = useAuthStore((s) => s.userId);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const hydrateAuth = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  const shouldShowMain = userId && onboardingCompleted;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!shouldShowMain ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingFlow} />
            <Stack.Screen name="Preparing" component={PreparingScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
