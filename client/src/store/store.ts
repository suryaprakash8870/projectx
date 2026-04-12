import { configureStore } from '@reduxjs/toolkit';
import { api } from './apiSlice';
import authReducer from './authSlice';
import adminPlanReducer from './adminPlanSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminPlan: adminPlanReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
