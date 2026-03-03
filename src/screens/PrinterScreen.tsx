import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function PrinterScreen() {
  return (
    <View style={styles.container}>
      <Text>Printer Setup - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});