// Thin compat shim — action creators come from the shared auth slice
// instance created by store.ts. Real implementation lives in /shared.
import { authActions } from './store';

export const { setCredentials, updateTokens, switchPlan, logout } = authActions;

export type { AuthState } from '@planI/shared';
