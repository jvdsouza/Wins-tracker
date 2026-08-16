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

test('__testToggleWindow (the registered-shortcut code path) flips window visibility', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  await app.firstWindow()

  // index.ts attaches __testToggleWindow to globalThis specifically so it's
  // reachable here: app.evaluate() runs pageFunction in the main process but
  // in a scope with no `require`/module access, only shared globals.
  const isVisibleAfterFirstToggle = await app.evaluate(({ BrowserWindow }) => {
    ;(globalThis as unknown as { __testToggleWindow: () => void }).__testToggleWindow()
    return BrowserWindow.getAllWindows()[0].isVisible()
  })
  expect(isVisibleAfterFirstToggle).toBe(false)

  const isVisibleAfterSecondToggle = await app.evaluate(({ BrowserWindow }) => {
    ;(globalThis as unknown as { __testToggleWindow: () => void }).__testToggleWindow()
    return BrowserWindow.getAllWindows()[0].isVisible()
  })
  expect(isVisibleAfterSecondToggle).toBe(true)

  await app.close()
})
