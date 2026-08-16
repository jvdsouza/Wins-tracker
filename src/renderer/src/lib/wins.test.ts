import { describe, it, expect } from 'vitest'
import { sortWinsByNewest } from './wins'
import type { Win } from '../../../shared/ipc-contract'

describe('sortWinsByNewest', () => {
  it('orders wins latest createdAt first without mutating the input', () => {
    const wins: Win[] = [
      { id: '1', text: 'older', rating: null, createdAt: '2026-08-01T00:00:00.000Z', emoji: '✨' },
      { id: '2', text: 'newer', rating: null, createdAt: '2026-08-03T00:00:00.000Z', emoji: '✨' },
      { id: '3', text: 'middle', rating: null, createdAt: '2026-08-02T00:00:00.000Z', emoji: '✨' }
    ]
    const original = [...wins]

    const sorted = sortWinsByNewest(wins)

    expect(sorted.map((w) => w.id)).toEqual(['2', '3', '1'])
    expect(wins).toEqual(original)
  })
})
