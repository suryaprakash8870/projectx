import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorage } from './storage';

const STORAGE_KEY = 'planI_auth';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  memberId: string | null;
  role: 'MEMBER' | 'ADMIN' | null;
  name: string | null;
  status: string | null;
  planType: 'PLAN1' | 'PLAN2' | 'PLAN3' | null;
  altAccessToken: string | null;
  altRefreshToken: string | null;
  altUserId: string | null;
  altMemberId: string | null;
  altRole: 'MEMBER' | 'ADMIN' | null;
  altName: string | null;
  altStatus: string | null;
  altPlanType: 'PLAN1' | 'PLAN2' | 'PLAN3' | null;
}

const emptyState: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  memberId: null,
  role: null,
  name: null,
  status: null,
  planType: null,
  altAccessToken: null,
  altRefreshToken: null,
  altUserId: null,
  altMemberId: null,
  altRole: null,
  altName: null,
  altStatus: null,
  altPlanType: null,
};

export function loadInitialAuthState(): AuthState {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { ...emptyState, ...(parsed || {}) };
  } catch {
    return { ...emptyState };
  }
}

function persist(state: AuthState) {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* no-op */
  }
}

export function createAuthSlice(initialState: AuthState) {
  return createSlice({
    name: 'auth',
    initialState,
    reducers: {
      setCredentials(state, action: PayloadAction<Partial<AuthState>>) {
        Object.assign(state, action.payload);
        persist(state);
      },
      updateTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persist(state);
      },
      switchPlan(state) {
        if (!state.altAccessToken || !state.altPlanType) return;
        const swap = {
          accessToken: state.altAccessToken,
          refreshToken: state.altRefreshToken,
          userId: state.altUserId,
          memberId: state.altMemberId,
          role: state.altRole,
          name: state.altName,
          status: state.altStatus,
          planType: state.altPlanType,
        };
        const altSwap = {
          altAccessToken: state.accessToken,
          altRefreshToken: state.refreshToken,
          altUserId: state.userId,
          altMemberId: state.memberId,
          altRole: state.role,
          altName: state.name,
          altStatus: state.status,
          altPlanType: state.planType,
        };
        Object.assign(state, swap, altSwap);
        persist(state);
      },
      logout(state) {
        Object.assign(state, emptyState);
        try {
          getStorage().removeItem(STORAGE_KEY);
        } catch {
          /* no-op */
        }
      },
    },
  });
}
