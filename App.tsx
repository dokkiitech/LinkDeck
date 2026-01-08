import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DialogProvider } from './src/contexts/DialogContext';
import { MaintenanceProvider, useMaintenanceContext } from './src/contexts/MaintenanceContext';
import AppNavigator from './src/navigation/AppNavigator';
import SharedURLHandler from './src/components/SharedURLHandler';
import MaintenanceScreen from './src/screens/MaintenanceScreen';

function AppContent() {
  const { shouldShowMaintenance, isLoading, maintenanceStatus, isDeveloperUser } = useMaintenanceContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // メンテナンス中かつ開発者でない場合のみメンテナンス画面を表示
  if (shouldShowMaintenance) {
    return <MaintenanceScreen reason={maintenanceStatus.reason} />;
  }

  // 開発者の場合は、メンテナンス中でも通常画面を表示
  return (
    <>
      <SharedURLHandler />
      <AppNavigator />
      <StatusBar style="auto" />
      {/* 開発者がメンテナンス中にアクセスしている場合は小さいバナーを表示 */}
      {maintenanceStatus.isMaintenanceMode && isDeveloperUser && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>🔧 メンテナンス中（開発者モード）</Text>
        </View>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <MaintenanceProvider>
          <AppContent />
        </MaintenanceProvider>
      </DialogProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  devBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fbd38d',
    padding: 8,
    zIndex: 9999,
  },
  devBannerText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#744210',
  },
});
