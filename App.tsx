/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createDrawerNavigator, DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import {usePrinter, PrinterProvider} from './src/context/PrinterContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import Toast from 'react-native-toast-message';
import EditorScreen from './src/screens/EditorScreen';
import PrinterScreen from './src/screens/PrinterScreen';

const Drawer = createDrawerNavigator();

function DrawerContent(props: any) {
  const theme = useTheme();
  const {printerMac} = usePrinter();

  return (
    <DrawerContentScrollView
      {...props}
      style={{backgroundColor: theme.background}}>
      <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 8}}>
        <Text style={{color: theme.subtext, fontSize: 12, marginBottom: 4}}>Printer</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: printerMac ? theme.success : theme.disabled,
          }} />
          <Text style={{color: theme.text, fontSize: 13}}>
            {printerMac ? printerMac : 'Not configured'}
          </Text>
        </View>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function MenuButton({navigation}: {navigation: any}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.openDrawer()} style={{marginLeft: 16}}>
      <Text style={{color: theme.text, fontSize: 22}}>☰</Text>
    </TouchableOpacity>
  );
}

function AppNavigator() {
  const theme = useTheme();
  const {printerMac} = usePrinter();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    // Wait for printerMac to load from storage before deciding initial route
    const timer = setTimeout(() => {
      setInitialRoute(printerMac ? 'Editor' : 'Settings');
    }, 300);
    return () => clearTimeout(timer);
  }, [printerMac]);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName={initialRoute}
        //drawerContent={props => <DrawerContent {...props} />}
        screenOptions={({navigation}) => ({
          drawerPosition:"left",
          swipeEdgeWidth: 50,
          headerStyle: {backgroundColor: theme.card},
          headerTintColor: theme.text,
          headerTitleStyle: {color: theme.text},
          drawerStyle: {backgroundColor: theme.background},
          drawerActiveTintColor: theme.primary,
          drawerInactiveTintColor: theme.text,
          headerLeft: () => <MenuButton navigation={navigation} />,
        })}>
        <Drawer.Screen name="Editor" component={EditorScreen} />
        <Drawer.Screen name="Settings" component={PrinterScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PrinterProvider>
        <AppNavigator />
        <Toast />
      </PrinterProvider>
    </ThemeProvider>
  );
}