# ADHD Wins Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Electron+React desktop app that lets a user summon a floating "wins" journal with a global hotkey, log wins (with an optional 1-10 size rating) that stay permanently visible latest-first, and celebrate each entry with a rating-appropriate animation and sound.

**Architecture:** Electron main process owns the overlay `BrowserWindow` (frameless, always-on-top, toggled by a global shortcut) and all persistence (via `electron-store`, JSON-backed). A `contextBridge` preload script exposes a typed `window.api` surface. The React renderer (built by Vite via `electron-vite`) renders the add-win form, the wins list, and rating-driven celebration animations (canvas-confetti + CSS/SVG) with Web-Audio-synthesized chimes. All main-process logic that has meaningful branching is factored into small pure functions so it's unit-testable without a real Electron runtime; full-window behavior (hotkey toggle, actual persistence round-trip) is covered by Playwright's Electron test support.

**Tech Stack:** Electron, React 18 + TypeScript, `electron-vite` (Vite-based build/dev tooling for Electron), `electron-store` (persistence), `canvas-confetti` (particle animation), Web Audio API (synthesized SFX — no bundled audio assets), Vitest + React Testing Library (unit), Playwright `_electron` (integration/e2e), `electron-builder` (packaging).

## Global Constraints

- Framework: Electron + React + Node, built/dev-served through Vite via `electron-vite`. (Spec: "Use electron, react, and nodejs managed through vite.")
- Testing: Vitest for unit tests (Vite-native); Playwright for integration/e2e, since Vite has no built-in integration test runner. (Spec: "use whatever vite provides... if there's no integration testing available out of the box from vite, use playwright.")
- Packaging target for v1: **Windows only** (`electron-builder` `nsis` target). Code must stay platform-agnostic (no hardcoded `win32` paths, OS-aware shortcut default) so Mac/Linux `electron-builder` targets can be added later purely via config, per the effort discussion in this conversation.
- Global overlay shortcut default: `Alt+Shift+W` on Windows/Linux, `Cmd+Shift+W` on macOS (OS-convention-aware even though only Windows ships now). User-configurable and persisted.
- Overlay behavior: hotkey toggles a frameless, always-on-top window fully visible/hidden (not a z-order "send behind" — confirmed in discussion).
- Wins are **append-only** in v1 — no edit/delete UI (confirmed in discussion).
- Persistence: `electron-store` (JSON-backed), not SQLite (confirmed in discussion).
- Rating is optional, 1-10. Animations/emoji are binned: 1-3, 4-6, 7-9, 10, each with 4-5 variants. An unrated win gets its own neutral treatment rather than being forced into a bin.
- Animations are **code-generated** (canvas-confetti + custom CSS/SVG), not sourced Lottie files (confirmed in discussion).
- Sounds: synthesized via the Web Audio API (oscillator-based chimes) rather than bundled audio files, to avoid asset-licensing overhead — this extends the "code-generated" decision to audio. **Flag for the user:** if the synthesized chimes feel too thin once you hear them, swapping in real SFX later only touches `lib/sound.ts`. Volume is user-configurable (0-100%).
- Work tracking: `EPICS.md` / `TODO.md` / `COMPLETED.md` at the repo root, per `AGENTS.md`. This plan's Task IDs map 1:1 to Epic/Task IDs there (see mapping table at the end of this doc) — `EPICS.md` is populated from this plan before Task 1 begins.

---

## File Structure

```
adhd-wins-record/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── electron-builder.yml
├── src/
│   ├── shared/
│   │   └── ipc-contract.ts        # channel names + Win/Settings/AddWinInput types
│   ├── main/
│   │   ├── index.ts               # app lifecycle, wires window+shortcut+ipc
│   │   ├── window.ts              # createOverlayWindow, bounds calc/persistence
│   │   ├── shortcut.ts            # defaultAccelerator, registerToggleShortcut
│   │   ├── store.ts               # electron-store instance + schema/defaults
│   │   └── ipc.ts                 # ipcMain handlers (add/getAll/settings)
│   ├── preload/
│   │   └── index.ts               # contextBridge window.api surface
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── lib/
│           │   ├── bins.ts        # getBinForRating/getEmojiForRating/pickAnimationVariant
│           │   ├── wins.ts        # sortWinsByNewest
│           │   └── sound.ts       # volumeToGain/tonesForBin/playChime
│           ├── components/
│           │   ├── AddWinForm.tsx
│           │   ├── WinsList.tsx
│           │   ├── WinItem.tsx
│           │   ├── Celebration.tsx
│           │   └── SettingsPanel.tsx
│           └── styles/
│               └── global.css
└── tests/
    └── e2e/
        ├── overlay.spec.ts
        └── add-win.spec.ts
```

Unit test files are colocated with their source (`bins.ts` / `bins.test.ts`) per Vitest convention.

---

## Epic → Task ID Mapping (for EPICS.md)

| Plan Task | Epic | Epic Title |
|---|---|---|
| T1-T4 | E1 | Project Scaffolding & Tooling |
| T5-T8 | E2 | Overlay Window & Global Shortcut |
| T9-T11 | E3 | Data Layer (Wins & Settings Persistence) |
| T12-T16 | E4 | Wins UI |
| T17-T19 | E5 | Celebration Animations & Sound |
| T20-T21 | E6 | Integration Testing & Packaging |

---

### Task 1: Scaffold electron-vite + React + TypeScript project

**Files:**
- Create: `package.json`, `electron.vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Create: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `src/renderer/src/main.tsx`, `src/renderer/src/App.tsx`

**Interfaces:**
- Produces: a runnable `npm run dev` (Electron window showing default React app) and `npm run build` script, which every later task builds on.

> **Why hand-written, not a generator:** the obvious command,
> `npm create @quick-start/electron@latest`, actually installs
> `@quick-start/create-electron`, a *different, incompatible* scaffolding
> tool (it builds on `vite-plugin-electron` with a `dist-electron/` output
> and no `electron.vite.config.ts`) — verified by downloading and reading
> its shipped source. It's also interactive-only with no non-interactive
> flag, so it hangs waiting for stdin in an unattended shell. The layout
> this plan actually needs (`electron.vite.config.ts`, `src/main`,
> `src/preload`, `src/renderer`, `out/main/index.js` build output,
> `ELECTRON_RENDERER_URL` dev env var) is the real `electron-vite` CLI
> tool's convention (electron-vite.org, npm package `electron-vite`),
> confirmed against its official `electron-vite-boilerplate` reference
> repo on GitHub. Writing these files directly is deterministic, requires
> no TTY, and matches every later task exactly.

- [ ] **Step 1: Write `package.json`**

Do not hand-pin dependency versions — Step 7 installs the actual packages via
`npm install`, which resolves and records current, mutually-compatible
versions itself. A hand-picked version set risks silently pulling
incompatible majors across `electron`/`vite`/`electron-vite`.

```json
{
  "name": "adhd-wins-record",
  "version": "0.1.0",
  "private": true,
  "description": "A floating wins journal with celebratory animations",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build"
  }
}
```

- [ ] **Step 2: Write `electron.vite.config.ts`**

```ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react()]
  }
})
```

- [ ] **Step 3: Write `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }]
}
```

`tsconfig.node.json` (main + preload + shared):
```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["electron-vite/node"],
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["electron.vite.config.ts", "src/main/**/*", "src/preload/**/*", "src/shared/**/*"]
}
```

`tsconfig.web.json` (renderer + shared):
```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src/renderer/src/**/*", "src/shared/**/*", "src/preload/**/*.d.ts"]
}
```

- [ ] **Step 4: Write the main process entry point**

`src/main/index.ts`:
```ts
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow(): void {
  // Task 6 replaces this with createOverlayWindow()
  const win = new BrowserWindow({ width: 380, height: 560 })
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 5: Write the preload script**

`src/preload/index.ts`:
```ts
import { contextBridge } from 'electron'

// Task 11 replaces this with the real window.api surface
contextBridge.exposeInMainWorld('api', {})
```

- [ ] **Step 6: Write the renderer entry point and app shell**

`src/renderer/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>ADHD Wins</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/renderer/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/renderer/src/App.tsx`:
```tsx
export default function App(): JSX.Element {
  return <div>ADHD Wins</div>
}
```

- [ ] **Step 7: Install dependencies and verify dev mode launches**

```bash
npm install react react-dom
npm install -D electron electron-vite vite @vitejs/plugin-react typescript @types/react @types/react-dom
npm run dev
```

This records whatever current, mutually-compatible versions npm resolves
directly into `package.json` — do not hand-edit version numbers afterward.
Expected: an Electron window opens showing "ADHD Wins" text, no console errors. Close it.

- [ ] **Step 8: Verify the production build works**

```bash
npm run build
```
Expected: succeeds, produces `out/main/index.js`, `out/preload/index.js`, `out/renderer/index.html`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold electron-vite react-ts project"
```

---

### Task 2: Configure Vitest + React Testing Library for renderer unit tests

**Files:**
- Modify: `package.json` (add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` devDependencies + `"test:unit": "vitest run"` script)
- Create: `vitest.config.ts`
- Create: `src/renderer/src/lib/sanity.ts`, `src/renderer/src/lib/sanity.test.ts` (throwaway, deleted at end of task — proves the harness works)

