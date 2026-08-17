import { useState, KeyboardEvent } from 'react'
import type { Win, AddWinInput } from '../../../shared/ipc-contract'

interface Props {
  win: Win
  onUpdate: (id: string, patch: Partial<AddWinInput>) => void
  onDelete: (id: string) => void
}

const RATING_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1)

export function WinItem({ win, onUpdate, onDelete }: Props): JSX.Element {
  const [editingText, setEditingText] = useState(false)
  const [text, setText] = useState(win.text)
  const [editingRating, setEditingRating] = useState(false)

  function beginEditText(): void {
    setText(win.text)
    setEditingText(true)
  }

  function saveText(): void {
    const trimmed = text.trim()
    if (trimmed && trimmed !== win.text) {
      onUpdate(win.id, { text: trimmed })
    }
    setEditingText(false)
  }

  function handleTextKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      saveText()
    } else if (e.key === 'Escape') {
      setText(win.text)
      setEditingText(false)
    }
  }

  function handleRatingChange(value: string): void {
    onUpdate(win.id, { rating: value === '' ? null : Number(value) })
    setEditingRating(false)
  }

  return (
    <li className="win-item">
      <span className="win-emoji" aria-hidden="true">
        {win.emoji}
      </span>

      {editingText ? (
        <input
          className="win-text-input"
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextKeyDown}
          onBlur={saveText}
        />
      ) : (
        <span className="win-text" onClick={beginEditText}>
          {win.text}
        </span>
      )}

      {editingText && (
        <button
          type="button"
          className="win-delete"
          aria-label="Delete win"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onDelete(win.id)}
        >
          ×
        </button>
      )}

      {win.rating !== null &&
        (editingRating ? (
          <select
            className="win-rating-select"
            value={win.rating}
            autoFocus
            onChange={(e) => handleRatingChange(e.target.value)}
            onBlur={() => setEditingRating(false)}
          >
            <option value="">No rating</option>
            {RATING_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <span className="win-rating" onClick={() => setEditingRating(true)}>
            {win.rating}
          </span>
        ))}
    </li>
  )
}
