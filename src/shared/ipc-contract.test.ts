import { describe, it, expect } from 'vitest'
import { IPC } from './ipc-contract'

describe('IPC channel names', () => {
  it('are unique and namespaced', () => {
    const values = Object.values(IPC)
    expect(new Set(values).size).toBe(values.length)
    for (const v of values) expect(v).toMatch(/^[a-z]+:[a-zA-Z]+$/)
  })
})
