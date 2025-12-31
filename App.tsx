import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import SharedURLHandler from './src/components/SharedURLHandler';
import { useFonts, IBMPlexMono_400Regular, IBMPlexMono_700Bold } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <SharedURLHandler />
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
