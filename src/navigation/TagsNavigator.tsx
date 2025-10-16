import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TagsStackParamList } from '../types';
import TagsScreen from '../screens/links/TagsScreen';
import TagLinksScreen from '../screens/tags/TagLinksScreen';

const Stack = createNativeStackNavigator<TagsStackParamList>();

const TagsNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TagsList"
        component={TagsScreen}
        options={{
          title: 'タグ',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="TagLinks"
        component={TagLinksScreen}
        options={({ route }) => ({
          title: `タグ: ${route.params.tagName}`,
        })}
      />
    </Stack.Navigator>
  );
};

export default TagsNavigator;
