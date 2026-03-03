import React, {useState, useEffect} from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';

const normalizeMac = (mac: string): string => {
  // Normalize MAC format and increment last octet by 1 (Zebra BT offset)
  const parts = mac.toUpperCase().split(':');
  if (parts.length !== 6) return mac;
  const last = parseInt(parts[5], 16);
  parts[5] = ((last + 1) % 256).toString(16).padStart(2, '0').toUpperCase();
  return parts.join(':');
};

export default function PrinterScreen() {
  const [savedPrinter, setSavedPrinter] = useState<BluetoothDevice | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const handleBarcodeScan = (value: string) => {
  // Basic MAC address validation — must match XX:XX:XX:XX:XX:XX format
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
  if (!macRegex.test(value.trim())) {
    Alert.alert(
      'Invalid Barcode',
      'This doesn\'t look like a printer MAC address. Please scan the barcode on the bottom of the ZQ620.',
    );
    return;
  }
  setScanning(false);
  connectToMac(value.trim());
};
  
  const handleManualMac = () => {
    Alert.prompt(
      'Enter MAC Address',
      'Enter the MAC address from the label on the bottom of the printer.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Connect',
          onPress: (mac: string | undefined) => {
        if (mac) connectToMac(mac.trim());
        },
        },
      ],
      'plain-text',
    );
  };

  const connectToMac = async (rawMac: string) => {
    const mac = normalizeMac(rawMac);
    setConnecting(true);
    try {
      const device = await RNBluetoothClassic.connectToDevice(mac);
      setSavedPrinter(device);
      setConnected(true);
      Alert.alert('Connected', `Connected to printer at ${mac}`);
    } catch {
      Alert.alert('Connection Failed', `Could not connect to ${mac}. Make sure the printer is on and in pairing mode.`);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (savedPrinter) {
      try {
        await savedPrinter.disconnect();
      } catch {}
      setSavedPrinter(null);
      setConnected(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Printer Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, connected ? styles.dotGreen : styles.dotGrey]} />
          <Text style={styles.statusText}>
            {connected ? `Connected — ${savedPrinter?.address}` : 'No printer connected'}
          </Text>
        </View>
        {connected && (
          <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connect Options */}
      {!connected && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Connect Printer</Text>
          <Text style={styles.hint}>
            Scan the barcode on the bottom of the printer, or enter the MAC address manually.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setScanning(true)}>
            <Text style={styles.primaryBtnText}>📷  Scan Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleManualMac}>
            <Text style={styles.secondaryBtnText}>Enter MAC Address</Text>
          </TouchableOpacity>

          {connecting && <Text style={styles.hint}>Connecting...</Text>}
        </View>
      )}
          {scanning && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onCancel={() => setScanning(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 16, gap: 12},
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  sectionTitle: {fontSize: 14, fontWeight: '600', color: '#444'},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dot: {width: 12, height: 12, borderRadius: 6},
  dotGreen: {backgroundColor: '#16a34a'},
  dotGrey: {backgroundColor: '#ccc'},
  statusText: {fontSize: 14, color: '#333'},
  hint: {fontSize: 13, color: '#888', lineHeight: 20},
  primaryBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {color: '#444', fontSize: 15},
  disconnectBtn: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  disconnectText: {color: '#dc2626', fontSize: 14},
});