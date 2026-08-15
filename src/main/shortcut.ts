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
