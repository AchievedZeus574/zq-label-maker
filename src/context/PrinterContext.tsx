import React, {createContext, useContext, useState} from 'react';
import {BluetoothDevice} from 'react-native-bluetooth-classic';

type PrinterContextType = {
  printer: BluetoothDevice | null;
  setPrinter: (device: BluetoothDevice | null) => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
};

const PrinterContext = createContext<PrinterContextType>({
  printer: null,
  setPrinter: () => {},
  isConnected: false,
  setIsConnected: () => {},
});

export function PrinterProvider({children}: {children: React.ReactNode}) {
  const [printer, setPrinter] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <PrinterContext.Provider value={{printer, setPrinter, isConnected, setIsConnected}}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  return useContext(PrinterContext);
}