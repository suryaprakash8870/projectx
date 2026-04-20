import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorage } from './storage';

export type AdminPlan = 'PLAN1' | 'PLAN2' | 'PLAN3';

const STORAGE_KEY = 'planI_adminPlan';

interface AdminPlanState {
  selected: AdminPlan;
}

function migrateStored(val: string | null): AdminPlan {
  if (val === 'PLAN3') return 'PLAN3';
  if (val === 'PLAN2') return 'PLAN3';
  if (val === 'PLAN1') return 'PLAN2';
  return 'PLAN2';
}

export function loadInitialAdminPlanState(): AdminPlanState {
  let stored: string | null = null;
  try {
    stored = getStorage().getItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
  return { selected: migrateStored(stored) };
}

export function createAdminPlanSlice(initialState: AdminPlanState) {
  return createSlice({
    name: 'adminPlan',
    initialState,
    reducers: {
      setAdminPlan(state, action: PayloadAction<AdminPlan>) {
        state.selected = action.payload;
        try {
          getStorage().setItem(STORAGE_KEY, action.payload);
        } catch {
          /* no-op */
        }
      },
    },
  });
}
