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
// since simulating a real OS-level hotkey isn't feasible in CI. It's also
// attached to globalThis because evaluate() runs pageFunction in a scope
// that has no access to this module's require/exports (there's no `require`
// there — see tests/e2e/overlay.spec.ts), only shared globals.
export function __testToggleWindow(): void {
  toggleWindow(mainWindow)
}
;(globalThis as unknown as { __testToggleWindow: () => void }).__testToggleWindow = __testToggleWindow
