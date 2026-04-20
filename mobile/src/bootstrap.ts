import {
  setStorage,
  setApiBaseUrl,
  createAppStore,
} from '@planI/shared';
import { rnStorage, hydrateStorage } from './storageAdapter';
import { actionLogger } from './debugMiddleware';

export async function bootstrap() {
  console.log('[Bootstrap] ────────────────────────────');
  console.log('[Bootstrap] start @', new Date().toISOString());

  await hydrateStorage(['planI_auth', 'planI_adminPlan']);
  setStorage(rnStorage);
  console.log('[Bootstrap] storage ready');

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
  setApiBaseUrl(apiUrl);
  console.log('[Bootstrap] apiBaseUrl =', apiUrl);

  const bundle = createAppStore({ extraMiddleware: [actionLogger] });
  const hasAuth = !!bundle.store.getState().auth.accessToken;
  console.log('[Bootstrap] store created, hasStoredSession =', hasAuth);

  // Fire-and-forget health ping so the user can see connectivity before login.
  pingHealth(apiUrl).catch(() => { /* already logged */ });

  console.log('[Bootstrap] done ────────────────────────');
  return bundle;
}

async function pingHealth(apiUrl: string) {
  const url = `${apiUrl}/api/health`;
  console.log('[Health] →', url);
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log(`[Health] ✓ ${res.status} in ${Date.now() - t0}ms`, body.slice(0, 120));
  } catch (e: any) {
    console.warn(`[Health] ✗ failed in ${Date.now() - t0}ms:`, e?.message || String(e));
  }
}
