import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Celebration } from './Celebration'
import * as sound from '../lib/sound'
import type { Win } from '../../../shared/ipc-contract'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const win: Win = { id: '1', text: 'Did it', rating: 10, createdAt: 'x', emoji: '🚀' }

describe('Celebration', () => {
  beforeEach(() => {
    vi.spyOn(sound, 'playChime').mockImplementation(() => {})
  })

  it('plays a chime scaled to the win rating bin and calls onDone after the animation', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Celebration win={win} volume={0.5} onDone={onDone} />)

    expect(sound.playChime).toHaveBeenCalledWith('epic', 0.5)

    vi.advanceTimersByTime(3000)
    expect(onDone).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
