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
