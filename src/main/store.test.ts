import { describe, it, expect } from 'vitest'
import { DEFAULT_STORE } from './store'
import { defaultAccelerator } from './shortcut'

describe('DEFAULT_STORE', () => {
  it('has no windowBounds until the user has moved the window once', () => {
    expect(DEFAULT_STORE.windowBounds).toBeNull()
  })
})

describe('DEFAULT_STORE (extended)', () => {
  it('starts with an empty wins list', () => {
    expect(DEFAULT_STORE.wins).toEqual([])
  })

  it('defaults settings to the platform accelerator and 70% volume', () => {
    expect(DEFAULT_STORE.settings).toEqual({
      shortcut: defaultAccelerator(process.platform),
      volume: 0.7
    })
  })
})
