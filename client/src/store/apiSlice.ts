// Thin re-export: the real API slice lives in /shared so mobile and web share
// it. Any new endpoint goes in shared/src/apiSlice.ts → appears in both apps.
export * from '@planI/shared';
