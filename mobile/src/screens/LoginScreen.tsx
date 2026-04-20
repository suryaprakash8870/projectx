import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { useLoginMutation, getApiBaseUrl } from '@planI/shared';
import { authActions } from '../storeHolder';

type HealthState =
  | { status: 'checking' }
  | { status: 'ok'; ms: number }
  | { status: 'fail'; message: string; ms: number };

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [health, setHealth] = useState<HealthState>({ status: 'checking' });
  const dispatch = useDispatch();

  // Ping /api/health once on mount so user can see connectivity.
  useEffect(() => {
    const url = `${getApiBaseUrl()}/api/health`;
    const t0 = Date.now();
    console.log('[LoginScreen] health ping →', url);
    fetch(url)
      .then(async (r) => {
        const ms = Date.now() - t0;
        const body = await r.text();
        console.log(`[LoginScreen] health ✓ ${r.status} in ${ms}ms`, body.slice(0, 100));
        setHealth({ status: 'ok', ms });
      })
      .catch((e) => {
        const ms = Date.now() - t0;
        const message = e?.message || String(e);
        console.warn(`[LoginScreen] health ✗ in ${ms}ms:`, message);
        setHealth({ status: 'fail', message, ms });
      });
  }, []);

  async function submit() {
    console.log('[Login] submitting', { mobile, apiBase: getApiBaseUrl() });
    try {
      const res: any = await login({ mobile, password }).unwrap();
      console.log('[Login] success', {
        userId: res.userId,
        memberId: res.memberId,
        role: res.role,
        hasAccess: !!res.accessToken,
      });
      dispatch(
        authActions.setCredentials({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          userId: res.userId,
          memberId: res.memberId,
          role: res.role,
          name: res.name,
          status: res.status,
          planType: res.planType,
        })
      );
      onLoggedIn();
    } catch (e: any) {
      const msg =
        e?.data?.message || e?.data?.error || e?.error || e?.message || 'Unknown error';
      console.warn('[Login] failed', { status: e?.status, data: e?.data, error: e?.error });
      Alert.alert('Login failed', `${msg}\n\nAPI: ${getApiBaseUrl()}/api/auth/login`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan-I</Text>
      <Text style={styles.subtitle}>Sign in</Text>

      <TextInput
        style={styles.input}
        placeholder="Mobile number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.button, (isLoading || !mobile || !password) && styles.buttonDisabled]}
        onPress={submit}
        disabled={isLoading || !mobile || !password}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </Pressable>

      <Text style={styles.hint}>Demo: 9999999999 / admin123</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>API</Text>
        <Text style={styles.statusUrl} numberOfLines={1}>
          {getApiBaseUrl() || '(not set)'}
        </Text>
        <HealthBadge state={health} />
      </View>
    </View>
  );
}

function HealthBadge({ state }: { state: HealthState }) {
  if (state.status === 'checking') {
    return (
      <View style={[styles.badge, styles.badgeChecking]}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.badgeText}>Checking connection…</Text>
      </View>
    );
  }
  if (state.status === 'ok') {
    return (
      <View style={[styles.badge, styles.badgeOk]}>
        <Text style={styles.badgeTextOk}>● Connected ({state.ms}ms)</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeFail]}>
      <Text style={styles.badgeTextFail}>● Offline ({state.ms}ms)</Text>
      <Text style={styles.badgeSub}>{state.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, color: '#666' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 14, marginBottom: 12, fontSize: 16,
  },
  button: {
    backgroundColor: '#0a66c2', padding: 16, borderRadius: 8,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 12 },
  statusBox: {
    marginTop: 24, padding: 12, borderRadius: 8,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee',
  },
  statusLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  statusUrl: { fontSize: 12, color: '#333', fontFamily: 'monospace', marginTop: 2 },
  badge: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeChecking: {},
  badgeOk: {},
  badgeFail: { flexDirection: 'column', alignItems: 'flex-start' },
  badgeText: { fontSize: 12, color: '#666', marginLeft: 6 },
  badgeTextOk: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  badgeTextFail: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  badgeSub: { fontSize: 11, color: '#dc2626', marginTop: 2 },
});
