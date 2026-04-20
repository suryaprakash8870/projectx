import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from '@planI/shared';

// In-memory mirror populated at startup so the shared (sync) Storage interface
// can be satisfied on RN, which only exposes an async API on disk.
const cache: Record<string, string> = {};

export async function hydrateStorage(keys: string[]) {
  const entries = await AsyncStorage.multiGet(keys);
  for (const [k, v] of entries) {
    if (v != null) cache[k] = v;
  }
}

export const rnStorage: Storage = {
  getItem: (key) => (key in cache ? cache[key] : null),
  setItem: (key, value) => {
    cache[key] = value;
    // Fire-and-forget persist; we don't block redux dispatches on disk I/O.
    void AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    delete cache[key];
    void AsyncStorage.removeItem(key);
  },
};
