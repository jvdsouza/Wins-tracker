import { describe, it, expect, vi } from 'vitest'
import type { BrowserWindow } from 'electron'
import { defaultAccelerator, toggleWindow, registerToggleShortcut } from './shortcut'

vi.mock('electron', () => ({
  globalShortcut: {
    register: vi.fn((_accelerator: string, callback: () => void) => {
      // Simulate the OS firing the hotkey immediately so registerToggleShortcut
      // tests can assert on the effect of the registered callback.
      callback()
      return true
    })
  }
}))

describe('defaultAccelerator', () => {
  it('uses Cmd+Shift+W on macOS', () => {
    expect(defaultAccelerator('darwin')).toBe('Cmd+Shift+W')
  })

  it('uses Alt+Shift+W on Windows and Linux', () => {
    expect(defaultAccelerator('win32')).toBe('Alt+Shift+W')
    expect(defaultAccelerator('linux')).toBe('Alt+Shift+W')
  })
})

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

describe('toggleWindow', () => {
  it('hides a visible window', () => {
    const win = createFakeWindow(true)
    toggleWindow(win)
    expect(win.hide).toHaveBeenCalledTimes(1)
    expect(win.show).not.toHaveBeenCalled()
    expect(win.isVisible()).toBe(false)
  })

  it('shows and focuses a hidden window', () => {
    const win = createFakeWindow(false)
    toggleWindow(win)
    expect(win.show).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledTimes(1)
    expect(win.hide).not.toHaveBeenCalled()
    expect(win.isVisible()).toBe(true)
  })

  it('flips back and forth across repeated calls', () => {
    const win = createFakeWindow(true)
    toggleWindow(win)
    expect(win.isVisible()).toBe(false)
    toggleWindow(win)
    expect(win.isVisible()).toBe(true)
  })
})

describe('registerToggleShortcut', () => {
  it('registers the accelerator and its callback toggles the given window', () => {
    const win = createFakeWindow(true)
    const registered = registerToggleShortcut(win, 'Alt+Shift+W')
    expect(registered).toBe(true)
    // The mocked globalShortcut.register above invokes the callback synchronously,
    // so a visible window passed in should already have been hidden.
    expect(win.hide).toHaveBeenCalledTimes(1)
    expect(win.isVisible()).toBe(false)
  })
})
