# ADHD Wins

A floating "wins" journal for your desktop. Summon it anywhere with a global
hotkey, log a win (optionally rated 1–10 for how big it felt), and watch it
celebrate with a size-appropriate animation and chime. Every win you log
stays visible, newest first — nothing gets crossed off or hidden.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (Node 20+ recommended)
- Windows (the only packaged target for v1 — see [Platform support](#platform-support))

## Install

```bash
npm install
```

## Run it

**Development** (hot-reloading Electron + React window):

```bash
npm run dev
```

**Production build** (compiles main/preload/renderer into `out/`):

```bash
npm run build
```

**Windows installer** (builds, then packages a Windows installer into `dist/`):

```bash
npm run package:win
```

That produces an NSIS installer (`.exe`) under `dist/`. Run it to install
"ADHD Wins" like any other Windows app, or just launch `out/main/index.js`
via `npm run build` output directly during development.

## Usage

1. **Open the overlay.** Press the global shortcut — `Alt+Shift+W` by default
   (`Cmd+Shift+W` on macOS) — from anywhere, even while another app is
   focused. Press it again to hide the overlay; it stays running in the
   background so your shortcut always works.
2. **Log a win.** Type what you did in the "What did you win?" field.
   Optionally pick a rating from 1 (small win) to 10 (huge win) — this
   controls which celebration animation and emoji you get. Leave it as
   "No rating" if you'd rather skip that.
3. **Submit.** Click "Add win" (or press Enter). Your win is saved
   immediately, added to the top of the list, and triggers a celebration
   animation with sound sized to the rating you gave it (small ratings get
   confetti pops, big ratings get bigger effects, unrated wins get a neutral
   celebration).
4. **Review your wins.** Every win you've logged stays listed underneath the
   form, newest at the top. Wins are never checked off, archived, or hidden —
   this is meant to be a visible record you can scroll back through.
5. **Adjust settings.** Use the settings panel to:
   - Change the overlay shortcut — type a new accelerator (e.g. `Ctrl+Alt+J`)
     and click away from the field; it takes effect immediately, no restart
     needed.
   - Adjust the celebration sound volume with the slider (0–100%).

All data (your wins and settings) is persisted locally on disk via
`electron-store` — it's still there the next time you open the app.

## Platform support

v1 packages for **Windows only** (`electron-builder` → NSIS installer). The
codebase is written platform-agnostically (the shortcut default is
OS-aware: `Alt+Shift+W` on Windows/Linux, `Cmd+Shift+W` on macOS), so macOS
and Linux packaging targets can be added later as a config-only change to
`electron-builder.yml`.

## Development

**Run unit tests** (Vitest + React Testing Library):

```bash
npm run test:unit
```

**Run end-to-end tests** (Playwright against a built Electron app):

```bash
npm run test:e2e
```

### Project layout

```
src/
├── shared/         # IPC channel names + shared types (Win, Settings, AddWinInput)
├── main/           # Electron main process: window, global shortcut, persistence, IPC handlers
├── preload/        # contextBridge — exposes window.api to the renderer
└── renderer/       # React UI: add-win form, wins list, celebration animations, settings
```

Work is tracked in `EPICS.md` / `TODO.md` (in progress) and `COMPLETED.md`
(finished epics), per this project's contribution conventions in `AGENTS.md`.
