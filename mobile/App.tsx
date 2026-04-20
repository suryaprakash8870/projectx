import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import type { Store } from '@reduxjs/toolkit';

import { bootstrap } from './src/bootstrap';
import { installActions } from './src/storeHolder';
import { ErrorBoundary } from './src/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

function RootNav() {
  const token = useSelector((s: any) => s.auth.accessToken as string | null);
  const role = useSelector((s: any) => s.auth.role as string | null);
  const [, force] = useState(0);

  useEffect(() => {
    console.log('[Nav] route =', token ? 'Home' : 'Login', '| role =', role);
  }, [token, role]);

  return token
    ? <HomeScreen />
    : <LoginScreen onLoggedIn={() => force((n) => n + 1)} />;
}

export default function App() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    console.log('[App] mount — starting bootstrap');
    let cancelled = false;
    bootstrap()
      .then((bundle) => {
        if (cancelled) {
          console.log('[App] bootstrap resolved after unmount, ignoring');
          return;
        }
        installActions(bundle);
        setStore(bundle.store);
        console.log('[App] store ready, rendering RootNav');
      })
      .catch((e) => {
        console.error('[App] bootstrap FAILED:', e?.message || e);
      });
    return () => {
      console.log('[App] unmount');
      cancelled = true;
    };
  }, []);

  if (!store) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <RootNav />
        <StatusBar style="auto" />
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
