import { describe, it, expect } from 'vitest'
import { defaultAccelerator } from './shortcut'

describe('defaultAccelerator', () => {
  it('uses Cmd+Shift+W on macOS', () => {
    expect(defaultAccelerator('darwin')).toBe('Cmd+Shift+W')
  })

  it('uses Alt+Shift+W on Windows and Linux', () => {
    expect(defaultAccelerator('win32')).toBe('Alt+Shift+W')
    expect(defaultAccelerator('linux')).toBe('Alt+Shift+W')
  })
})
