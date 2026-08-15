import { describe, it, expect } from 'vitest'
import { volumeToGain, tonesForBin } from './sound'

describe('volumeToGain', () => {
  it('clamps into 0..1', () => {
    expect(volumeToGain(-0.5)).toBe(0)
    expect(volumeToGain(1.5)).toBe(1)
    expect(volumeToGain(0.42)).toBe(0.42)
  })
})

describe('tonesForBin', () => {
  it('gives bigger bins more, higher notes', () => {
    expect(tonesForBin('unrated')).toEqual([880])
    expect(tonesForBin('small').length).toBe(2)
    expect(tonesForBin('epic').length).toBe(5)
    expect(tonesForBin('epic')[4]).toBeGreaterThan(tonesForBin('small')[1])
  })
})
