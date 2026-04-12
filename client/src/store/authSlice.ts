import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  memberId: string | null;
  role: 'MEMBER' | 'ADMIN' | null;
  name: string | null;
  status: string | null;
  planType: 'PLAN1' | 'PLAN2' | null;
  // Alt plan credentials — populated only when the user has BOTH Plan 1 and Plan 2.
  // On "switch plan", primary ↔ alt are swapped atomically.
  altAccessToken: string | null;
  altRefreshToken: string | null;
  altUserId: string | null;
  altMemberId: string | null;
  altRole: 'MEMBER' | 'ADMIN' | null;
  altName: string | null;
  altStatus: string | null;
  altPlanType: 'PLAN1' | 'PLAN2' | null;
}

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem('planI_auth') || 'null');
  } catch {
    return null;
  }
})();

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

const initialState: AuthState = { ...emptyState, ...(stored || {}) };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Partial<AuthState>>) {
      Object.assign(state, action.payload);
      localStorage.setItem('planI_auth', JSON.stringify(state));
    },
    updateTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('planI_auth', JSON.stringify(state));
    },
    // Swap primary ↔ alt credentials (for dual-plan users)
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
      localStorage.setItem('planI_auth', JSON.stringify(state));
    },
    logout(state) {
      Object.assign(state, emptyState);
      localStorage.removeItem('planI_auth');
    },
  },
});

export const { setCredentials, updateTokens, switchPlan, logout } = authSlice.actions;
export default authSlice.reducer;
