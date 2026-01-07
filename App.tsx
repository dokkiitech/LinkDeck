import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DialogProvider } from './src/contexts/DialogContext';
import { MaintenanceProvider, useMaintenanceContext } from './src/contexts/MaintenanceContext';
import AppNavigator from './src/navigation/AppNavigator';
import SharedURLHandler from './src/components/SharedURLHandler';
import MaintenanceScreen from './src/screens/MaintenanceScreen';

function AppContent() {
  const { maintenanceStatus, isLoading } = useMaintenanceContext();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (maintenanceStatus.isMaintenanceMode) {
    return <MaintenanceScreen reason={maintenanceStatus.reason} />;
  }

  return (
    <>
      <SharedURLHandler />
      <AppNavigator />
      <StatusBar style="auto" />
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
});
