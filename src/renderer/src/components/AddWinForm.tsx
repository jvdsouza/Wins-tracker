import { useState, FormEvent } from 'react'
import type { AddWinInput } from '../../../shared/ipc-contract'

interface Props {
  onAdd: (input: AddWinInput) => void
}

export function AddWinForm({ onAdd }: Props): JSX.Element {
  const [text, setText] = useState('')
  const [rating, setRating] = useState<string>('')

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({ text: trimmed, rating: rating === '' ? null : Number(rating) })
    setText('')
    setRating('')
  }

  return (
    <form onSubmit={handleSubmit} className="add-win-form">
      <label htmlFor="win-text">What did you win?</label>
      <input
        id="win-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Small or big, it counts"
      />

      <label htmlFor="win-rating">Rating</label>
      <select id="win-rating" value={rating} onChange={(e) => setRating(e.target.value)}>
        <option value="">No rating</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <button type="submit">Add win</button>
    </form>
  )
}
