import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import LinksNavigator from './LinksNavigator';
import TagsNavigator from './TagsNavigator';
import AgentNavigator from './AgentNavigator';
import SettingsNavigator from './SettingsNavigator';
import { getGeminiApiKey } from '../utils/storage';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const apiKey = await getGeminiApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      setHasApiKey(false);
    }
  };

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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="link" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tags"
        component={TagsNavigator}
        options={{
          headerShown: false,
          title: 'タグ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags" size={size} color={color} />
          ),
        }}
      />
      {hasApiKey && (
        <Tab.Screen
          name="Agent"
          component={AgentNavigator}
          options={{
            headerShown: false,
            title: 'エージェント',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          headerShown: false,
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
