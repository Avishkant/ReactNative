import { NativeModules } from 'react-native';

const Native = (NativeModules && NativeModules.ScreenBrightness) || null;

export default {
  async getSystemBrightness(): Promise<number | null> {
    if (!Native || typeof Native.getSystemBrightness !== 'function')
      return null;
    try {
      const v = await Native.getSystemBrightness();
      return typeof v === 'number' ? v : Number(v);
    } catch (e) {
      return null;
    }
  },
  async setWindowBrightness(value: number): Promise<boolean> {
    if (!Native || typeof Native.setWindowBrightness !== 'function')
      return false;
    try {
      const res = await Native.setWindowBrightness(value);
      // Native implementation resolves with a boolean indicating success/failure
      return !!res;
    } catch (e) {
      return false;
    }
  },
};
