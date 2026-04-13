import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AdminPlan = 'PLAN1' | 'PLAN2' | 'PLAN3';

// Plan mapping (UI names):
//   PLAN1 = Plan 1 — Subscription (₹250/month) [NEW]
//   PLAN2 = Plan 2 — Referral Program (₹1,000) [was internally PLAN1]
//   PLAN3 = Plan 3 — Investment Program         [was internally PLAN2]

interface AdminPlanState {
  selected: AdminPlan;
}

const stored = (() => {
  try {
    return localStorage.getItem('planI_adminPlan');
  } catch {
    return null;
  }
})();

// Migrate old stored values: old 'PLAN1' (referral) → new 'PLAN2', old 'PLAN2' (investment) → new 'PLAN3'
function migrateStored(val: string | null): AdminPlan {
  if (val === 'PLAN3') return 'PLAN3';
  if (val === 'PLAN2') return 'PLAN3'; // old investment → Plan 3
  if (val === 'PLAN1') return 'PLAN2'; // old referral → Plan 2
  return 'PLAN2'; // default to referral plan
}

const initialState: AdminPlanState = {
  selected: migrateStored(stored),
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
