import type { Win } from '../../../shared/ipc-contract'

export function WinItem({ win }: { win: Win }): JSX.Element {
  return (
    <li className="win-item">
      <span className="win-emoji" aria-hidden="true">
        {win.emoji}
      </span>
      <span className="win-text">{win.text}</span>
      {win.rating !== null && <span className="win-rating">{win.rating}</span>}
    </li>
  )
}
