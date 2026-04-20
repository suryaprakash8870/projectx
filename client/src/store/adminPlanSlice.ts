// Thin compat shim — real implementation in /shared.
import { adminPlanActions } from './store';

export const { setAdminPlan } = adminPlanActions;

export type { AdminPlan } from '@planI/shared';
