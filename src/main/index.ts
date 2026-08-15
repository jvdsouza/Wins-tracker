import { app } from 'electron'
import { createOverlayWindow } from './window'

app.whenReady().then(() => {
  const win = createOverlayWindow()
  win.show()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
