# Completed Epics

## E8 — System Tray Icon (COMPLETED 2026-08-17)

- [x] **T27** `main/tray.ts` — `createTray`/`buildTrayMenuTemplate` with placeholder icon, tooltip, Show/Hide + Quit menu
- [x] **T28** `main/index.ts` wiring — create tray on startup, `__testTrayExists` test hook
- [x] **T29** Playwright e2e coverage — tray is created on launch

## E7 — Win Editing (Update & Delete) (COMPLETED 2026-08-17)

- [x] **T22** `main/ipc.ts` — `updateWin`/`deleteWin` + `wins:update`/`wins:delete` IPC handlers
- [x] **T23** `preload/index.ts` — expose `wins.update`/`wins.delete`
- [x] **T24** `WinItem` — click-to-edit text, click-to-edit rating picker, delete button (edit mode only)
- [x] **T25** `App.tsx` wiring — replay celebration when a rating edit changes the value
- [x] **T26** Playwright e2e coverage — rating-change replays celebration, text edit doesn't, delete removes the row

## E5 — Celebration Animations & Sound (COMPLETED 2026-08-15)

- [x] **T17** `renderer/lib/sound.ts` — synthesized chime helpers
- [x] **T18** `Celebration.tsx` — animation trigger + per-bin variants
- [x] **T19** `SettingsPanel` — shortcut display/edit + volume slider

## E4 — Wins UI (COMPLETED 2026-08-15)

- [x] **T12** `renderer/lib/bins.ts` — rating → bin → emoji/animation mapping
- [x] **T13** `renderer/lib/wins.ts` — newest-first sort
- [x] **T14** `AddWinForm` component
- [x] **T15** `WinsList` / `WinItem` components
- [x] **T16** `App.tsx` wiring + warm/joyful theme

## E3 — Data Layer (Wins & Settings Persistence) (COMPLETED 2026-08-15)

- [x] **T9** `main/store.ts` — full schema (wins + settings)
- [x] **T10** `main/ipc.ts` — IPC handlers for wins and settings
- [x] **T11** `preload/index.ts` — contextBridge API surface

## E2 — Overlay Window & Global Shortcut (COMPLETED 2026-08-15)

- [x] **T5** `shared/ipc-contract.ts` — channel names and shared types
- [x] **T6** `main/window.ts` — overlay window creation and default bounds
- [x] **T7** Window bounds persistence via electron-store
- [x] **T8** Global shortcut — OS-aware default, toggle registration

## E1 — Project Scaffolding & Tooling (COMPLETED 2026-08-15)

- [x] **T1** Scaffold electron-vite + React + TypeScript project
- [x] **T2** Configure Vitest + React Testing Library for renderer unit tests
- [x] **T3** Configure Playwright for Electron e2e tests
- [x] **T4** Configure electron-builder for Windows packaging (cross-platform-ready)
