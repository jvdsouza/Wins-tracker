import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddWinForm } from './AddWinForm'

describe('AddWinForm', () => {
  it('submits the entered text and selected rating, then clears the form', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/what did you win/i), 'Finished the report')
    await user.selectOptions(screen.getByLabelText(/rating/i), '8')
    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).toHaveBeenCalledWith({ text: 'Finished the report', rating: 8 })
    expect(screen.getByLabelText(/what did you win/i)).toHaveValue('')
  })

  it('submits a null rating when none is chosen', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.type(screen.getByLabelText(/what did you win/i), 'Made my bed');
    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).toHaveBeenCalledWith({ text: 'Made my bed', rating: null })
  })

  it('does not submit empty text', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddWinForm onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: /add win/i }))

    expect(onAdd).not.toHaveBeenCalled()
  })
})
