import { describe, it, expect, vi } from 'vitest'
import { addWin, getAllWins, getSettings, setSettings, updateWin, deleteWin } from './ipc'
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

describe('updateWin', () => {
  it('merges a text patch into the matching win and leaves its rating/emoji alone', () => {
    const wins = [
      { id: '1', text: 'old text', rating: 5, createdAt: 'x', emoji: '🎊' },
      { id: '2', text: 'other', rating: null, createdAt: 'y', emoji: '✨' }
    ]
    const fakeStore = makeFakeStore({ windowBounds: null, wins, settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })

    const result = updateWin('1', { text: 'new text' }, { store: fakeStore as any })

    expect(result).toEqual({ id: '1', text: 'new text', rating: 5, createdAt: 'x', emoji: '🎊' })
    expect(fakeStore.set).toHaveBeenCalledWith('wins', [
      { id: '1', text: 'new text', rating: 5, createdAt: 'x', emoji: '🎊' },
      wins[1]
    ])
  })

  it('recomputes the emoji when the rating changes', () => {
    const wins = [{ id: '1', text: 'old text', rating: 2, createdAt: 'x', emoji: '🎉' }]
    const fakeStore = makeFakeStore({ windowBounds: null, wins, settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })

    const result = updateWin('1', { rating: 10 }, { store: fakeStore as any })

    expect(result).toEqual({ id: '1', text: 'old text', rating: 10, createdAt: 'x', emoji: '🚀' })
  })

  it('returns undefined when no win matches the id', () => {
    const fakeStore = makeFakeStore({ windowBounds: null, wins: [], settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })
    expect(updateWin('missing', { text: 'x' }, { store: fakeStore as any })).toBeUndefined()
  })
})

describe('deleteWin', () => {
  it('removes the matching win and leaves the rest untouched', () => {
    const wins = [
      { id: '1', text: 'a', rating: null, createdAt: 'x', emoji: '✨' },
      { id: '2', text: 'b', rating: 3, createdAt: 'y', emoji: '🎉' }
    ]
    const fakeStore = makeFakeStore({ windowBounds: null, wins, settings: { shortcut: 'Alt+Shift+W', volume: 0.7 } })

    deleteWin('1', { store: fakeStore as any })

    expect(fakeStore.set).toHaveBeenCalledWith('wins', [wins[1]])
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
