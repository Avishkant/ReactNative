<!--
Project-specific Copilot instructions for the FlashLight React Native app.
Keep this short and actionable so AI coding agents can be productive immediately.
-->

# Copilot Instructions — FlashLight (React Native)

Purpose: Help AI agents reason about, modify, build, and test this React Native (bare) app.

- **Big picture**: This is a TypeScript React Native app (not Expo) with native Android and iOS projects under `android/` and `ios/`. The JS entrypoint is `index.js` which registers `App` from `App.tsx`. `App.tsx` currently uses the `@react-native/new-app-screen` template and `react-native-safe-area-context`.

- **Key files & locations**:

  - `index.js` — app entry / registration (AppRegistry).
  - `App.tsx` — main React component (TypeScript, functional components, SafeAreaProvider).
  - `package.json` — scripts: `start`, `android`, `ios`, `lint`, `test`.
  - `tsconfig.json` — extends `@react-native/typescript-config` (project TS settings).
  - `android/app/build.gradle` — Android native configuration (debug signing, hermes checks, proguard flag).
  - `ios/Podfile` — CocoaPods setup; use `npx pod-install ios` after native dependency changes.
  - `babel.config.js` and `metro.config.js` — JS toolchain config.

- **Node / environment**:

  - Node engine specified `>=20` in `package.json`. Use Node 20+.
  - This repo uses the React Native CLI (see scripts in `package.json`).

- **Common developer workflows (actions for the AI to suggest/run)**:

  - Install deps (Windows):
    ```powershell
    npm install
    ```
  - Start Metro (packager):
    ```powershell
    npm start
    # or
    npx react-native start
    ```
  - Run Android (Windows):
    ```powershell
    npm run android
    # (equivalent to `npx react-native run-android`)
    ```
  - Run iOS (macOS only):
    ```bash
    npm install
    npx pod-install ios
    npm run ios
    ```
  - Running tests / lint:
    ```powershell
    npm test
    npm run lint
    ```

- **Native changes / rebuilding**:

  - When adding native modules on iOS: run `npx pod-install ios` (or `cd ios && pod install`).
  - When editing native Android gradle settings or adding native libs: run a clean and rebuild (`cd android; ./gradlew clean; cd ..; npm run android`).
  - The Android debug keystore is configured in `android/app/build.gradle` (debug signing). Production builds require replacing this.

- **Project-specific conventions & patterns**:

  - TypeScript is used across the JS layer; prefer `.tsx`/`.ts` files and keep `tsconfig.json`'s include/exclude in mind (`Pods` and `node_modules` excluded).
  - UI uses functional components and React hooks (e.g., `useColorScheme`, `useSafeAreaInsets`).
  - The project keeps the default New App Screen; modifications commonly replace `NewAppScreen` in `App.tsx`.
  - Autolinking is enabled for native modules (React Native default). See `react { autolinkLibrariesWithApp() }` in `android/app/build.gradle`.

- **Build flags & notable settings**:

  - Hermes usage is checked in `android/app/build.gradle` (look for `hermesEnabled`). Be careful changing Hermes settings — rebuild native code after toggling.
  - Proguard/minification is disabled by default (`enableProguardInReleaseBuilds = false`).

- **What to look at when asked to change behavior**:

  - For JS/UI changes: modify `App.tsx` or create components under a new `src/` folder and update imports.
  - For navigation or native features: check `android/` and `ios/` folders and instruct to run `pod-install` / Gradle clean after changes.
  - For problems with Metro bundling: clear cache: `npx react-native start --reset-cache`.

- **Helpful quick examples (prompts an AI can follow)**:

  - "Replace the NewAppScreen in `App.tsx` with a simple toggle that toggles device flashlight state (stubbed function)." — AI should only change `App.tsx` and add helper files, not touch native code unless requested.
  - "Add ESLint rule exceptions for files in `android/` and `ios/` in the project config" — edit `.eslintrc` or `package.json` eslint config (project currently uses `@react-native/eslint-config`).

- **Don't assume**:
  - This is not an Expo-managed app; do not use `expo` commands or APIs unless the code explicitly includes Expo.
  - iOS build steps require macOS and CocoaPods.

If anything here is unclear or you want the doc to prioritize a specific workflow (e.g., CI steps, contributor experience, or more examples for common PR tasks), tell me which area to expand and I'll iterate.
