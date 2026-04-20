# Mobile (React Native / Expo) Setup

This repo now has a **shared codebase** between web (`/client`) and mobile (`/mobile`).
Business logic lives in `/shared` — edit it once, both platforms get the change.

## Folder layout

```
/client    React web app (Vite)
/mobile    React Native app (Expo) — runs on Android/iOS
/shared    API client, Redux store, types — imported by both apps
/server    Node/Express/Prisma API (unchanged)
```

## What's shared, what's not

**Shared (`/shared`)**
- RTK Query API slice with all ~60 endpoints
- Redux `authSlice` (login state, token refresh, plan-switch)
- Redux `adminPlanSlice`
- Runtime config (`setApiBaseUrl`) and storage abstraction (`setStorage`)

**Per-platform**
- **UI** — web uses HTML/Tailwind, mobile uses React Native components. RN has no
  `<div>` or CSS classes; screens are written once per platform. The web app's
  existing pages are untouched.
- **Storage adapter** — web passes `localStorage`; mobile passes an
  `AsyncStorage`-backed adapter (`mobile/src/storageAdapter.ts`).
- **API base URL** — web reads `VITE_API_URL`; mobile reads `EXPO_PUBLIC_API_URL`.

## Rules of thumb: when adding a feature

| What | Where |
|------|-------|
| New API endpoint | `shared/src/apiSlice.ts` → auto-available on both |
| New redux state | `shared/src/*Slice.ts` (use `getStorage()`, never `localStorage`) |
| New screen UI | Write twice: `client/src/pages/...` and `mobile/src/screens/...` |
| Pure utility (formatting, validation) | `shared/src/utils/` |

## Running the mobile app

### Prerequisites
- Node 18+ (you have 24) ✅
- **Expo Go** on your Android phone ([Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)) — easiest path, no Android Studio needed
- OR Android Studio with an emulator

### First-time setup

```bash
# From the repo root
cd mobile
cp .env.example .env
# edit .env — set EXPO_PUBLIC_API_URL to either
#   http://10.0.2.2:4000             (Android emulator → localhost)
#   http://<your-pc-lan-ip>:4000     (physical phone on same Wi-Fi)
#   https://<your-render-app>        (production)
```

### Start dev server

```bash
# from repo root
npm run mobile

# or directly
cd mobile && npm run start
```

Expo will print a QR code:
- **Physical phone** — scan it with the Expo Go app.
- **Emulator** — press `a` in the Expo terminal.

The app hot-reloads on every save — including changes to `/shared`.

## Building an APK (production)

Two options:

### EAS Build (recommended — no Android Studio needed)
```bash
cd mobile
npx expo install expo-dev-client
npx eas-cli login
npx eas-cli build -p android --profile preview
```
EAS builds the APK on Expo's servers and gives you a download link.

### Local build (requires Android Studio)
```bash
cd mobile
npx expo prebuild
npx expo run:android --variant release
```

## Troubleshooting

**"Network request failed" on Android emulator** — use `10.0.2.2`, not `localhost`.

**"Network request failed" on physical phone** — phone must be on the same Wi-Fi
as your PC, and `EXPO_PUBLIC_API_URL` must use your PC's LAN IP (check with
`ipconfig`). Your PC's firewall may also need to allow port 4000 inbound.

**Duplicate React errors** — `metro.config.js` already sets
`disableHierarchicalLookup = true` to prevent this. If it resurfaces, run
`cd mobile && rm -rf node_modules && npm install`.

**Changes to `/shared` not hot-reloading** — stop Expo and restart with
`npm run start -- --clear`. Metro caches the resolver.
