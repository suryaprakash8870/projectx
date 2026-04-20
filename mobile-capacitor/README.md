# /mobile-capacitor

Wraps the existing `/client` web app into a native Android APK using **Capacitor**.
The React Native setup in `/mobile` is untouched — this folder is an independent, parallel path.

## How it fits together

```
/client          React web app (Vite) — edited normally
   └─ dist/      Production build output
/mobile-capacitor
   ├─ android/   Native Android project (generated)
   └─ capacitor.config.ts   → points webDir to ../client/dist
```

On build, Capacitor copies `client/dist` into `android/app/src/main/assets/public`
and ships it inside an APK. The APK launches a WebView that loads the bundled
`index.html` — your full Plan-I web UI, running natively on Android.

**Result: one codebase, one UI.** Edit `/client/...`, rebuild, new APK picks up changes.

## Prerequisites (already set up on this machine)

- Node 18+
- Android Studio with an AVD (we use **Pixel_10_Pro_XL**)
- JDK — Android Studio ships one at `D:/Android/jbr`
- Android SDK at `C:/Users/Anto/AppData/Local/Android/Sdk`

These env vars are required for builds:
```
JAVA_HOME=D:\Android\jbr
ANDROID_HOME=C:\Users\Anto\AppData\Local\Android\Sdk
PATH += %JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools
```

## Daily workflow (after editing /client)

```bash
# One-liner: rebuild web, sync to android, install on emulator
cd mobile-capacitor
npm run run:android
```

What it does:
1. `npm run build --prefix ../client` — Vite production build
2. `cap sync android` — copy dist into the android project
3. `cap run android` — install + launch on the connected emulator/device

### Dev with live reload (fastest for UI work)

```bash
# Terminal 1 — web dev server
npm run dev --prefix client

# Terminal 2 — Capacitor live-reload against that dev server
cd mobile-capacitor
npx cap run android --live-reload --external --host 192.168.1.16
```

The app on the emulator re-renders on every save. No APK rebuild needed.

## Producing a signed release APK

```bash
cd mobile-capacitor
npm run build:web
npx cap sync android
cd android
./gradlew.bat assembleRelease
```

APK ends up at `android/app/build/outputs/apk/release/app-release.apk`.
To sign for Play Store, follow: https://capacitorjs.com/docs/android/deploying-to-google-play

## API endpoint

The client reads `VITE_API_URL` at build time. It's configured in
`../client/.env.production` — currently pointing to `https://projectx-zja5.onrender.com`.

To test against a local server instead, set `VITE_API_URL=http://192.168.1.16:4000`
in that file and rebuild.

## Troubleshooting

**"JAVA_HOME is not set"** — the shell running Gradle didn't inherit it. Prefix the
command with `JAVA_HOME=D:/Android/jbr` or set it permanently via
`[Environment]::SetEnvironmentVariable("JAVA_HOME", "D:\Android\jbr", "User")`.

**"Device not found"** — make sure the emulator is running:
```
%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -avd Pixel_10_Pro_XL
```
Then `adb devices` should list `emulator-5554`.

**White screen on app launch** — means the JS failed to load. Check
`adb logcat | grep -i chromium` for WebView errors. Most common: API URL mismatch
or CORS (but Capacitor origin is `https://localhost` — our server already allows
no-origin requests, so this rarely bites).

**Rebuild cache issues** — `cd android && ./gradlew.bat clean` then re-run.
