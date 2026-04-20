// Platform-agnostic storage adapter.
// Web injects a synchronous localStorage-backed impl; RN injects an AsyncStorage-backed impl.
// We only need sync semantics for redux hydration (handled at platform bootstrap).

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let _storage: Storage | null = null;

export function setStorage(impl: Storage) {
  _storage = impl;
}

export function getStorage(): Storage {
  if (!_storage) {
    throw new Error(
      '[shared] Storage not initialized. Call setStorage(...) at app bootstrap before using the store.'
    );
  }
  return _storage;
}
