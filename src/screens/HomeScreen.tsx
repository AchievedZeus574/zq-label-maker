import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';

export default function HomeScreen({navigation}: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZebraGen</Text>
      <Button title="New Label" onPress={() => navigation.navigate('Editor')} />
      <Button title="Printer Setup" onPress={() => navigation.navigate('Printer')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 24},
});