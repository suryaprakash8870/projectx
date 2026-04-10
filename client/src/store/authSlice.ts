import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  memberId: string | null;
  role: 'MEMBER' | 'ADMIN' | null;
  name: string | null;
  status: string | null;
}

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem('planI_auth') || 'null');
  } catch {
    return null;
  }
})();

const initialState: AuthState = stored || {
  accessToken: null,
  refreshToken: null,
  userId: null,
  memberId: null,
  role: null,
  name: null,
  status: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Omit<AuthState, never>>) {
      Object.assign(state, action.payload);
      localStorage.setItem('planI_auth', JSON.stringify(state));
    },
    updateTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('planI_auth', JSON.stringify(state));
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.userId = null;
      state.memberId = null;
      state.role = null;
      state.name = null;
      state.status = null;
      localStorage.removeItem('planI_auth');
    },
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
