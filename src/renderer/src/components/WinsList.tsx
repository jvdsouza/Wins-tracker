import type { Win } from '../../../shared/ipc-contract'
import { sortWinsByNewest } from '../lib/wins'
import { WinItem } from './WinItem'

export function WinsList({ wins }: { wins: Win[] }): JSX.Element {
  if (wins.length === 0) {
    return <p className="wins-empty">No wins yet — add one above to get started.</p>
  }

  return (
    <ul className="wins-list">
      {sortWinsByNewest(wins).map((win) => (
        <WinItem key={win.id} win={win} />
      ))}
    </ul>
  )
}
