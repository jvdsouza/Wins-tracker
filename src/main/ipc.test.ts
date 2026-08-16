import { describe, it, expect, vi } from 'vitest'
import { addWin, getAllWins, getSettings, setSettings } from './ipc'
import type { StoreSchema } from './store'

function makeFakeStore(initial: StoreSchema) {
  const data = { ...initial }
  return {
    get: vi.fn((key: keyof StoreSchema) => data[key]),
    set: vi.fn((key: keyof StoreSchema, value: unknown) => {
      ;(data as any)[key] = value
    })
  }
}

describe('addWin', () => {
  it('prepends a new win with a generated id, timestamp, and emoji', () => {
    const fakeStore = makeFakeStore({
      windowBounds: null,
      wins: [],
      settings: { shortcut: 'Alt+Shift+W', volume: 0.7 }
    })
    const deps = {
      store: fakeStore as any,
      newId: () => 'fixed-id',
      now: () => '2026-08-05T00:00:00.000Z'
    }

    const result = addWin({ text: 'Shipped the feature', rating: 8 }, deps)

    expect(result).toEqual({
      id: 'fixed-id',
      text: 'Shipped the feature',
      rating: 8,
      createdAt: '2026-08-05T00:00:00.000Z',
      emoji: '👏'
    })
    expect(fakeStore.set).toHaveBeenCalledWith('wins', [result])
  })
})

describe('getAllWins', () => {
  it('returns the stored wins list', () => {
    const wins = [{ id: '1', text: 'a', rating: null, createdAt: 'x', emoji: '✨' }]
    const fakeStore = makeFakeStore({ windowBounds: null, wins, settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })
    expect(getAllWins({ store: fakeStore as any })).toEqual(wins)
  })
})

describe('settings get/set', () => {
  it('reads and merges settings', () => {
    const fakeStore = makeFakeStore({
      windowBounds: null,
      wins: [],
      settings: { shortcut: 'Alt+Shift+W', volume: 0.7 }
    })
    const deps = { store: fakeStore as any }
    expect(getSettings(deps)).toEqual({ shortcut: 'Alt+Shift+W', volume: 0.7 })

    const updated = setSettings({ volume: 0.3 }, deps)
    expect(updated).toEqual({ shortcut: 'Alt+Shift+W', volume: 0.3 })
  })
})
