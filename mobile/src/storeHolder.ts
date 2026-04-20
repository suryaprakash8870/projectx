// Re-exports the live auth/adminPlan action creators bound to the store
// built by bootstrap(). Populated in App.tsx before any screen renders.

import type { createAppStore } from '@planI/shared';

type Bundle = ReturnType<typeof createAppStore>;

export let authActions: Bundle['authActions'] = null as any;
export let adminPlanActions: Bundle['adminPlanActions'] = null as any;

export function installActions(bundle: Bundle) {
  authActions = bundle.authActions;
  adminPlanActions = bundle.adminPlanActions;
  console.log('[storeHolder] actions installed', {
    auth: Object.keys(authActions),
    adminPlan: Object.keys(adminPlanActions),
  });
}
