import { test, expect, _electron as electron } from '@playwright/test'

test('app launches and shows the main window', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()
  await expect(window.locator('text=Your Wins')).toBeVisible()
  await app.close()
})
