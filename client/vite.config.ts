import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@planI/shared': path.resolve(__dirname, '../shared/src'),
    },
    // Ensure /shared and /client use a single copy of these at runtime.
    dedupe: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these even when they're only imported transitively
    // from /shared (which lives outside /client's root).
    include: ['@reduxjs/toolkit', '@reduxjs/toolkit/query/react', 'react-redux'],
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      // Allow serving files from /shared (one level above /client)
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
