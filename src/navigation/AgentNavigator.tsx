import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AgentStackParamList } from '../types';
import AgentSearchScreen from '../screens/search/AgentSearchScreen';

const Stack = createNativeStackNavigator<AgentStackParamList>();

const AgentNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AgentSearch"
        component={AgentSearchScreen}
        options={{
          title: 'AIエージェント',
        }}
      />
    </Stack.Navigator>
  );
};

export default AgentNavigator;
