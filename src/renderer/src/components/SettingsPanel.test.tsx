import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('shows the current shortcut and lets the user change volume', async () => {
    const onChange = vi.fn()
    render(<SettingsPanel settings={{ shortcut: 'Alt+Shift+W', volume: 0.7 }} onChange={onChange} />)

    expect(screen.getByDisplayValue('Alt+Shift+W')).toBeInTheDocument()

    const slider = screen.getByLabelText(/volume/i)
    fireEvent.change(slider, { target: { value: '0.3' } })

    expect(onChange).toHaveBeenCalledWith({ volume: 0.3 })
  })

  it('submits a new shortcut on blur', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SettingsPanel settings={{ shortcut: 'Alt+Shift+W', volume: 0.7 }} onChange={onChange} />)

    const shortcutInput = screen.getByDisplayValue('Alt+Shift+W')
    await user.clear(shortcutInput)
    await user.type(shortcutInput, 'Alt+Shift+K')
    await user.tab()

    expect(onChange).toHaveBeenCalledWith({ shortcut: 'Alt+Shift+K' })
  })
})
