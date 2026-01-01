import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { DialogProvider } from './src/contexts/DialogContext';
import AppNavigator from './src/navigation/AppNavigator';
import SharedURLHandler from './src/components/SharedURLHandler';
import ShareMenuHandler from './src/components/ShareMenuHandler';

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <SharedURLHandler />
        <ShareMenuHandler />
        <AppNavigator />
        <StatusBar style="auto" />
      </DialogProvider>
    </AuthProvider>
  );
}
