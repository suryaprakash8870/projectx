import { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';

interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] caught error', error);
    console.error('[ErrorBoundary] component stack:', info.componentStack);
    this.setState({ info: info.componentStack });
  }

  reset = () => {
    console.log('[ErrorBoundary] reset');
    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>App crashed</Text>
        <Text style={styles.label}>Error</Text>
        <Text style={styles.msg}>{this.state.error.message}</Text>
        {this.state.error.stack ? (
          <>
            <Text style={styles.label}>Stack</Text>
            <Text style={styles.code}>{this.state.error.stack}</Text>
          </>
        ) : null}
        {this.state.info ? (
          <>
            <Text style={styles.label}>Component Tree</Text>
            <Text style={styles.code}>{this.state.info}</Text>
          </>
        ) : null}
        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#dc2626', marginBottom: 16 },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  msg: { fontSize: 14, color: '#111' },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#444' },
  button: {
    marginTop: 24, padding: 14, borderRadius: 8,
    backgroundColor: '#0a66c2', alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
