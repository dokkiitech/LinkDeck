import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import SettingsScreen from '../screens/settings/SettingsScreen';
import UpgradeAccountScreen from '../screens/settings/UpgradeAccountScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: '設定',
        }}
      />
      <Stack.Screen
        name="UpgradeAccount"
        component={UpgradeAccountScreen}
        options={{
          title: 'アカウント作成',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
