import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WinItem } from './WinItem'
import type { Win } from '../../../shared/ipc-contract'

const win: Win = {
  id: '1',
  text: 'Shipped the feature',
  rating: 7,
  createdAt: '2026-08-01T00:00:00.000Z',
  emoji: '👏'
}

describe('WinItem text editing', () => {
  it('turns the win text into an editable input on click', async () => {
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByText('Shipped the feature'))

    expect(screen.getByDisplayValue('Shipped the feature')).toBeInTheDocument()
  })

  it('saves the trimmed text on Enter', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={onUpdate} onDelete={vi.fn()} />)

    await user.click(screen.getByText('Shipped the feature'))
    const input = screen.getByDisplayValue('Shipped the feature')
    await user.clear(input)
    await user.type(input, '  Shipped it early  {Enter}')

    expect(onUpdate).toHaveBeenCalledWith('1', { text: 'Shipped it early' })
  })

  it('reverts without saving when Escape is pressed', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={onUpdate} onDelete={vi.fn()} />)

    await user.click(screen.getByText('Shipped the feature'))
    const input = screen.getByDisplayValue('Shipped the feature')
    await user.clear(input)
    await user.type(input, 'discarded edit{Escape}')

    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Shipped the feature')).toBeInTheDocument()
  })

  it('does not save empty text', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={onUpdate} onDelete={vi.fn()} />)

    await user.click(screen.getByText('Shipped the feature'))
    const input = screen.getByDisplayValue('Shipped the feature')
    await user.clear(input)
    await user.type(input, '   {Enter}')

    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Shipped the feature')).toBeInTheDocument()
  })
})

describe('WinItem delete', () => {
  it('has no delete button while not editing', () => {
    render(<WinItem win={win} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows a delete button while editing the text, which calls onDelete', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByText('Shipped the feature'))
    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onDelete).toHaveBeenCalledWith('1')
  })
})

describe('WinItem rating editing', () => {
  it('turns the rating into a select on click, prefilled with the current rating', async () => {
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByText('7'))

    expect(screen.getByRole('combobox')).toHaveValue('7')
  })

  it('calls onUpdate with the newly picked rating', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={onUpdate} onDelete={vi.fn()} />)

    await user.click(screen.getByText('7'))
    await user.selectOptions(screen.getByRole('combobox'), '10')

    expect(onUpdate).toHaveBeenCalledWith('1', { rating: 10 })
  })

  it('closes the picker back to the number after picking', async () => {
    const user = userEvent.setup()
    render(<WinItem win={win} onUpdate={vi.fn()} onDelete={vi.fn()} />)

    await user.click(screen.getByText('7'))
    await user.selectOptions(screen.getByRole('combobox'), '10')

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
