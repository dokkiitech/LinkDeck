import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinksStackParamList } from '../types';
import LinksListScreen from '../screens/links/LinksListScreen';
import LinkDetailScreen from '../screens/links/LinkDetailScreen';

const Stack = createNativeStackNavigator<LinksStackParamList>();

const LinksNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LinksList"
        component={LinksListScreen}
        options={{
          title: 'リンク一覧',
        }}
      />
      <Stack.Screen
        name="LinkDetail"
        component={LinkDetailScreen}
        options={{
          title: 'リンク詳細',
        }}
      />
    </Stack.Navigator>
  );
};

export default LinksNavigator;
