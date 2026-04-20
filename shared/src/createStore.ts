import { configureStore, Middleware } from '@reduxjs/toolkit';
import { api, setApiDeps } from './apiSlice';
import {
  createAuthSlice,
  loadInitialAuthState,
  AuthState,
} from './authSlice';
import {
  createAdminPlanSlice,
  loadInitialAdminPlanState,
} from './adminPlanSlice';

export interface CreateAppStoreOptions {
  extraMiddleware?: Middleware[];
}

// Factory so each platform creates its own store after injecting storage + config.
export function createAppStore(options: CreateAppStoreOptions = {}) {
  const authSlice = createAuthSlice(loadInitialAuthState());
  const adminPlanSlice = createAdminPlanSlice(loadInitialAdminPlanState());

  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
      adminPlan: adminPlanSlice.reducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(api.middleware, ...(options.extraMiddleware || [])),
  });

  // Wire api slice to auth actions of THIS store instance.
  setApiDeps({
    getAccessToken: (state) => (state.auth as AuthState).accessToken,
    getRefreshToken: (state) => (state.auth as AuthState).refreshToken,
    updateTokens: authSlice.actions.updateTokens,
    logout: authSlice.actions.logout,
  });

  return {
    store,
    authActions: authSlice.actions,
    adminPlanActions: adminPlanSlice.actions,
  };
}

export type AppStore = ReturnType<typeof createAppStore>['store'];
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
