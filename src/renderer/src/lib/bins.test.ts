import { describe, it, expect } from 'vitest'
import { getBinForRating, getEmojiForRating, pickAnimationVariant, BIN_VARIANTS } from './bins'

describe('getBinForRating', () => {
  it('maps null to unrated', () => {
    expect(getBinForRating(null)).toBe('unrated')
  })
  it('maps 1-3 to small', () => {
    expect(getBinForRating(1)).toBe('small')
    expect(getBinForRating(3)).toBe('small')
  })
  it('maps 4-6 to medium', () => {
    expect(getBinForRating(4)).toBe('medium')
    expect(getBinForRating(6)).toBe('medium')
  })
  it('maps 7-9 to large', () => {
    expect(getBinForRating(7)).toBe('large')
    expect(getBinForRating(9)).toBe('large')
  })
  it('maps 10 to epic', () => {
    expect(getBinForRating(10)).toBe('epic')
  })
})

describe('getEmojiForRating', () => {
  it('returns the epic rocket for a 10', () => {
    expect(getEmojiForRating(10)).toBe('🚀')
  })
  it('returns the neutral sparkle for unrated', () => {
    expect(getEmojiForRating(null)).toBe('✨')
  })
})

describe('pickAnimationVariant', () => {
  it('deterministically picks by injected rng', () => {
    expect(pickAnimationVariant('small', () => 0)).toBe(BIN_VARIANTS.small[0])
    expect(pickAnimationVariant('small', () => 0.99)).toBe(
      BIN_VARIANTS.small[BIN_VARIANTS.small.length - 1]
    )
  })
  it('every bin has 4-5 variants (unrated has exactly 1)', () => {
    expect(BIN_VARIANTS.unrated.length).toBe(1)
    for (const bin of ['small', 'medium', 'large', 'epic'] as const) {
      expect(BIN_VARIANTS[bin].length).toBeGreaterThanOrEqual(4)
      expect(BIN_VARIANTS[bin].length).toBeLessThanOrEqual(5)
    }
  })
})