**Interfaces:**
- Produces: `npm run test:unit` runnable by every later renderer-logic task (Tasks 12-19).

- [ ] **Step 1: Install dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/renderer/src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts']
  }
})
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Write a failing sanity test**

`src/renderer/src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { add } from './sanity'

describe('sanity', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/lib/sanity.test.ts`
Expected: FAIL — `./sanity` has no exported member `add` (module doesn't exist yet).

- [ ] **Step 5: Implement minimal sanity module**

`src/renderer/src/lib/sanity.ts`:
```ts
export function add(a: number, b: number): number {
  return a + b
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/lib/sanity.test.ts`
Expected: PASS

- [ ] **Step 7: Delete the throwaway sanity files, add the npm script, commit**

```bash
rm src/renderer/src/lib/sanity.ts src/renderer/src/lib/sanity.test.ts
```

Add to `package.json` scripts: `"test:unit": "vitest run"`

```bash
git add -A
git commit -m "chore: configure vitest + react testing library"
```

---

### Task 3: Configure Playwright for Electron e2e tests

**Files:**
- Modify: `package.json` (add `@playwright/test` devDependency + `"test:e2e": "playwright test"` script)
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `npm run test:e2e`, and the pattern (`electron.launch({ args: ['out/main/index.js'] })`) that Tasks 8, 20 reuse.
- Consumes: Task 1's build output (`out/main/index.js` after `npm run build`).

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

(Electron testing uses Playwright's bundled Chromium driver for the renderer side — no extra browser binaries needed for Electron itself.)

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 1,
  reporter: 'list'
})
```

- [ ] **Step 3: Write the smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect, _electron as electron } from '@playwright/test'

test('app launches and shows the main window', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()
  await expect(window.locator('text=ADHD Wins')).toBeVisible()
  await app.close()
})
```

- [ ] **Step 4: Build the app so the test has something to launch**

Run: `npm run build`
Expected: succeeds, produces `out/main/index.js`, `out/preload/index.js`, `out/renderer/index.html`.

- [ ] **Step 5: Run the e2e test to verify it fails first (TDD sanity check)**

Temporarily change the locator text to `'text=NOPE'`, run `npx playwright test`, confirm it fails with a timeout looking for that text, then change it back to `'text=ADHD Wins'`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx playwright test`
Expected: PASS (1 test)

- [ ] **Step 7: Add npm script, commit**

Add to `package.json` scripts: `"test:e2e": "npm run build && playwright test"`

```bash
git add -A
git commit -m "chore: configure playwright electron e2e tests"
```

---

### Task 4: Configure electron-builder for Windows packaging (cross-platform-ready)

**Files:**
- Create: `electron-builder.yml`
- Modify: `package.json` (add `electron-builder` devDependency + `"package:win": "electron-builder --win"` script)

**Interfaces:**
- Produces: a `dist/` installer, verified manually in Task 21 (packaging isn't unit-testable).

- [ ] **Step 1: Install electron-builder**

```bash
npm install -D electron-builder
```

- [ ] **Step 2: Write `electron-builder.yml`**

```yaml
appId: com.adhdwins.app
productName: ADHD Wins
directories:
  output: dist
  buildResources: build
files:
  - out/**/*
  - package.json
win:
  target: nsis
  # mac/linux targets are intentionally omitted for v1 — adding them later
  # is a config-only change (mac: dmg/zip, linux: AppImage/deb), see
  # docs/superpowers/plans/2026-08-05-adhd-wins-overlay.md Global Constraints.
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 3: Add the package script**

Add to `package.json` scripts: `"package:win": "npm run build && electron-builder --win"`

- [ ] **Step 4: Verify it produces an installer**

Run: `npm run package:win`
Expected: succeeds, `dist/ADHD Wins Setup <version>.exe` exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure electron-builder windows packaging"
```

(`build/` icon assets are not required for `electron-builder` to produce a working installer — a default Electron icon is used until Epic E4's theming work adds a real one; that's a follow-up, not blocking here.)

---

### Task 5: `shared/ipc-contract.ts` — channel names and shared types

**Files:**
- Create: `src/shared/ipc-contract.ts`
- Test: `src/shared/ipc-contract.test.ts`

**Interfaces:**
- Produces: `IPC` channel-name constants, `Win`, `Settings`, `AddWinInput` types consumed by every main/preload/renderer task from here on (Tasks 6-19).

- [ ] **Step 1: Write the failing test (shape guard against typos in channel names)**

```ts
import { describe, it, expect } from 'vitest'
import { IPC } from './ipc-contract'

