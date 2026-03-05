import React, {useState, useEffect} from 'react';
import {Modal, TextInput, View, Text, TouchableOpacity, PermissionsAndroid, Platform} from 'react-native';
import BarcodeScanner from '../components/BarcodeScanner';
import {usePrinter} from '../context/PrinterContext';
import {useTheme} from '../context/ThemeContext';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import Toast from 'react-native-toast-message';

const normalizeMac = (mac: string): string => {
  const parts = mac.toUpperCase().split(':');
  if (parts.length !== 6) return mac;
  const last = parseInt(parts[5], 16);
  parts[5] = ((last + 1) % 256).toString(16).padStart(2, '0').toUpperCase();
  return parts.join(':');
};

export default function PrinterScreen() {
  const theme = useTheme();
  const {printerMac, setPrinterMac} = usePrinter();
  const [connecting, setConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [macModalVisible, setMacModalVisible] = useState(false);
  const [macInput, setMacInput] = useState('');

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
    const stripped = value.trim().replace(/[:-]/g, '');
    const hexRegex = /^[0-9A-Fa-f]{12}$/;
    if (!hexRegex.test(stripped)) {
      Toast.show({type: 'error', text1: 'Invalid Barcode', text2: "This doesn't look like a printer MAC address. Please scan the barcode on the bottom of the ZQ620."});
      return;
    }
    const mac = stripped.match(/.{2}/g)!.join(':');
    setScanning(false);
    connectToMac(mac);
  };

  const handleManualMac = () => {
    setMacInput('');
    setMacModalVisible(true);
  };

  const submitManualMac = () => {
    const stripped = macInput.trim().replace(/[:-]/g, '');
    const hexRegex = /^[0-9A-Fa-f]{12}$/;
    if (!hexRegex.test(stripped)) {
      Toast.show({type: 'error', text1: 'Invalid MAC', text2: 'Please enter a valid 12 character MAC address.'});
      return;
    }
    const mac = stripped.match(/.{2}/g)!.join(':');
    setMacModalVisible(false);
    connectToMac(mac);
  };

  const connectToMac = async (rawMac: string) => {
    const mac = normalizeMac(rawMac);
    setConnecting(true);
    try {
      const device = await RNBluetoothClassic.connectToDevice(mac);
      await device.disconnect();
      setPrinterMac(mac);
      Toast.show({type: 'success', text1: 'Printer Saved', text2: mac});
    } catch {
      Toast.show({type: 'error', text1: 'Connection Failed', text2: `Could not connect to ${mac}. Make sure the printer is on and in pairing mode.`});
    } finally {
      setConnecting(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <View style={s.container}>

      {/* Status Card */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Printer Status</Text>
        <View style={s.statusRow}>
          <View style={[s.dot, printerMac ? s.dotGreen : s.dotGrey]} />
          <Text style={s.statusText}>
            {printerMac ? `Saved — ${printerMac}` : 'No printer configured'}
          </Text>
        </View>
        {printerMac && (
          <TouchableOpacity style={s.disconnectBtn} onPress={() => setPrinterMac(null)}>
            <Text style={s.disconnectText}>Forget Printer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connect Options */}
      {!printerMac && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Connect Printer</Text>
          <Text style={s.hint}>
            Scan the barcode on the bottom of the printer, or enter the MAC address manually.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setScanning(true)}>
            <Text style={s.primaryBtnText}>📷  Scan Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleManualMac}>
            <Text style={s.secondaryBtnText}>Enter MAC Address</Text>
          </TouchableOpacity>
          {connecting && <Text style={s.hint}>Connecting...</Text>}
        </View>
      )}

      {scanning && (
        <BarcodeScanner onScan={handleBarcodeScan} onCancel={() => setScanning(false)} />
      )}

      <Modal
        visible={macModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMacModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.sectionTitle}>Enter MAC Address</Text>
            <Text style={s.hint}>
              Enter the MAC address from the label on the bottom of the printer. Separators are optional.
            </Text>
            <TextInput
              style={s.macInput}
              value={macInput}
              onChangeText={setMacInput}
              placeholder="e.g. 48A49382A2EC"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="characters"
              maxLength={17}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={s.modalSecondaryBtn} onPress={() => setMacModalVisible(false)}>
                <Text style={s.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalPrimaryBtn} onPress={submitManualMac}>
                <Text style={s.primaryBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../context/ThemeContext').useTheme>) => ({
  container: {flex: 1, backgroundColor: theme.background, padding: 16, gap: 12},
  card: {backgroundColor: theme.card, borderRadius: 8, padding: 16, gap: 12, elevation: 2},
  sectionTitle: {fontSize: 14, fontWeight: '600' as const, color: theme.text},
  statusRow: {flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10},
  dot: {width: 12, height: 12, borderRadius: 6},
  dotGreen: {backgroundColor: theme.success},
  dotGrey: {backgroundColor: theme.disabled},
  statusText: {fontSize: 14, color: theme.text},
  hint: {fontSize: 13, color: theme.subtext, lineHeight: 20},
  primaryBtn: {backgroundColor: theme.primary, borderRadius: 8, padding: 14, alignItems: 'center' as const},
  primaryBtnText: {color: '#fff', fontSize: 15, fontWeight: '600' as const},
  secondaryBtn: {borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 14, alignItems: 'center' as const},
  secondaryBtnText: {color: theme.text, fontSize: 15},
  disconnectBtn: {borderWidth: 1, borderColor: theme.danger, borderRadius: 8, padding: 10, alignItems: 'center' as const},
  disconnectText: {color: theme.danger, fontSize: 14},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24},
  modalCard: {backgroundColor: theme.card, borderRadius: 12, padding: 20, width: '100%' as const, gap: 12},
  macInput: {borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 16, color: theme.text, fontFamily: 'monospace'},
  modalButtons: {flexDirection: 'row' as const, gap: 8},
  modalPrimaryBtn: {flex: 1, backgroundColor: theme.primary, borderRadius: 8, padding: 14, alignItems: 'center' as const},
  modalSecondaryBtn: {flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 14, alignItems: 'center' as const},
});