import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from '../hooks/QueryProvider';

interface Props {
  children: React.ReactNode;
}

// Global providers and layout shell to keep root composition consistent.
export const AppProviders: React.FC<Props> = ({ children }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryProvider>{children}</QueryProvider>
  </GestureHandlerRootView>
);
