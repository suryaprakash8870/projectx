import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { useGetMeQuery, useGetWalletQuery } from '@planI/shared';
import { authActions } from '../storeHolder';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const me = useGetMeQuery();
  const wallet = useGetWalletQuery();

  useEffect(() => {
    console.log('[HomeScreen] mount');
    return () => console.log('[HomeScreen] unmount');
  }, []);

  useEffect(() => {
    if (me.isSuccess) {
      console.log('[HomeScreen] profile loaded', {
        memberId: me.data?.memberId,
        plan: me.data?.planType,
        status: me.data?.status,
      });
    }
    if (me.isError) {
      console.warn('[HomeScreen] profile error', me.error);
    }
  }, [me.isSuccess, me.isError]);

  useEffect(() => {
    if (wallet.isSuccess) {
      console.log('[HomeScreen] wallet loaded', {
        income: wallet.data?.incomeBalance,
        purchase: wallet.data?.purchaseBalance,
        gtc: wallet.data?.gtcBalance,
      });
    }
    if (wallet.isError) {
      console.warn('[HomeScreen] wallet error', wallet.error);
    }
  }, [wallet.isSuccess, wallet.isError]);

  function handleLogout() {
    console.log('[HomeScreen] logout pressed');
    dispatch(authActions.logout());
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome{me.data?.name ? `, ${me.data.name}` : ''}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Profile</Text>
        {me.isLoading ? (
          <ActivityIndicator />
        ) : me.isError ? (
          <Text style={styles.errorText}>Failed to load</Text>
        ) : (
          <>
            <Text style={styles.cardValue}>Member ID: {me.data?.memberId || '—'}</Text>
            <Text style={styles.cardValue}>Plan: {me.data?.planType || '—'}</Text>
            <Text style={styles.cardValue}>Status: {me.data?.status || '—'}</Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Wallet</Text>
        {wallet.isLoading ? (
          <ActivityIndicator />
        ) : wallet.isError ? (
          <Text style={styles.errorText}>Failed to load</Text>
        ) : (
          <>
            <Text style={styles.cardValue}>Income: ₹{wallet.data?.incomeBalance ?? 0}</Text>
            <Text style={styles.cardValue}>Purchase: ₹{wallet.data?.purchaseBalance ?? 0}</Text>
            <Text style={styles.cardValue}>GTC: ₹{wallet.data?.gtcBalance ?? 0}</Text>
          </>
        )}
      </View>

      <Pressable style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  card: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16,
    marginBottom: 16, backgroundColor: '#fafafa',
  },
  cardLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 8 },
  cardValue: { fontSize: 16, marginBottom: 4 },
  errorText: { fontSize: 14, color: '#dc2626' },
  logout: {
    marginTop: 24, padding: 16, borderRadius: 8, borderWidth: 1,
    borderColor: '#c22', alignItems: 'center',
  },
  logoutText: { color: '#c22', fontWeight: '600' },
});
