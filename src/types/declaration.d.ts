declare module 'react-native-default-preference' {
  const DefaultPreference: {
    get(key: string): Promise<string | null | undefined>;
    set(key: string, value: string): Promise<void>;
    clear(key: string): Promise<void>;
  };
  export default DefaultPreference;
}