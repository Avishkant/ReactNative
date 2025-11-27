# VillIntCalci

A clean, focused React Native utility app for village interest calculations — modern UI, clear results, and offline-friendly logic.

## Highlights

- Purpose-built calculator (interest / payments / quick financial summaries)
- Clean mobile UI with localization-ready strings
- Lightweight, testable utility functions in `src/utils`
- Screenshots below show the app screens and example flows

## Screenshots

<p align="center">
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-32-916_com.villintcalci.jpg" alt="Home" width="220" style="margin:6px;" />
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-41-102_com.villintcalci.jpg" alt="Input form" width="220" style="margin:6px;" />
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-44-301_com.villintcalci.jpg" alt="Calculation result" width="220" style="margin:6px;" />
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-48-221_com.villintcalci.jpg" alt="History or summary" width="220" style="margin:6px;" />
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-52-187_com.villintcalci.jpg" alt="Settings" width="220" style="margin:6px;" />
  <img src="src/screenshots/Screenshot_2025-11-27-15-57-56-415_com.villintcalci.jpg" alt="Alternate view" width="220" style="margin:6px;" />
</p>

## Quick overview 

VillIntCalci is a small, well-scoped mobile app that demonstrates practical mobile UX for financial tasks in low-connectivity environments. It showcases:

- Clear input validation and friendly error messages
- Deterministic calculation logic implemented in plain TypeScript functions
- Readable, maintainable components suitable for fast iteration

## Developer: run & build

1. Install dependencies

```bash
npm install
```

2. Start Metro

```bash
npm start
```

3. Run on Android

```bash
npm run android
```

4. Build release APK (Windows PowerShell)

```powershell
Set-Location -LiteralPath 'android'
.\gradlew.bat assembleRelease
# APK at android\app\build\outputs\apk\release\app-release.apk
```

## Where the logic lives

- `src/utils` — calculation helpers and pure functions (easy to test)
- `src/screens` — screen components and UI layout

## Testing

- Unit tests are available under `__tests__/` — run `npm test`.

## Contributing 

- PRs welcome: include tests for calculation changes and a short description of the business rules.

- Commit this README update for you.
