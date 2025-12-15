import React from 'react';
import { QueryProvider } from './src/hooks/QueryProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View, Text } from 'react-native';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1021' }}>
        <Text style={{ color: '#E6EAF5' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryProvider>
      <AppNavigator />
    </QueryProvider>
  );
}
