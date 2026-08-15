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
