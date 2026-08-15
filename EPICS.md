# Epics

Full implementation detail (file paths, code, tests) lives in
`docs/superpowers/plans/2026-08-05-adhd-wins-overlay.md`. This file tracks
Epic/Task IDs and status only.

## E4 — Wins UI

- [x] **T12** `renderer/lib/bins.ts` — rating → bin → emoji/animation mapping
- [x] **T13** `renderer/lib/wins.ts` — newest-first sort
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
