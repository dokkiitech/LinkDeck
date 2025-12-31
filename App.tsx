import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { DialogProvider } from './src/contexts/DialogContext';
import AppNavigator from './src/navigation/AppNavigator';
import SharedURLHandler from './src/components/SharedURLHandler';

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <SharedURLHandler />
        <AppNavigator />
        <StatusBar style="auto" />
      </DialogProvider>
    </AuthProvider>
  );
}
