/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import SimpleInterestScreen from './src/screens/SimpleInterestScreen';
import CompoundInterestScreen from './src/screens/CompoundInterestScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { I18nProvider } from './src/i18n/i18n';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <I18nProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen as any}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SimpleInterest"
              component={SimpleInterestScreen}
              options={{ title: 'Simple Interest' }}
            />
            <Stack.Screen
              name="CompoundInterest"
              component={CompoundInterestScreen}
              options={{ title: 'Compound Interest' }}
            />
            <Stack.Screen name="Records" component={RecordsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

export default App;

const localStyles = StyleSheet.create({
  appHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f4f7fb',
    borderBottomWidth: 0,
    elevation: 2,
  },
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: { fontSize: 22, color: '#0b4b7a' },
  appTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#0b4b7a',
  },
});
