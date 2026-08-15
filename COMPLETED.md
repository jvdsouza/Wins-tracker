# Completed Epics

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
