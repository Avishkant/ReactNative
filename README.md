# ReactNative (multi-project monorepo)

This repository contains multiple small React Native example projects. The repo root now hosts two project folders:

- `FirstProject/`
- `secondProject/`

I replaced the remote `main` with these two folders as requested. A backup of the previous `main` is available on the remote branch `remote-main-backup`. Local backups of nested `.git` directories are saved as `FirstProject_git_backup/` and `secondProject_git_backup/` in the repo root (if present).

---

## How this repo is organized

Each project lives in its own top-level folder and should be runnable independently. Keep each project's own `package.json` so you can install dependencies and run them separately.

Future projects: add new folders at the repository root (for example `thirdProject/`) and commit/push them the same way.

---

## Projects and how to run them (PowerShell examples)

### FirstProject
Location: `FirstProject/`

Basic steps to run locally on Windows (PowerShell):

```powershell
cd "G:\Code_Playground\Android Developement\FirstProject"
# install dependencies if needed
npm install
# start Metro bundler
npx react-native start
# in a new terminal, run on Android device/emulator
npx react-native run-android
# Or to run on iOS (macOS only):
# npx react-native run-ios
```

Run tests (if present):

```powershell
cd "G:\Code_Playground\Android Developement\FirstProject"
npm test
```


### secondProject
Location: `secondProject/`

Basic steps (PowerShell):

```powershell
cd "G:\Code_Playground\Android Developement\secondProject"
npm install
npx react-native start
# in another terminal
npx react-native run-android
```

Run tests:

```powershell
cd "G:\Code_Playground\Android Developement\secondProject"
npm test
```

---

## Notes & tips

- Remote backup: the old remote main is stored in branch `remote-main-backup` on origin. You can restore or inspect it there.
- Local nested git backups: If your projects previously had their own `.git` folders, I moved them into `FirstProject_git_backup/` and `secondProject_git_backup/`. If you want to restore their independent histories later, move the saved `.git` back into the project folder.
- If you want to preserve independent history for each project on GitHub, consider creating separate repositories for each project or using `git subtree`/submodule workflows. I can help with that.
- For subsequent projects, create a new top-level folder (e.g., `thirdProject/`), add the project files and `package.json`, then commit & push.

---

If you want, I can also:
- Create a small CI workflow or GitHub Actions template to run tests for each project on push.
- Convert the local nested git backups into separate GitHub repos and re-link them as submodules.
- Add a top-level script to run any project's Metro server from the repo root.

Which of these (if any) should I do next?
