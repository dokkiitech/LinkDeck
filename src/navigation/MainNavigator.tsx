import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import LinksNavigator from './LinksNavigator';
import TagsNavigator from './TagsNavigator';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Links"
        component={LinksNavigator}
        options={{
          headerShown: false,
          title: 'リンク',
        }}
      />
      <Tab.Screen
        name="Tags"
        component={TagsNavigator}
        options={{
          headerShown: false,
          title: 'タグ',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
