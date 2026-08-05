# Epics

Full implementation detail (file paths, code, tests) lives in
`docs/superpowers/plans/2026-08-05-adhd-wins-overlay.md`. This file tracks
Epic/Task IDs and status only.

## E1 — Project Scaffolding & Tooling

- [ ] **T1** Scaffold electron-vite + React + TypeScript project
- [ ] **T2** Configure Vitest + React Testing Library for renderer unit tests
- [ ] **T3** Configure Playwright for Electron e2e tests
- [ ] **T4** Configure electron-builder for Windows packaging (cross-platform-ready)

## E2 — Overlay Window & Global Shortcut

- [ ] **T5** `shared/ipc-contract.ts` — channel names and shared types
- [ ] **T6** `main/window.ts` — overlay window creation and default bounds
- [ ] **T7** Window bounds persistence via electron-store
- [ ] **T8** Global shortcut — OS-aware default, toggle registration

## E3 — Data Layer (Wins & Settings Persistence)

- [ ] **T9** `main/store.ts` — full schema (wins + settings)
- [ ] **T10** `main/ipc.ts` — IPC handlers for wins and settings
- [ ] **T11** `preload/index.ts` — contextBridge API surface

## E4 — Wins UI

- [ ] **T12** `renderer/lib/bins.ts` — rating → bin → emoji/animation mapping
- [ ] **T13** `renderer/lib/wins.ts` — newest-first sort
- [ ] **T14** `AddWinForm` component
- [ ] **T15** `WinsList` / `WinItem` components
- [ ] **T16** `App.tsx` wiring + warm/joyful theme

## E5 — Celebration Animations & Sound

- [ ] **T17** `renderer/lib/sound.ts` — synthesized chime helpers
- [ ] **T18** `Celebration.tsx` — animation trigger + per-bin variants
- [ ] **T19** `SettingsPanel` — shortcut display/edit + volume slider

## E6 — Integration Testing & Packaging

- [ ] **T20** Full Playwright e2e flow
- [ ] **T21** Windows packaging verification
