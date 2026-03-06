import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';

export default function HomeScreen({navigation}: any) {
  const theme = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <Text style={[styles.title, {color: theme.text}]}>ZQ Label Maker</Text>
      <TouchableOpacity
        style={[styles.button, {backgroundColor: theme.primary}]}
        onPress={() => navigation.navigate('Editor')}>
        <Text style={styles.buttonText}>New Label</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, {backgroundColor: theme.primary}]}
        onPress={() => navigation.navigate('Printer')}>
        <Text style={styles.buttonText}>Printer Setup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 24},
  button: {
    width: 200,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});