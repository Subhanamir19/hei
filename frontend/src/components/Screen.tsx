import React from 'react';
import { SafeAreaView, View, StatusBar, StyleSheet, StatusBarStyle } from 'react-native';
import { colors } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  backgroundColor = colors.background,
  statusBarStyle = 'light-content',
}) => (
  <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
    <StatusBar barStyle={statusBarStyle} />
    <View style={[styles.container, { backgroundColor }]}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
});
