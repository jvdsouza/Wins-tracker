import { app, Tray, Menu, nativeImage, MenuItemConstructorOptions, BrowserWindow } from 'electron'
import { toggleWindow } from './shortcut'

// Solid warm-orange (matches --color-primary) 32x32 placeholder — good enough
// to read clearly in the notification area; swap for a designed icon later.
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NQQkAAAgEsAtqIktrCh/CYP9luk5FIBAIBAKBQCAQfAkWiYqUapTVBWwAAAAASUVORK5CYII='

export function buildTrayMenuTemplate(win: BrowserWindow): MenuItemConstructorOptions[] {
  return [
    { label: 'Show/Hide', click: () => toggleWindow(win) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]
}

export function createTray(win: BrowserWindow): Tray {
  const tray = new Tray(nativeImage.createFromDataURL(TRAY_ICON_DATA_URL))
  tray.setToolTip('ADHD Wins')
  tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenuTemplate(win)))
  return tray
}
