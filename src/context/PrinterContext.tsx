import React, {createContext, useContext, useState, useEffect} from 'react';
import {BluetoothDevice} from 'react-native-bluetooth-classic';
import DefaultPreference from 'react-native-default-preference';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

type PrinterContextType = {
  printerMac: string | null;
  setPrinterMac: (mac: string | null) => void;
  connectAndPrint: (zpl: string) => Promise<void>;
  isConnected: boolean;
};

const PrinterContext = createContext<PrinterContextType>({
  printerMac: null,
  setPrinterMac: () => {},
  connectAndPrint: async () => {},
  isConnected: false,
});

const MAC_STORAGE_KEY = 'printer_mac';

export function PrinterProvider({children}: {children: React.ReactNode}) {
  const [printerMac, setPrinterMacState] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    DefaultPreference.get(MAC_STORAGE_KEY).then((mac: string | null | undefined) => {
      if (mac) setPrinterMacState(mac);
    });
  }, []);

  const setPrinterMac = (mac: string | null) => {
    setPrinterMacState(mac);
    if (mac) {
      DefaultPreference.set(MAC_STORAGE_KEY, mac);
    } else {
      DefaultPreference.clear(MAC_STORAGE_KEY);
    }
  };

  const connectAndPrint = async (zpl: string) => {
    if (!printerMac) throw new Error('No printer configured');
    
    let device: BluetoothDevice | null = null;
    try {
      setIsConnected(false);
      device = await RNBluetoothClassic.connectToDevice(printerMac);
      setIsConnected(true);
      await device.write(zpl);
    } finally {
      if (device) {
        try {
          await device.disconnect();
        } catch {}
      }
      setIsConnected(false);
    }
  };

  return (
    <PrinterContext.Provider value={{printerMac, setPrinterMac, connectAndPrint, isConnected}}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  return useContext(PrinterContext);
}