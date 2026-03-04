import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {PrinterProvider} from './src/context/PrinterContext';
import {ThemeProvider} from './src/context/ThemeContext';
import {useTheme} from './src/context/ThemeContext';

import HomeScreen from './src/screens/HomeScreen';
import EditorScreen from './src/screens/EditorScreen';
import PrinterScreen from './src/screens/PrinterScreen';
import PreviewScreen from './src/screens/PreviewScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {backgroundColor: theme.card},
          headerTintColor: theme.text,
          headerTitleStyle: {color: theme.text},
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Editor" component={EditorScreen} />
        <Stack.Screen name="Printer" component={PrinterScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PrinterProvider>
        <AppNavigator />
      </PrinterProvider>
    </ThemeProvider>
  );
}