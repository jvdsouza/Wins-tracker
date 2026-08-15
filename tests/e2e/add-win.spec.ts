import { test, expect, _electron as electron } from '@playwright/test'

test('adding a win shows it at the top of the list with its emoji and rating', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('Debugged the tricky test')
  await window.getByLabel(/rating/i).selectOption('9')
  await window.getByRole('button', { name: /add win/i }).click()

  const firstItem = window.locator('.win-item').first()
  await expect(firstItem).toContainText('Debugged the tricky test')
  await expect(firstItem).toContainText('👏')
  await expect(firstItem).toContainText('9')

  await app.close()
})

test('a second win added later appears above the first', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('First win')
  await window.getByRole('button', { name: /add win/i }).click()
  await window.waitForTimeout(50) // ensure distinct createdAt timestamps

  await window.getByLabel(/what did you win/i).fill('Second win')
  await window.getByRole('button', { name: /add win/i }).click()

  const items = window.locator('.win-item')
  await expect(items.first()).toContainText('Second win')
  await expect(items.nth(1)).toContainText('First win')

  await app.close()
})
