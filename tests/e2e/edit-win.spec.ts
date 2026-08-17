import { test, expect, _electron as electron } from '@playwright/test'

test('updating a win\'s rating to a different value replays the celebration', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('Refactored the module')
  await window.getByLabel(/rating/i).selectOption('3')
  await window.getByRole('button', { name: /add win/i }).click()
  await expect(window.locator('.celebration')).toBeVisible()
  await expect(window.locator('.celebration')).toHaveCount(0, { timeout: 5000 })

  await window.locator('.win-rating').first().click()
  await window.locator('.win-rating-select').selectOption('10')

  await expect(window.locator('.celebration')).toBeVisible()
  await expect(window.locator('.win-item').first()).toContainText('10')

  await app.close()
})

test('editing a win\'s text saves the new text without replaying the celebration', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  await window.getByLabel(/what did you win/i).fill('Original text')
  await window.getByRole('button', { name: /add win/i }).click()
  await expect(window.locator('.celebration')).toHaveCount(0, { timeout: 5000 })

  await window.locator('.win-text').first().click()
  const input = window.locator('.win-text-input')
  await input.fill('Edited text')
  await input.press('Enter')

  await expect(window.locator('.win-item').first()).toContainText('Edited text')
  await expect(window.locator('.celebration')).toHaveCount(0)

  await app.close()
})

test('deleting a win removes it from the list', async () => {
  const app = await electron.launch({ args: ['out/main/index.js'] })
  const window = await app.firstWindow()

  const uniqueText = `Win to delete ${Date.now()}`
  await window.getByLabel(/what did you win/i).fill(uniqueText)
  await window.getByRole('button', { name: /add win/i }).click()
  const newItem = window.locator('.win-item').first()
  await expect(newItem).toContainText(uniqueText)
  const countBefore = await window.locator('.win-item').count()

  await newItem.locator('.win-text').click()
  await newItem.getByRole('button', { name: /delete win/i }).click()

  await expect(window.locator('.win-item')).toHaveCount(countBefore - 1)
  await expect(window.locator('.win-item', { hasText: uniqueText })).toHaveCount(0)

  await app.close()
})
