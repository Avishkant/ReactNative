# Android Development Workspace

Welcome — this workspace contains multiple small, focused React Native projects and utilities I build for demos, experiments and small product features. Each project is self-contained and intended to be easy to run, test, and reuse.

## At a glance

- Purpose: mobile utilities (localization, numeric transformation, small finance tools)
- Primary projects:
  - **NumToWords** — number-to-words utility (English/Hindi) + React Native demo app. Includes screenshots and build scripts.
  - **VillIntCalci** — village interest / payment calculator app with clear UX and pure TS calculation helpers.
- All projects have a local `android/` (and where applicable `ios/`) folder — run them independently.

## Quick start (developer)

1. Pick the project directory (example: `NumToWords`)

```powershell
Set-Location -LiteralPath 'G:\Code_Playground\Android Developement\NumToWords'
npm install
npm start        # starts Metro
npm run android  # builds & runs on connected Android device/emulator
```

2. Repeat the pattern for `VillIntCalci` or any other project in this workspace.

## Build a shareable Android APK

From the target project's `android/` folder (Windows PowerShell):

```powershell
Set-Location -LiteralPath 'G:\Code_Playground\Android Developement\<PROJECT_NAME>\android'
.\gradlew.bat assembleRelease
# The generated APK will be at: <PROJECT_NAME>\android\app\build\outputs\apk\release\app-release.apk
```

Notes on signing:
- Some projects here use the debug keystore for quick `assembleRelease` runs. That produces installable APKs but NOT Play-Store-signed packages. For production, generate a release keystore and configure `android/gradle.properties` and `android/app/build.gradle` signing settings.

## Tests & utilities

- Unit tests live under each project's `__tests__/` folder. Run `npm test` from the project root.
- Core reusable logic is placed under `src/utils` inside projects so it can be extracted or reused easily.

## Troubleshooting tips

- If you get long-path or CMake errors on Windows, create a short junction and build from it (example used during development):

```powershell
cmd /c mklink /J "C:\numproj" "G:\Code_Playground\Android Developement\NumToWords"
Set-Location -LiteralPath 'C:\numproj\android'
.\gradlew.bat assembleRelease
```

- If Kotlin/Gradle incremental cache issues appear, try:

```powershell
.\gradlew.bat --stop
.\gradlew.bat clean
```

## Repository notes (for reviewers)

- The repository root is this folder: `G:\Code_Playground\Android Developement`.
- Projects are subfolders. If a project should be its own repository, split or create a separate repo with its folder as root.
- I keep README files per project; see `NumToWords/README.md` and `VillIntCalci/README.md` for project-specific documentation and screenshots.
