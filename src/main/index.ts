import { app, globalShortcut } from 'electron'
import { createOverlayWindow } from './window'
import { store } from './store'
import { defaultAccelerator, registerToggleShortcut, toggleWindow } from './shortcut'
import { registerIpcHandlers } from './ipc'
import { createTray } from './tray'

let mainWindow: ReturnType<typeof createOverlayWindow>
let tray: ReturnType<typeof createTray>

app.whenReady().then(() => {
  // Register with the OS to launch at login. Guarded by isPackaged: in dev
  // (`electron-vite dev`, or Playwright launching `out/main/index.js`
  // directly) process.execPath points at the bare Electron binary, not a
  // real installed app, so registering it would create a broken/misleading
  // login item. electron-builder's packaged app has a stable exe path, so
  // this only takes effect for real installs.
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath })
  }

  mainWindow = createOverlayWindow(store.get('windowBounds') ?? undefined)
  mainWindow.show()
  registerIpcHandlers(mainWindow)
  tray = createTray(mainWindow)

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
// since simulating a real OS-level hotkey isn't feasible in CI. It's also
// attached to globalThis because evaluate() runs pageFunction in a scope
// that has no access to this module's require/exports (there's no `require`
// there — see tests/e2e/overlay.spec.ts), only shared globals.
export function __testToggleWindow(): void {
  toggleWindow(mainWindow)
}
;(globalThis as unknown as { __testToggleWindow: () => void }).__testToggleWindow = __testToggleWindow

// Test-only hook, same rationale as __testToggleWindow above: Playwright's
// evaluate() can't easily assert an OS tray icon is present, so it checks
// this instead.
export function __testTrayExists(): boolean {
  return tray !== undefined && !tray.isDestroyed()
}
;(globalThis as unknown as { __testTrayExists: () => boolean }).__testTrayExists = __testTrayExists
