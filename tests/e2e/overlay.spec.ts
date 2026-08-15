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
