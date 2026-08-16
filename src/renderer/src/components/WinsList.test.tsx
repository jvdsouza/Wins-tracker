import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WinsList } from './WinsList'
import type { Win } from '../../../shared/ipc-contract'

const wins: Win[] = [
  { id: '1', text: 'older win', rating: 2, createdAt: '2026-08-01T00:00:00.000Z', emoji: '🎉' },
  { id: '2', text: 'newer win', rating: 9, createdAt: '2026-08-03T00:00:00.000Z', emoji: '👏' }
]

describe('WinsList', () => {
  it('renders the newest win first, with its emoji and rating, and no strikethrough styling', () => {
    render(<WinsList wins={wins} />)
    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('newer win')
    expect(items[0]).toHaveTextContent('👏')
    expect(items[0]).toHaveTextContent('9')
    expect(items[1]).toHaveTextContent('older win')

    for (const item of items) {
      expect(item.style.textDecoration).not.toContain('line-through')
    }
  })

  it('renders a friendly empty state with no wins yet', () => {
    render(<WinsList wins={[]} />)
    expect(screen.getByText(/no wins yet/i)).toBeInTheDocument()
  })
})
