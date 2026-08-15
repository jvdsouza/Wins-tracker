import { describe, it, expect } from 'vitest'
import { DEFAULT_STORE } from './store'

describe('DEFAULT_STORE', () => {
  it('has no windowBounds until the user has moved the window once', () => {
    expect(DEFAULT_STORE.windowBounds).toBeNull()
  })
})