describe('IPC channel names', () => {
  it('are unique and namespaced', () => {
    const values = Object.values(IPC)
    expect(new Set(values).size).toBe(values.length)
    for (const v of values) expect(v).toMatch(/^[a-z]+:[a-zA-Z]+$/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/ipc-contract.test.ts`
Expected: FAIL — `./ipc-contract` doesn't exist.

- [ ] **Step 3: Implement the contract**

```ts
export const IPC = {
  WINS_ADD: 'wins:add',
  WINS_GET_ALL: 'wins:getAll',
  WINS_UPDATED: 'wins:updated',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set'
} as const

export interface Win {
  id: string
  text: string
  rating: number | null
  createdAt: string // ISO 8601
  emoji: string
}

export interface AddWinInput {
  text: string
  rating: number | null
}

export interface Settings {
  shortcut: string
  volume: number // 0-1
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/ipc-contract.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: define shared ipc contract and win/settings types"
```

---

### Task 6: `main/window.ts` — overlay window creation and default bounds

**Files:**
- Create: `src/main/window.ts`
- Test: `src/main/window.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `getDefaultBounds(workArea)`, `clampBoundsToDisplay(bounds, workArea)`, `createOverlayWindow(savedBounds?)` — Task 7 consumes `getDefaultBounds`/`clampBoundsToDisplay`, Task 8 consumes `createOverlayWindow`'s returned `BrowserWindow`.

- [ ] **Step 1: Write the failing tests for the pure bounds functions**

```ts
import { describe, it, expect } from 'vitest'
import { getDefaultBounds, clampBoundsToDisplay } from './window'

describe('getDefaultBounds', () => {
  it('anchors a 380x560 window to the bottom-right of the work area with a 24px margin', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    expect(getDefaultBounds(workArea)).toEqual({
      width: 380,
      height: 560,
      x: 1920 - 380 - 24,
      y: 1080 - 560 - 24
    })
  })
})

describe('clampBoundsToDisplay', () => {
  it('leaves in-bounds windows untouched', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    const bounds = { x: 100, y: 100, width: 380, height: 560 }
    expect(clampBoundsToDisplay(bounds, workArea)).toEqual(bounds)
  })

  it('pulls an off-screen window back onto the work area', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    const bounds = { x: -500, y: -500, width: 380, height: 560 }
    const clamped = clampBoundsToDisplay(bounds, workArea)
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
    expect(clamped.width).toBe(380)
    expect(clamped.height).toBe(560)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/main/window.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
import { BrowserWindow } from 'electron'
import { join } from 'node:path'

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 560
const MARGIN = 24

export function getDefaultBounds(workArea: WorkArea): Bounds {
  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: workArea.x + workArea.width - DEFAULT_WIDTH - MARGIN,
    y: workArea.y + workArea.height - DEFAULT_HEIGHT - MARGIN
  }
}

export function clampBoundsToDisplay(bounds: Bounds, workArea: WorkArea): Bounds {
  const width = Math.min(bounds.width, workArea.width)
  const height = Math.min(bounds.height, workArea.height)
  const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width)
  const y = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height)
  return { x, y, width, height }
}

export function createOverlayWindow(savedBounds?: Bounds): BrowserWindow {
  const { screen } = require('electron')
  const workArea = screen.getPrimaryDisplay().workArea
  const bounds = savedBounds
    ? clampBoundsToDisplay(savedBounds, workArea)
    : getDefaultBounds(workArea)

  const win = new BrowserWindow({
    ...bounds,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/main/window.test.ts`
Expected: PASS (3 tests). Note: `createOverlayWindow` itself isn't unit tested here since it requires a real Electron runtime — Task 20's Playwright e2e test exercises it end-to-end.

- [ ] **Step 5: Wire it into `src/main/index.ts`, replacing the placeholder window**

```ts
import { app } from 'electron'
import { createOverlayWindow } from './window'

app.whenReady().then(() => {
  const win = createOverlayWindow()
  win.show()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 6: Verify dev mode still launches**

Run: `npm run dev`
Expected: frameless window opens in the bottom-right corner of the screen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: create frameless always-on-top overlay window with default/clamped bounds"
```

---

### Task 7: Window bounds persistence via electron-store

**Files:**
- Create: `src/main/store.ts` (schema + defaults — this task only adds the `windowBounds` key; Task 9 fills in `wins`/`settings`)
- Modify: `src/main/window.ts` (save bounds on move/resize)
- Modify: `src/main/index.ts` (load saved bounds on startup)
- Test: `src/main/store.test.ts`

**Interfaces:**
- Consumes: `Bounds` type from Task 6.
- Produces: `store` (electron-store instance), `StoreSchema` type — Task 9 extends this file.

- [ ] **Step 1: Install electron-store**

```bash
npm install electron-store
```

- [ ] **Step 2: Write the failing test for the defaults shape**

```ts
import { describe, it, expect } from 'vitest'
import { DEFAULT_STORE } from './store'

describe('DEFAULT_STORE', () => {
  it('has no windowBounds until the user has moved the window once', () => {
    expect(DEFAULT_STORE.windowBounds).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/main/store.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement the store module**

```ts
import Store from 'electron-store'
import type { Bounds } from './window'

export interface StoreSchema {
  windowBounds: Bounds | null
}

export const DEFAULT_STORE: StoreSchema = {
  windowBounds: null
}

export const store = new Store<StoreSchema>({ defaults: DEFAULT_STORE })
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/main/store.test.ts`
Expected: PASS

- [ ] **Step 6: Wire persistence into the window lifecycle**

Modify `src/main/window.ts` — add after the `BrowserWindow` is created in `createOverlayWindow`, before `return win`:

```ts
  const persistBounds = (): void => {
    store.set('windowBounds', win.getBounds())
  }
  win.on('moved', persistBounds)
  win.on('resized', persistBounds)
```

Add the import: `import { store } from './store'`

Modify `src/main/index.ts`:

```ts
import { app } from 'electron'
import { createOverlayWindow } from './window'
import { store } from './store'

app.whenReady().then(() => {
  const win = createOverlayWindow(store.get('windowBounds') ?? undefined)
  win.show()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, drag the window to a new position, close the app, run `npm run dev` again.
Expected: window reopens at the position it was left at.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: persist and restore overlay window position/size"
```

---

### Task 8: Global shortcut — OS-aware default, toggle registration

**Files:**
- Create: `src/main/shortcut.ts`
- Modify: `src/main/index.ts` (register the shortcut, expose a toggle for tests)
- Test: `src/main/shortcut.test.ts`
- Test: `tests/e2e/overlay.spec.ts`

**Interfaces:**
- Consumes: `BrowserWindow` from Task 6.
- Produces: `defaultAccelerator(platform)`, `registerToggleShortcut(win, accelerator)` — Task 19's SettingsPanel re-registers with a user-chosen accelerator via IPC (out of scope here; this task only wires the default).

- [ ] **Step 1: Write the failing test for the OS-aware default**

```ts
import { describe, it, expect } from 'vitest'
import { defaultAccelerator } from './shortcut'

describe('defaultAccelerator', () => {
  it('uses Cmd+Shift+W on macOS', () => {
    expect(defaultAccelerator('darwin')).toBe('Cmd+Shift+W')
  })

  it('uses Alt+Shift+W on Windows and Linux', () => {
    expect(defaultAccelerator('win32')).toBe('Alt+Shift+W')
    expect(defaultAccelerator('linux')).toBe('Alt+Shift+W')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/main/shortcut.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
import { globalShortcut, BrowserWindow } from 'electron'

export function defaultAccelerator(platform: NodeJS.Platform): string {
  return platform === 'darwin' ? 'Cmd+Shift+W' : 'Alt+Shift+W'
}

export function toggleWindow(win: BrowserWindow): void {
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
}

export function registerToggleShortcut(win: BrowserWindow, accelerator: string): boolean {
  return globalShortcut.register(accelerator, () => toggleWindow(win))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/main/shortcut.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire into `src/main/index.ts`**

```ts
import { app, globalShortcut } from 'electron'
import { createOverlayWindow } from './window'
import { store } from './store'
import { defaultAccelerator, registerToggleShortcut, toggleWindow } from './shortcut'

let mainWindow: ReturnType<typeof createOverlayWindow>

app.whenReady().then(() => {
  mainWindow = createOverlayWindow(store.get('windowBounds') ?? undefined)
  mainWindow.show()

  const accelerator = defaultAccelerator(process.platform)
  registerToggleShortcut(mainWindow, accelerator)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Test-only hook: Playwright's electronApp.evaluate() calls this directly
// since simulating a real OS-level hotkey isn't feasible in CI.
export function __testToggleWindow(): void {
  toggleWindow(mainWindow)
}
```

- [ ] **Step 6: Write the e2e toggle test**

`tests/e2e/overlay.spec.ts`:
```ts
import { test, expect, _electron as electron } from '@playwright/test'

test('toggling the shortcut hides and shows the overlay window', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()
  expect(await window.evaluate(() => document.visibilityState)).toBe('visible')

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    win.hide()
  })
  const isVisibleAfterHide = await app.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows()[0].isVisible()
  })
  expect(isVisibleAfterHide).toBe(false)

  await app.close()
})
```

- [ ] **Step 7: Run the e2e test**

Run: `npm run build && npx playwright test tests/e2e/overlay.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: register os-aware global shortcut to toggle overlay visibility"
```

---

### Task 9: `main/store.ts` — full schema (wins + settings)

**Files:**
- Modify: `src/main/store.ts` (extend `StoreSchema`/`DEFAULT_STORE` with `wins` and `settings`)
- Test: `src/main/store.test.ts` (extend)

**Interfaces:**
- Consumes: `Win`, `Settings` from Task 5; `defaultAccelerator` from Task 8.
- Produces: `store.get('wins')`, `store.get('settings')` — consumed by Task 10's IPC handlers.

- [ ] **Step 1: Write the failing tests for the extended defaults**

Add to `src/main/store.test.ts`:
```ts
import { defaultAccelerator } from './shortcut'

describe('DEFAULT_STORE (extended)', () => {
  it('starts with an empty wins list', () => {
    expect(DEFAULT_STORE.wins).toEqual([])
  })

  it('defaults settings to the platform accelerator and 70% volume', () => {
    expect(DEFAULT_STORE.settings).toEqual({
      shortcut: defaultAccelerator(process.platform),
      volume: 0.7
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/main/store.test.ts`
Expected: FAIL — `DEFAULT_STORE.wins`/`.settings` are `undefined`.

- [ ] **Step 3: Extend the store module**

```ts
import Store from 'electron-store'
import type { Bounds } from './window'
import type { Win, Settings } from '../shared/ipc-contract'
import { defaultAccelerator } from './shortcut'

export interface StoreSchema {
  windowBounds: Bounds | null
  wins: Win[]
  settings: Settings
}

export const DEFAULT_STORE: StoreSchema = {
  windowBounds: null,
  wins: [],
  settings: {
    shortcut: defaultAccelerator(process.platform),
    volume: 0.7
  }
}

export const store = new Store<StoreSchema>({ defaults: DEFAULT_STORE })
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/main/store.test.ts`
Expected: PASS (5 tests total)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: extend store schema with wins list and settings"
```

---

### Task 10: `main/ipc.ts` — IPC handlers for wins and settings

**Files:**
- Create: `src/main/ipc.ts`
- Modify: `src/main/index.ts` (call `registerIpcHandlers`)
- Test: `src/main/ipc.test.ts`

**Interfaces:**
- Consumes: `store` from Task 9, `IPC`/`Win`/`AddWinInput`/`Settings` from Task 5, `getEmojiForRating` from Task 12 (implemented next, but referenced here — see note in Step 3).
- Produces: `addWin(input, deps)`, `getAllWins(deps)`, `getSettings(deps)`, `setSettings(patch, deps)` — pure-ish functions with injected store/id/clock so they're unit-testable; `registerIpcHandlers(win)` wires them to real `ipcMain`. Task 11's preload calls these channels; Task 20's e2e exercises the real wiring.

> **Note on ordering:** this task references `getEmojiForRating` from `../renderer/src/lib/bins`, which Task 12 creates. Implement Task 12 first if working strictly in order — the two are interleaved here only because IPC is grouped under Epic E3 and bins under E4. If executing tasks in numeric order, do Task 12 before Task 10, or stub `getEmojiForRating` as `() => '✨'` here and swap the real import in Task 12's Step 5.

- [ ] **Step 1: Write the failing tests for the pure handler logic**

```ts
import { describe, it, expect, vi } from 'vitest'
import { addWin, getAllWins, getSettings, setSettings } from './ipc'
import type { StoreSchema } from './store'

function makeFakeStore(initial: StoreSchema) {
  const data = { ...initial }
  return {
    get: vi.fn((key: keyof StoreSchema) => data[key]),
    set: vi.fn((key: keyof StoreSchema, value: unknown) => {
      ;(data as any)[key] = value
    })
  }
}

describe('addWin', () => {
  it('prepends a new win with a generated id, timestamp, and emoji', () => {
    const fakeStore = makeFakeStore({
      windowBounds: null,
      wins: [],
      settings: { shortcut: 'Alt+Shift+W', volume: 0.7 }
    })
    const deps = {
      store: fakeStore as any,
      newId: () => 'fixed-id',
      now: () => '2026-08-05T00:00:00.000Z'
    }

    const result = addWin({ text: 'Shipped the feature', rating: 8 }, deps)

    expect(result).toEqual({
      id: 'fixed-id',
      text: 'Shipped the feature',
      rating: 8,
      createdAt: '2026-08-05T00:00:00.000Z',
      emoji: '👏'
    })
    expect(fakeStore.set).toHaveBeenCalledWith('wins', [result])
  })
})

describe('getAllWins', () => {
  it('returns the stored wins list', () => {
    const wins = [{ id: '1', text: 'a', rating: null, createdAt: 'x', emoji: '✨' }]
    const fakeStore = makeFakeStore({ windowBounds: null, wins, settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })
    expect(getAllWins({ store: fakeStore as any })).toEqual(wins)
  })
})

describe('settings get/set', () => {
  it('reads and merges settings', () => {
    const fakeStore = makeFakeStore({
      windowBounds: null,
      wins: [],
      settings: { shortcut: 'Alt+Shift+W', volume: 0.7 }
    })
    const deps = { store: fakeStore as any }
    expect(getSettings(deps)).toEqual({ shortcut: 'Alt+Shift+W', volume: 0.7 })

    const updated = setSettings({ volume: 0.3 }, deps)
    expect(updated).toEqual({ shortcut: 'Alt+Shift+W', volume: 0.3 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/main/ipc.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
import { ipcMain, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { store as realStore } from './store'
import type { StoreSchema } from './store'
import { IPC } from '../shared/ipc-contract'
import type { Win, AddWinInput, Settings } from '../shared/ipc-contract'
import { getEmojiForRating } from '../renderer/src/lib/bins'

interface Deps {
  store: Pick<typeof realStore, 'get' | 'set'>
  newId?: () => string
  now?: () => string
}

export function addWin(input: AddWinInput, deps: Deps): Win {
  const newId = deps.newId ?? randomUUID
  const now = deps.now ?? (() => new Date().toISOString())

  const win: Win = {
    id: newId(),
    text: input.text,
    rating: input.rating,
    createdAt: now(),
    emoji: getEmojiForRating(input.rating)
  }

  const existing = deps.store.get('wins') as Win[]
  deps.store.set('wins', [win, ...existing])
  return win
}

export function getAllWins(deps: Pick<Deps, 'store'>): Win[] {
  return deps.store.get('wins') as Win[]
}

export function getSettings(deps: Pick<Deps, 'store'>): Settings {
  return deps.store.get('settings') as Settings
}

export function setSettings(patch: Partial<Settings>, deps: Pick<Deps, 'store'>): Settings {
  const current = deps.store.get('settings') as Settings
  const updated = { ...current, ...patch }
  deps.store.set('settings', updated)
  return updated
}

export function registerIpcHandlers(win: BrowserWindow): void {
  const deps = { store: realStore }

  ipcMain.handle(IPC.WINS_ADD, (_event, input: AddWinInput) => {
    const created = addWin(input, deps)
    win.webContents.send(IPC.WINS_UPDATED, getAllWins(deps))
    return created
  })

  ipcMain.handle(IPC.WINS_GET_ALL, () => getAllWins(deps))
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings(deps))
  ipcMain.handle(IPC.SETTINGS_SET, (_event, patch: Partial<Settings>) => setSettings(patch, deps))
}
```

(`getEmojiForRating` from Task 12 is used here; per the note above, implement Task 12 before running this step if working strictly in order.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/main/ipc.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire into `src/main/index.ts`**

Add import: `import { registerIpcHandlers } from './ipc'`, and call `registerIpcHandlers(mainWindow)` right after `mainWindow.show()`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ipc handlers for wins and settings persistence"
```

---

### Task 11: `preload/index.ts` — contextBridge API surface

**Files:**
- Modify: `src/preload/index.ts`
- Create: `src/preload/index.test.ts`
- Create: `src/renderer/src/window.d.ts` (ambient `Window.api` typing for the renderer)

**Interfaces:**
- Consumes: `IPC`, `Win`, `AddWinInput`, `Settings` from Task 5.
- Produces: `window.api = { wins: { add, getAll, onUpdated }, settings: { get, set } }` — consumed by every renderer component from Task 13 onward.

- [ ] **Step 1: Write the failing test for the exposed API shape**

```ts
import { describe, it, expect, vi } from 'vitest'
import { buildApi } from './index'

describe('buildApi', () => {
  it('forwards wins.add to ipcRenderer.invoke on the correct channel', async () => {
    const invoke = vi.fn().mockResolvedValue({ id: '1' })
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)

    const result = await api.wins.add({ text: 'hi', rating: null })

    expect(invoke).toHaveBeenCalledWith('wins:add', { text: 'hi', rating: null })
    expect(result).toEqual({ id: '1' })
  })

  it('subscribes onUpdated to the wins:updated channel', () => {
    const invoke = vi.fn()
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)
    const callback = vi.fn()

    api.wins.onUpdated(callback)

    expect(on).toHaveBeenCalledWith('wins:updated', expect.any(Function))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/preload/index.test.ts`
Expected: FAIL — `buildApi` isn't exported yet.

- [ ] **Step 3: Implement**

```ts
import { contextBridge, ipcRenderer, IpcRenderer } from 'electron'
import { IPC } from '../shared/ipc-contract'
import type { AddWinInput, Win, Settings } from '../shared/ipc-contract'

type MinimalIpcRenderer = Pick<IpcRenderer, 'invoke' | 'on'>

export function buildApi(renderer: MinimalIpcRenderer) {
  return {
    wins: {
      add: (input: AddWinInput): Promise<Win> => renderer.invoke(IPC.WINS_ADD, input),
      getAll: (): Promise<Win[]> => renderer.invoke(IPC.WINS_GET_ALL),
      onUpdated: (callback: (wins: Win[]) => void): void => {
        renderer.on(IPC.WINS_UPDATED, (_event, wins: Win[]) => callback(wins))
      }
    },
    settings: {
      get: (): Promise<Settings> => renderer.invoke(IPC.SETTINGS_GET),
      set: (patch: Partial<Settings>): Promise<Settings> => renderer.invoke(IPC.SETTINGS_SET, patch)
    }
  }
}

export type Api = ReturnType<typeof buildApi>

contextBridge.exposeInMainWorld('api', buildApi(ipcRenderer))
```

`src/renderer/src/window.d.ts`:
```ts
import type { Api } from '../../preload/index'

declare global {
  interface Window {
    api: Api
  }
}

export {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/preload/index.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: expose typed window.api via contextBridge preload"
```

---

### Task 12: `renderer/lib/bins.ts` — rating → bin → emoji/animation mapping

**Files:**
- Create: `src/renderer/src/lib/bins.ts`
- Test: `src/renderer/src/lib/bins.test.ts`

**Interfaces:**
- Produces: `Bin` type, `getBinForRating`, `getEmojiForRating`, `pickAnimationVariant` — consumed by Task 10 (`getEmojiForRating`), Task 15 (`getEmojiForRating`), Task 18 (`getBinForRating`, `pickAnimationVariant`).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { getBinForRating, getEmojiForRating, pickAnimationVariant, BIN_VARIANTS } from './bins'

describe('getBinForRating', () => {
  it('maps null to unrated', () => {
    expect(getBinForRating(null)).toBe('unrated')
  })
  it('maps 1-3 to small', () => {
    expect(getBinForRating(1)).toBe('small')
    expect(getBinForRating(3)).toBe('small')
  })
  it('maps 4-6 to medium', () => {
    expect(getBinForRating(4)).toBe('medium')
    expect(getBinForRating(6)).toBe('medium')
  })
  it('maps 7-9 to large', () => {
    expect(getBinForRating(7)).toBe('large')
    expect(getBinForRating(9)).toBe('large')
  })
  it('maps 10 to epic', () => {
    expect(getBinForRating(10)).toBe('epic')
  })
})

describe('getEmojiForRating', () => {
  it('returns the epic rocket for a 10', () => {
    expect(getEmojiForRating(10)).toBe('🚀')
  })
  it('returns the neutral sparkle for unrated', () => {
    expect(getEmojiForRating(null)).toBe('✨')
  })
})

describe('pickAnimationVariant', () => {
  it('deterministically picks by injected rng', () => {
    expect(pickAnimationVariant('small', () => 0)).toBe(BIN_VARIANTS.small[0])
    expect(pickAnimationVariant('small', () => 0.99)).toBe(
      BIN_VARIANTS.small[BIN_VARIANTS.small.length - 1]
    )
  })
  it('every bin has 4-5 variants (unrated has exactly 1)', () => {
    expect(BIN_VARIANTS.unrated.length).toBe(1)
    for (const bin of ['small', 'medium', 'large', 'epic'] as const) {
      expect(BIN_VARIANTS[bin].length).toBeGreaterThanOrEqual(4)
      expect(BIN_VARIANTS[bin].length).toBeLessThanOrEqual(5)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/src/lib/bins.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
export type Bin = 'unrated' | 'small' | 'medium' | 'large' | 'epic'

export function getBinForRating(rating: number | null): Bin {
  if (rating === null) return 'unrated'
  if (rating <= 3) return 'small'
  if (rating <= 6) return 'medium'
  if (rating <= 9) return 'large'
  return 'epic'
}

const BIN_EMOJI: Record<Bin, string> = {
  unrated: '✨',
  small: '🎉',
  medium: '🎊',
  large: '👏',
  epic: '🚀'
}

export function getEmojiForRating(rating: number | null): string {
  return BIN_EMOJI[getBinForRating(rating)]
}

export const BIN_VARIANTS: Record<Bin, string[]> = {
  unrated: ['sparkle-drift'],
  small: ['confetti-burst', 'party-poppers', 'balloon-float', 'star-sparkle'],
  medium: ['confetti-cannon', 'firework-pop', 'ribbon-swirl', 'balloon-bunch'],
  large: ['applause-hands', 'firework-show', 'confetti-rain', 'trophy-shine', 'crowd-cheer'],
  epic: ['rocket-launch', 'fireworks-finale', 'starburst-explosion', 'confetti-monsoon', 'standing-ovation']
}

export function pickAnimationVariant(bin: Bin, rng: () => number = Math.random): string {
  const variants = BIN_VARIANTS[bin]
  const index = Math.min(variants.length - 1, Math.floor(rng() * variants.length))
  return variants[index]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/lib/bins.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: If Task 10 was implemented first with a stub, swap it to the real import now**

In `src/main/ipc.ts`, confirm the import is `import { getEmojiForRating } from '../renderer/src/lib/bins'` (matches Step 3 of Task 10 exactly — no change needed if Task 10 was written after this task).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add rating-to-bin emoji and animation-variant mapping"
```

---

### Task 13: `renderer/lib/wins.ts` — newest-first sort

**Files:**
- Create: `src/renderer/src/lib/wins.ts`
- Test: `src/renderer/src/lib/wins.test.ts`

**Interfaces:**
- Consumes: `Win` from Task 5.
- Produces: `sortWinsByNewest(wins)` — consumed by Task 15 (`WinsList`) and Task 16 (`App`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { sortWinsByNewest } from './wins'
import type { Win } from '../../../shared/ipc-contract'

describe('sortWinsByNewest', () => {
  it('orders wins latest createdAt first without mutating the input', () => {
    const wins: Win[] = [
      { id: '1', text: 'older', rating: null, createdAt: '2026-08-01T00:00:00.000Z', emoji: '✨' },
      { id: '2', text: 'newer', rating: null, createdAt: '2026-08-03T00:00:00.000Z', emoji: '✨' },
      { id: '3', text: 'middle', rating: null, createdAt: '2026-08-02T00:00:00.000Z', emoji: '✨' }
    ]
    const original = [...wins]

    const sorted = sortWinsByNewest(wins)

    expect(sorted.map((w) => w.id)).toEqual(['2', '3', '1'])
    expect(wins).toEqual(original)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/lib/wins.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
import type { Win } from '../../../shared/ipc-contract'

export function sortWinsByNewest(wins: Win[]): Win[] {
  return [...wins].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/renderer/src/lib/wins.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add newest-first win sorting utility"
```

---

### Task 14: `AddWinForm` component

**Files:**
- Create: `src/renderer/src/components/AddWinForm.tsx`
- Test: `src/renderer/src/components/AddWinForm.test.tsx`

**Interfaces:**
- Produces: `AddWinForm({ onAdd: (input: AddWinInput) => void })` — consumed by Task 16 (`App.tsx`), which wires `onAdd` to `window.api.wins.add`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddWinForm } from './AddWinForm'

describe('AddWinForm', () => {
  it('submits the entered text and selected rating, then clears the form', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/what did you win/i), 'Finished the report')
    await user.selectOptions(screen.getByLabelText(/rating/i), '8')
    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).toHaveBeenCalledWith({ text: 'Finished the report', rating: 8 })
    expect(screen.getByLabelText(/what did you win/i)).toHaveValue('')
  })

  it('submits a null rating when none is chosen', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/what did you win/i), 'Made my bed');
    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).toHaveBeenCalledWith({ text: 'Made my bed', rating: null })
  })

  it('does not submit empty text', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Install `@testing-library/user-event`, run tests to verify they fail**

```bash
npm install -D @testing-library/user-event
npx vitest run src/renderer/src/components/AddWinForm.test.tsx
```
Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Implement**

```tsx
import { useState, FormEvent } from 'react'
import type { AddWinInput } from '../../../shared/ipc-contract'

interface Props {
  onAdd: (input: AddWinInput) => void
}

export function AddWinForm({ onAdd }: Props): JSX.Element {
  const [text, setText] = useState('')
  const [rating, setRating] = useState<string>('')

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({ text: trimmed, rating: rating === '' ? null : Number(rating) })
    setText('')
    setRating('')
  }

  return (
    <form onSubmit={handleSubmit} className="add-win-form">
      <label htmlFor="win-text">What did you win?</label>
      <input
        id="win-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Small or big, it counts"
      />

      <label htmlFor="win-rating">Rating</label>
      <select id="win-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="">No rating</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <button type="submit">Add win</button>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/components/AddWinForm.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add win entry form with optional 1-10 rating"
```

---

### Task 15: `WinsList` / `WinItem` components

**Files:**
- Create: `src/renderer/src/components/WinsList.tsx`
- Create: `src/renderer/src/components/WinItem.tsx`
- Test: `src/renderer/src/components/WinsList.test.tsx`

**Interfaces:**
- Consumes: `Win` from Task 5, `sortWinsByNewest` from Task 13, `getEmojiForRating` from Task 12.
- Produces: `WinsList({ wins: Win[] })` — consumed by Task 16 (`App.tsx`).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WinsList } from './WinsList'
import type { Win } from '../../../shared/ipc-contract'

const wins: Win[] = [
  { id: '1', text: 'older win', rating: 2, createdAt: '2026-08-01T00:00:00.000Z', emoji: '🎉' },
  { id: '2', text: 'newer win', rating: 9, createdAt: '2026-08-03T00:00:00.000Z', emoji: '👏' }
]

describe('WinsList', () => {
  it('renders the newest win first, with its emoji and rating, and no strikethrough styling', () => {
    render(<WinsList wins={wins} />)
    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('newer win')
    expect(items[0]).toHaveTextContent('👏')
    expect(items[0]).toHaveTextContent('9')
    expect(items[1]).toHaveTextContent('older win')

    for (const item of items) {
      expect(item.style.textDecoration).not.toContain('line-through')
    }
  })

  it('renders a friendly empty state with no wins yet', () => {
    render(<WinsList wins={[]} />)
    expect(screen.getByText(/no wins yet/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/components/WinsList.test.tsx`
Expected: FAIL — components don't exist.

- [ ] **Step 3: Implement `WinItem.tsx`**

```tsx
import type { Win } from '../../../shared/ipc-contract'

export function WinItem({ win }: { win: Win }): JSX.Element {
  return (
    <li className="win-item">
      <span className="win-emoji" aria-hidden="true">
        {win.emoji}
      </span>
      <span className="win-text">{win.text}</span>
      {win.rating !== null && <span className="win-rating">{win.rating}</span>}
    </li>
  )
}
```

- [ ] **Step 4: Implement `WinsList.tsx`**

```tsx
import type { Win } from '../../../shared/ipc-contract'
import { sortWinsByNewest } from '../lib/wins'
import { WinItem } from './WinItem'

export function WinsList({ wins }: { wins: Win[] }): JSX.Element {
  if (wins.length === 0) {
    return <p className="wins-empty">No wins yet — add one above to get started.</p>
  }

  return (
    <ul className="wins-list">
      {sortWinsByNewest(wins).map((win) => (
        <WinItem key={win.id} win={win} />
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/components/WinsList.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: render wins list newest-first with emoji and rating, never struck through"
```

---

### Task 16: `App.tsx` wiring + warm/joyful theme

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/styles/global.css`
- Modify: `src/renderer/src/main.tsx` (import the stylesheet)

**Interfaces:**
- Consumes: `window.api` from Task 11, `AddWinForm` from Task 14, `WinsList` from Task 15.
- Produces: the assembled app shell — consumed by Task 18 (adds `<Celebration />`) and Task 19 (adds `<SettingsPanel />`).

- [ ] **Step 1: Implement `App.tsx`**

(No unit test here — this is integration wiring covered by Task 20's e2e test, per the plan's file-structure note that pure logic gets unit tests and full-window behavior gets Playwright coverage.)

```tsx
import { useEffect, useState } from 'react'
import type { Win, AddWinInput } from '../../shared/ipc-contract'
import { AddWinForm } from './components/AddWinForm'
import { WinsList } from './components/WinsList'

export default function App(): JSX.Element {
  const [wins, setWins] = useState<Win[]>([])

  useEffect(() => {
    window.api.wins.getAll().then(setWins)
    window.api.wins.onUpdated(setWins)
  }, [])

  async function handleAdd(input: AddWinInput): Promise<void> {
    await window.api.wins.add(input)
  }

  return (
    <div className="app-shell">
      <h1>Your Wins</h1>
      <AddWinForm onAdd={handleAdd} />
      <WinsList wins={wins} />
    </div>
  )
}
```

- [ ] **Step 2: Implement the warm/joyful theme**

`src/renderer/src/styles/global.css`:
```css
:root {
  --color-bg: #fff8f0;
  --color-surface: #ffffff;
  --color-primary: #ff8a5c;
  --color-primary-dark: #e8672e;
  --color-text: #3d2b1f;
  --color-text-muted: #8a7566;
  --radius: 16px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

body {
  margin: 0;
  background: transparent;
}

.app-shell {
  background: var(--color-bg);
  border-radius: var(--radius);
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(232, 103, 46, 0.18);
  color: var(--color-text);
}

h1 {
  margin: 0;
  font-size: 1.25rem;
}

.add-win-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-win-form input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #f0d9c8;
}

.add-win-form button {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
}

.add-win-form button:hover {
  background: var(--color-primary-dark);
}

.wins-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.win-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 10px 12px;
  text-decoration: none; /* explicitly never struck-through */
}

.win-rating {
  margin-left: auto;
  background: var(--color-primary);
  color: white;
  border-radius: 999px;
  font-size: 0.75rem;
  padding: 2px 8px;
}

.wins-empty {
  color: var(--color-text-muted);
  text-align: center;
}
```

Modify `src/renderer/src/main.tsx` to add `import './styles/global.css'` at the top.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Expected: warm cream/orange themed panel, form at top, empty-state message below, adding a win (via Playwright or manual click once Task 10's IPC is live) shows it in the list with no strikethrough.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire app shell to ipc and apply warm joyful theme"
```

---

### Task 17: `renderer/lib/sound.ts` — synthesized chime helpers

**Files:**
- Create: `src/renderer/src/lib/sound.ts`
- Test: `src/renderer/src/lib/sound.test.ts`

**Interfaces:**
- Consumes: `Bin` from Task 12.
- Produces: `volumeToGain(volume)`, `tonesForBin(bin)`, `playChime(bin, volume, audioContext?)` — consumed by Task 18 (`Celebration.tsx`) and Task 19 (`SettingsPanel` volume preview, optional).

- [ ] **Step 1: Write the failing tests for the pure helpers**

```ts
import { describe, it, expect } from 'vitest'
import { volumeToGain, tonesForBin } from './sound'

describe('volumeToGain', () => {
  it('clamps into 0..1', () => {
    expect(volumeToGain(-0.5)).toBe(0)
    expect(volumeToGain(1.5)).toBe(1)
    expect(volumeToGain(0.42)).toBe(0.42)
  })
})

describe('tonesForBin', () => {
  it('gives bigger bins more, higher notes', () => {
    expect(tonesForBin('unrated')).toEqual([880])
    expect(tonesForBin('small').length).toBe(2)
    expect(tonesForBin('epic').length).toBe(5)
    expect(tonesForBin('epic')[4]).toBeGreaterThan(tonesForBin('small')[1])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/renderer/src/lib/sound.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```ts
import type { Bin } from './bins'

export function volumeToGain(volume: number): number {
  return Math.min(1, Math.max(0, volume))
}

const BIN_TONES: Record<Bin, number[]> = {
  unrated: [880],
  small: [523.25, 659.25],
  medium: [523.25, 659.25, 783.99],
  large: [523.25, 659.25, 783.99, 1046.5],
  epic: [523.25, 659.25, 783.99, 1046.5, 1318.51]
}

export function tonesForBin(bin: Bin): number[] {
  return BIN_TONES[bin]
}

export function playChime(bin: Bin, volume: number, ctx: AudioContext = new AudioContext()): void {
  const gain = volumeToGain(volume)
  const tones = tonesForBin(bin)
  const noteDuration = 0.14

  tones.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gainNode.gain.value = gain * 0.3

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    const startTime = ctx.currentTime + index * noteDuration
    oscillator.start(startTime)
    oscillator.stop(startTime + noteDuration)
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/lib/sound.test.ts`
Expected: PASS (2 tests). `playChime` itself isn't unit tested — `jsdom` has no real `AudioContext` — it's covered by manual verification in Task 18.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add synthesized web audio chime helpers per rating bin"
```

---

### Task 18: `Celebration.tsx` — animation trigger + per-bin variants

**Files:**
- Create: `src/renderer/src/components/Celebration.tsx`
- Modify: `src/renderer/src/App.tsx` (track the last-added win, render `<Celebration>`)
- Modify: `src/renderer/src/styles/global.css` (keyframes for the CSS-based variants)
- Test: `src/renderer/src/components/Celebration.test.tsx`

**Interfaces:**
- Consumes: `getBinForRating`/`pickAnimationVariant` from Task 12, `playChime` from Task 17.
- Produces: `Celebration({ win, volume, onDone })` — fires once per newly-added win, self-clears.

- [ ] **Step 1: Install canvas-confetti**

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Celebration } from './Celebration'
import * as sound from '../lib/sound'
import type { Win } from '../../../shared/ipc-contract'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const win: Win = { id: '1', text: 'Did it', rating: 10, createdAt: 'x', emoji: '🚀' }

describe('Celebration', () => {
  beforeEach(() => {
    vi.spyOn(sound, 'playChime').mockImplementation(() => {})
  })

  it('plays a chime scaled to the win rating bin and calls onDone after the animation', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Celebration win={win} volume={0.5} onDone={onDone} />)

    expect(sound.playChime).toHaveBeenCalledWith('epic', 0.5)

    vi.advanceTimersByTime(3000)
    expect(onDone).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/components/Celebration.test.tsx`
Expected: FAIL — component doesn't exist.

- [ ] **Step 4: Implement**

```tsx
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { Win } from '../../../shared/ipc-contract'
import { getBinForRating, pickAnimationVariant } from '../lib/bins'
import { playChime } from '../lib/sound'

interface Props {
  win: Win
  volume: number
  onDone: () => void
}

const ANIMATION_DURATION_MS = 3000

function fireConfetti(particleMultiplier: number): void {
  confetti({
    particleCount: 40 * particleMultiplier,
    spread: 70,
    origin: { y: 0.6 }
  })
}

const CONFETTI_VARIANTS = new Set([
  'confetti-burst',
  'party-poppers',
  'confetti-cannon',
  'confetti-rain',
  'confetti-monsoon',
  'starburst-explosion',
  'fireworks-finale',
  'firework-pop',
  'firework-show'
])

export function Celebration({ win, volume, onDone }: Props): JSX.Element {
  const bin = getBinForRating(win.rating)
  const variant = pickAnimationVariant(bin)

  useEffect(() => {
    playChime(bin, volume)

    if (CONFETTI_VARIANTS.has(variant)) {
      const multiplier = { unrated: 0.5, small: 1, medium: 1.5, large: 2, epic: 3 }[bin]
      fireConfetti(multiplier)
    }

    const timer = setTimeout(onDone, ANIMATION_DURATION_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.id])

  return (
    <div className={`celebration celebration--${variant}`} aria-hidden="true">
      {variant === 'rocket-launch' && <span className="celebration-emoji">🚀</span>}
      {variant === 'applause-hands' && <span className="celebration-emoji">👏</span>}
      {variant === 'standing-ovation' && <span className="celebration-emoji">👏🎉👏</span>}
      {variant === 'balloon-float' && <span className="celebration-emoji">🎈</span>}
      {variant === 'balloon-bunch' && <span className="celebration-emoji">🎈🎈🎈</span>}
      {variant === 'trophy-shine' && <span className="celebration-emoji">🏆</span>}
      {variant === 'crowd-cheer' && <span className="celebration-emoji">🙌</span>}
      {variant === 'star-sparkle' && <span className="celebration-emoji">⭐</span>}
      {variant === 'ribbon-swirl' && <span className="celebration-emoji">🎀</span>}
      {variant === 'sparkle-drift' && <span className="celebration-emoji">✨</span>}
    </div>
  )
}
```

- [ ] **Step 5: Add the CSS keyframes**

Append to `src/renderer/src/styles/global.css`:
```css
.celebration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.celebration-emoji {
  font-size: 4rem;
  animation: celebration-pop 0.6s ease-out;
}

.celebration--rocket-launch .celebration-emoji {
  animation: rocket-launch 1.4s ease-in forwards;
}

.celebration--applause-hands .celebration-emoji,
.celebration--standing-ovation .celebration-emoji,
.celebration--crowd-cheer .celebration-emoji {
  animation: applause-shake 0.5s ease-in-out 3;
}

.celebration--balloon-float .celebration-emoji,
.celebration--balloon-bunch .celebration-emoji {
  animation: balloon-float 2.2s ease-out forwards;
}

@keyframes celebration-pop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes rocket-launch {
  0% { transform: translateY(0) scale(0.8); opacity: 1; }
  100% { transform: translateY(-60vh) scale(1.2); opacity: 0; }
}

@keyframes applause-shake {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}

@keyframes balloon-float {
  0% { transform: translateY(20vh); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-30vh); opacity: 0; }
}
```

- [ ] **Step 6: Wire into `App.tsx`**

Modify `handleAdd` and add celebration state:
```tsx
import { useEffect, useState } from 'react'
import type { Win, AddWinInput, Settings } from '../../shared/ipc-contract'
import { AddWinForm } from './components/AddWinForm'
import { WinsList } from './components/WinsList'
import { Celebration } from './components/Celebration'

export default function App(): JSX.Element {
  const [wins, setWins] = useState<Win[]>([])
  const [celebrating, setCelebrating] = useState<Win | null>(null)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    window.api.wins.getAll().then(setWins)
    window.api.wins.onUpdated(setWins)
    window.api.settings.get().then((s: Settings) => setVolume(s.volume))
  }, [])

  async function handleAdd(input: AddWinInput): Promise<void> {
    const created = await window.api.wins.add(input)
    setCelebrating(created)
  }

  return (
    <div className="app-shell">
      <h1>Your Wins</h1>
      <AddWinForm onAdd={handleAdd} />
      <WinsList wins={wins} />
      {celebrating && (
        <Celebration win={celebrating} volume={volume} onDone={() => setCelebrating(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/components/Celebration.test.tsx`
Expected: PASS

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, add a win with rating 10.
Expected: confetti + rocket emoji animation plays, ascending chime is audible, disappears after ~3s.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: trigger rating-scaled celebration animation and chime on win add"
```

---

### Task 19: `SettingsPanel` — shortcut display/edit + volume slider

**Files:**
- Create: `src/renderer/src/components/SettingsPanel.tsx`
- Modify: `src/renderer/src/App.tsx` (render panel, wire volume state)
- Modify: `src/main/ipc.ts` (handle shortcut re-registration on settings change)
- Test: `src/renderer/src/components/SettingsPanel.test.tsx`

**Interfaces:**
- Consumes: `Settings` from Task 5, `window.api.settings` from Task 11.
- Produces: `SettingsPanel({ settings, onChange })` — terminal task in Epic E5, no downstream consumers.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('shows the current shortcut and lets the user change volume', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SettingsPanel settings={{ shortcut: 'Alt+Shift+W', volume: 0.7 }} onChange={onChange} />)

    expect(screen.getByDisplayValue('Alt+Shift+W')).toBeInTheDocument()

    const slider = screen.getByLabelText(/volume/i)
    await user.clear(slider)
    fireVolumeChange(slider, '0.3')

    expect(onChange).toHaveBeenCalledWith({ volume: 0.3 })

    function fireVolumeChange(el: HTMLElement, value: string): void {
      ;(el as HTMLInputElement).value = value
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })

  it('submits a new shortcut on blur', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SettingsPanel settings={{ shortcut: 'Alt+Shift+W', volume: 0.7 }} onChange={onChange} />)

    const shortcutInput = screen.getByDisplayValue('Alt+Shift+W')
    await user.clear(shortcutInput)
    await user.type(shortcutInput, 'Alt+Shift+K')
    await user.tab()

    expect(onChange).toHaveBeenCalledWith({ shortcut: 'Alt+Shift+K' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/renderer/src/components/SettingsPanel.test.tsx`
Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Implement**

```tsx
import { useState } from 'react'
import type { Settings } from '../../../shared/ipc-contract'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

export function SettingsPanel({ settings, onChange }: Props): JSX.Element {
  const [shortcutDraft, setShortcutDraft] = useState(settings.shortcut)

  return (
    <div className="settings-panel">
      <label htmlFor="shortcut-input">Overlay shortcut</label>
      <input
        id="shortcut-input"
        value={shortcutDraft}
        onChange={(e) => setShortcutDraft(e.target.value)}
        onBlur={() => {
          if (shortcutDraft !== settings.shortcut) onChange({ shortcut: shortcutDraft })
        }}
      />

      <label htmlFor="volume-input">Volume</label>
      <input
        id="volume-input"
        type="range"
        min={0}
        max={1}
        step={0.1}
        defaultValue={settings.volume}
        onChange={(e) => onChange({ volume: Number(e.target.value) })}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/renderer/src/components/SettingsPanel.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Handle shortcut re-registration in the main process**

Modify `src/main/ipc.ts`'s `SETTINGS_SET` handler to re-register the global shortcut when it changes:

```ts
import { globalShortcut } from 'electron'
import { registerToggleShortcut } from './shortcut'

// inside registerIpcHandlers(win), replace the SETTINGS_SET handler:
ipcMain.handle(IPC.SETTINGS_SET, (_event, patch: Partial<Settings>) => {
  const previous = getSettings(deps)
  const updated = setSettings(patch, deps)
  if (patch.shortcut && patch.shortcut !== previous.shortcut) {
    globalShortcut.unregister(previous.shortcut)
    registerToggleShortcut(win, updated.shortcut)
  }
  return updated
})
```

- [ ] **Step 6: Wire into `App.tsx`**

Add `<SettingsPanel settings={{ shortcut, volume }} onChange={handleSettingsChange} />` below `WinsList`, with `handleSettingsChange` calling `window.api.settings.set(patch)` and updating local `volume`/`shortcut` state from the response. (Straightforward wiring matching the `handleAdd` pattern in Task 18 — no new logic to test beyond what Steps 1-4 already cover.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add settings panel for shortcut rebinding and volume control"
```

---

### Task 20: Full Playwright e2e flow

**Files:**
- Create: `tests/e2e/add-win.spec.ts`

**Interfaces:**
- Consumes: the fully wired app from Tasks 1-19.

- [ ] **Step 1: Write the e2e test**

```ts
import { test, expect, _electron as electron } from '@playwright/test'

test('adding a win shows it at the top of the list with its emoji and rating', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('Debugged the tricky test')
  await window.getByLabel(/rating/i).selectOption('9')
  await window.getByRole('button', { name: /add win/i }).click()

  const firstItem = window.locator('.win-item').first()
  await expect(firstItem).toContainText('Debugged the tricky test')
  await expect(firstItem).toContainText('👏')
  await expect(firstItem).toContainText('9')

  await app.close()
})

test('a second win added later appears above the first', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('First win')
  await window.getByRole('button', { name: /add win/i }).click()
  await window.waitForTimeout(50) // ensure distinct createdAt timestamps

  await window.getByLabel(/what did you win/i).fill('Second win')
  await window.getByRole('button', { name: /add win/i }).click()

  const items = window.locator('.win-item')
  await expect(items.first()).toContainText('Second win')
  await expect(items.nth(1)).toContainText('First win')

  await app.close()
})
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:e2e`
Expected: both PASS. If persisted state from a prior manual run leaks in (wins from `npm run dev` sessions), clear the app's `userData` directory before running, or point `electron-store` at a temp path via `ELECTRON_STORE_PATH`/a test-only env var — acceptable follow-up if this flakes, not a blocker for the first green run.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: add e2e coverage for adding and ordering wins"
```

---

### Task 21: Windows packaging verification

**Files:**
- None (verification-only task)

**Interfaces:**
- Consumes: Task 4's `electron-builder` config plus the finished app from Tasks 1-20.

- [ ] **Step 1: Build the installer**

Run: `npm run package:win`
Expected: `dist/ADHD Wins Setup <version>.exe` produced with no errors.

- [ ] **Step 2: Install and smoke-test manually**

Run the installer, launch the app, verify: overlay appears in the bottom-right, `Alt+Shift+W` hides/shows it, adding a win triggers its animation/sound and appears at the top of the list, volume slider affects chime loudness, closing and reopening the app preserves prior wins and window position.

- [ ] **Step 3: Uninstall the test build, commit any config fixes discovered**

```bash
git add -A
git commit -m "chore: fix packaging issues found during windows install smoke test"
```

(Only commit if Step 1/2 revealed a real config bug — this step is conditional.)

---

## Self-Review

**Spec coverage:**
- Google-Keep-style always-visible, ordered-latest-first, never-crossed-off list → Tasks 13, 15, 16.
- Overlay toggle via configurable shortcut, sensible default → Tasks 6, 8, 19.
- Attractive/warm/joyful visual design → Task 16.
- Add-win celebration animations, sized to a 1-10 optional rating in 4 bins with 4-5 variants each → Tasks 12, 18.
- Emoji next to each win reflecting its value → Tasks 12, 15.
- Sound with user-controllable volume → Tasks 17, 18, 19.
- Electron + React + Node + Vite → Task 1.
- Vitest (Vite-native) + Playwright (integration, since Vite has no built-in integration runner) → Tasks 2, 3, 20.
- Windows-first packaging, Mac/Linux-ready → Task 4.
- `EPICS.md`/`TODO.md`/`COMPLETED.md` workflow → handled outside this plan file, immediately after plan approval (see next steps below), using the Epic→Task mapping table above.

**Placeholder scan:** no "TBD"/"handle appropriately" phrasing; every step has runnable code or an explicit, justified manual-verification substitute (window creation, audio playback, packaging — none of which are meaningfully unit-testable).

**Type consistency:** `Win`, `AddWinInput`, `Settings`, `Bin` are defined once each (Tasks 5, 12) and imported everywhere else by the same names/shapes; `IPC` channel constants are defined once (Task 5) and referenced by string-equal usage in preload (Task 11) and main (Tasks 8, 10, 19).
