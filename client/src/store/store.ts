import { setStorage, setApiBaseUrl, createAppStore } from '@planI/shared';

// ── Web platform bootstrap ──────────────────────────────────────────────────
// Must run before createAppStore() — slice initial state reads from storage.

setStorage({
  getItem: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  setItem: (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* no-op */ }
  },
  removeItem: (k) => {
    try { localStorage.removeItem(k); } catch { /* no-op */ }
  },
});

setApiBaseUrl((import.meta as any).env?.VITE_API_URL || '');

const bundle = createAppStore();

export const store = bundle.store;
export const authActions = bundle.authActions;
export const adminPlanActions = bundle.adminPlanActions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
