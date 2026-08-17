import { describe, it, expect, vi } from 'vitest'
import type { BrowserWindow } from 'electron'

const { quit } = vi.hoisted(() => ({ quit: vi.fn() }))
vi.mock('electron', () => ({
  app: { quit }
}))

import { buildTrayMenuTemplate } from './tray'

function createFakeWindow(initiallyVisible: boolean): BrowserWindow {
  let visible = initiallyVisible
  return {
    isVisible: vi.fn(() => visible),
    hide: vi.fn(() => {
      visible = false
    }),
    show: vi.fn(() => {
      visible = true
    }),
    focus: vi.fn()
  } as unknown as BrowserWindow
}

describe('buildTrayMenuTemplate', () => {
  it('has a Show/Hide item that toggles the given window', () => {
    const win = createFakeWindow(true)
    const template = buildTrayMenuTemplate(win)

    const showHide = template.find((item) => item.label === 'Show/Hide')
    expect(showHide).toBeDefined()
    ;(showHide!.click as () => void)()

    expect(win.hide).toHaveBeenCalledTimes(1)
  })

  it('has a Quit item that quits the app', () => {
    quit.mockClear()
    const win = createFakeWindow(true)
    const template = buildTrayMenuTemplate(win)

    const quitItem = template.find((item) => item.label === 'Quit')
    expect(quitItem).toBeDefined()
    ;(quitItem!.click as () => void)()

    expect(quit).toHaveBeenCalledTimes(1)
  })
})
