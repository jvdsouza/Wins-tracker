import { describe, it, expect } from 'vitest'
import { getDefaultBounds, clampBoundsToDisplay } from './window'

describe('getDefaultBounds', () => {
  it('anchors a 380x560 window to the bottom-right of the work area with a 24px margin', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    expect(getDefaultBounds(workArea)).toEqual({
      width: 380,
      height: 560,
      x: 1920 - 380 - 24,
      y: 1080 - 560 - 24
    })
  })
})

describe('clampBoundsToDisplay', () => {
  it('leaves in-bounds windows untouched', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    const bounds = { x: 100, y: 100, width: 380, height: 560 }
    expect(clampBoundsToDisplay(bounds, workArea)).toEqual(bounds)
  })

  it('pulls an off-screen window back onto the work area', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
    const bounds = { x: -500, y: -500, width: 380, height: 560 }
    const clamped = clampBoundsToDisplay(bounds, workArea)
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
    expect(clamped.width).toBe(380)
    expect(clamped.height).toBe(560)
  })
})
