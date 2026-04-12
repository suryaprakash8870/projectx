import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AdminPlan = 'PLAN1' | 'PLAN2';

interface AdminPlanState {
  selected: AdminPlan;
}

const stored = (() => {
  try {
    return localStorage.getItem('planI_adminPlan') as AdminPlan | null;
  } catch {
    return null;
  }
})();

const initialState: AdminPlanState = {
  selected: stored === 'PLAN2' ? 'PLAN2' : 'PLAN1',
};

const adminPlanSlice = createSlice({
  name: 'adminPlan',
  initialState,
  reducers: {
    setAdminPlan(state, action: PayloadAction<AdminPlan>) {
      state.selected = action.payload;
      localStorage.setItem('planI_adminPlan', action.payload);
    },
  },
});

export const { setAdminPlan } = adminPlanSlice.actions;
export default adminPlanSlice.reducer;
