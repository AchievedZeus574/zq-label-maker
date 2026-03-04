import React, {useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';

type Props = {
  onScan: (mac: string) => void;
  onCancel: () => void;
};

export default function BarcodeScanner({onScan, onCancel}: Props) {
  const lastScan = useRef<string>('');

  const handleBarcode = (event: any) => {
    const value = event.nativeEvent.codeStringValue;
    const type = event.nativeEvent.codeFormat;
    if (!value || value === lastScan.current) return;
    // Only accept Code 128
    if (type !== 'code-128') return;
    lastScan.current = value;
    onScan(value);
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        cameraType={CameraType.Back}
        scanBarcode
        onReadCode={handleBarcode}
        showFrame
        laserColor="red"
        frameColor="white"
      />
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    zIndex: 99,
  },
  camera: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 80,
  },
  cancelBtn: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  cancelText: {color: '#fff', fontSize: 16},
});