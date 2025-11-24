<!-- Auto-generated guidance for AI coding agents working on this repository. Keep concise and actionable. -->

# Copilot instructions — ReactNative monorepo (concise)

This file contains repository-specific guidance to help an AI code assistant be productive quickly.

1. Project structure & big picture

- This repo is a multi-project React Native workspace. Each top-level folder like `FirstProject/` and `secondProject/` is an independent RN app. Focus on one project at a time (most recent work lives in `secondProject/`).
- UI components are under `secondProject/Components/`. Game logic utilities are under `secondProject/utils/` (see `tambola.js`). Tests live in `secondProject/__tests__/` and target the utilities.

2. Key files to read first

- `secondProject/Components/TambolaScreen.jsx` — primary screen: state management, persistence keys, UI controls (Draw/New/Reset), and how ticket/claims are exercised.
- `secondProject/Components/Ticket.jsx` — renders a 3x9 ticket grid and handles per-cell animations and press behavior.
- `secondProject/utils/tambola.js` — game rules and helpers: `generateTicket()`, `createDrawBag()`, `drawNext()`, `checkRowComplete()`, `checkFullHouse()`.
- `secondProject/__tests__/tambola.test.js` — unit tests that show expected behavior and edge cases for the game helpers. Use these when changing rules.
- `secondProject/package.json` — scripts: `start`, `android`, `ios`, `test`, `lint`.

3. Conventions and patterns in this repo

- Persistence: `TambolaScreen.jsx` uses `@react-native-async-storage/async-storage` if available; otherwise an in-memory fallback is used for non-native environments/tests. Keys used: `tambola_ticket`, `tambola_bag`, `tambola_called`, `tambola_last`.
- State shapes: tickets are 3x9 arrays with numeric values or `null`. Called numbers are represented as a `Set` (converted to arrays when persisted). Draw bag is an array of numbers.
- UI interactions: tapping a numbered cell toggles that number in the `called` Set. Drawing uses `drawNext(bag)` from the utils which returns `{ next, bag }`.
- Tests focus on deterministic logic in `utils/tambola.js` — change logic here and update/add tests.

4. Build / test / debug commands (PowerShell examples)

- Run Metro bundler and Android (from project folder):

```powershell
cd "G:\Code_Playground\Android Developement\secondProject"
npm install
npx react-native start
# in a new terminal
npx react-native run-android
```

- Run unit tests (Jest):

```powershell
cd "G:\Code_Playground\Android Developement\secondProject"
npm test
```

- Linting:

```powershell
npm run lint
```

5. Where to make multiplayer changes (high-level)

- Network & sync layer: there is currently no networking. For multiplayer, add a small networking layer and a single source of truth (server or P2P host). Candidate locations:
  - `secondProject/utils/` — add `network/` subfolder containing synchronization adapters (WebSocket client, server mocks, and state adapters).
  - `secondProject/Components/TambolaScreen.jsx` — replace local-only state updates for `bag`, `called`, `last` with calls to the sync layer. Preserve local persistence as a cache.
- Keep game rules deterministic in `utils/tambola.js`. The authoritative source (server) should call these helpers (generate ticket, draw next) to avoid divergence.

6. Multiplayer implementation checklist (minimum viable)

- Decide architecture: authoritative server (recommended) vs peer-to-peer. Authoritative server reduces cheating and sync complexity.
- Server responsibilities:
  - Generate tickets or accept player-generated tickets.
  - Keep the master draw bag state and emit draws to all clients.
  - Validate claims (row/full-house) against the authoritative ticket/called set.
  - Optionally persist game history for reconnects.
- Client responsibilities:
  - Render ticket and local UI (reuse `Ticket.jsx`).
  - Subscribe to server events: `draw`, `player-joined`, `player-left`, `claim-result`, `state-sync`.
  - Send actions: `join-game`, `draw-request` (or `draw-ack` if server-driven), `toggle-mark` (optional local UX), `claim-row`, `claim-fullhouse`.
- Protocol examples (use JSON over WebSocket):
  - Server -> Clients: { type: 'draw', number: 42 }, { type: 'state', bag: [...], called: [...], players: [...] }
  - Client -> Server: { type: 'join', name: 'Alice' }, { type: 'claim', claimType: 'row', rowIndex: 1 }

7. Small, low-risk changes to start with

- Add a lightweight WebSocket client adapter (e.g. `secondProject/utils/network/wsClient.js`) that connects to a configurable URL and emits received messages as events.
- Wire the adapter into `TambolaScreen.jsx` so `onDraw` requests a draw from the server instead of mutating the bag locally. Keep a `--local` flag for single-player mode.
- Add tests for the network adapter (unit-test the message parsing) and one integration-style jest test mocking WebSocket messages to `TambolaScreen` logic.

8. Files and symbols to reference when implementing multiplayer

- `secondProject/Components/TambolaScreen.jsx` — where UI controls call `drawNext` and persist state.
- `secondProject/utils/tambola.js` — canonical game logic helpers (do not duplicate rules in the client/server).
- `secondProject/Components/Ticket.jsx` — UI rendering of ticket grid; reuse as-is.
- `secondProject/__tests__/tambola.test.js` — shows how tests create deterministic tickets.

9. Helpful examples / snippets (explicit)

- Persisted keys used by `TambolaScreen.jsx`: `tambola_ticket`, `tambola_bag`, `tambola_called`, `tambola_last`.
- Example event shape to emit from server on draw:

```json
{ "type": "draw", "number": 7 }
```

10. When to edit package.json

- Add small scripts for local dev servers, e.g. `start-server` for a Node-based authoritative server used in multiplayer testing.

11. Keep changes test-covered

- Update or add tests under `secondProject/__tests__/` when changing logic in `utils/tambola.js` or adding network adapters. Use the existing tests as templates.

If anything above is unclear or you want the file to include more examples (WebSocket adapter code, a tiny Node server scaffold, or CI workflow), tell me which and I will add it.
