/**
 * HK News App - Main Entry
 * Material 3 Expressive design with Gemini Nano AI integration
 */

import React from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList, MainTabParamList } from './src/types';
import NewsFeedScreen from './src/screens/NewsFeedScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import AIPlaygroundScreen from './src/screens/AIPlaygroundScreen';
import { Colors, DarkColors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  NewsFeed: '📰',
  AIPlayground: '✨',
};

function TabIcon({ name }: { name: string }) {
  return (
    <View>
      {React.createElement(
        require('react-native').Text,
        { style: { fontSize: 22 } },
        TAB_ICONS[name] ?? '●',
      )}
    </View>
  );
}

function MainTabs() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DarkColors : Colors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.outlineVariant,
          borderTopWidth: 1,
          elevation: 0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: () => (
          <TabIcon name={route.name} />
        ),
      })}
    >
      <Tab.Screen
        name="NewsFeed"
        component={NewsFeedScreen}
        options={{ tabBarLabel: '新聞' }}
      />
      <Tab.Screen
        name="AIPlayground"
        component={AIPlaygroundScreen}
        options={{ tabBarLabel: 'AI 試玩' }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DarkColors : Colors;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={C.surface}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: C.surface },
            headerTintColor: C.onSurface,
            headerTitleStyle: { fontWeight: '600', fontSize: 18 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: C.background },
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ArticleDetail"
            component={ArticleDetailScreen}
            options={{
              title: '',
              headerBackTitle: '返回',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
