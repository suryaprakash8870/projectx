import type { Middleware } from '@reduxjs/toolkit';

// Logs every dispatched action with a compact diff of auth state.
// Filters out the noisy RTK Query internal actions by default.
const NOISY = [
  'api/executeQuery/pending',
  'api/executeQuery/fulfilled',
  'api/executeQuery/rejected',
  'api/subscriptions',
  'api/middlewareRegistered',
  'api/config',
];

export const actionLogger: Middleware = (store) => (next) => (action: any) => {
  const type = action?.type || '(unknown)';
  const isNoisy = NOISY.some((n) => type.startsWith(n));

  if (!isNoisy) {
    console.log(`[Redux] ${type}`, action?.payload !== undefined ? { payload: action.payload } : '');
  }

  const before = store.getState().auth;
  const result = next(action);
  const after = store.getState().auth;

  // Log auth transitions only (the thing we usually care about)
  if (before.accessToken !== after.accessToken || before.role !== after.role) {
    console.log('[Redux] auth changed →', {
      role: after.role,
      memberId: after.memberId,
      hasToken: !!after.accessToken,
    });
  }

  return result;
};
