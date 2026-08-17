import type { Win, AddWinInput } from '../../../shared/ipc-contract'
import { sortWinsByNewest } from '../lib/wins'
import { WinItem } from './WinItem'

interface Props {
  wins: Win[]
  onUpdate: (id: string, patch: Partial<AddWinInput>) => void
  onDelete: (id: string) => void
}

export function WinsList({ wins, onUpdate, onDelete }: Props): JSX.Element {
  if (wins.length === 0) {
    return <p className="wins-empty">No wins yet — add one above to get started.</p>
  }

  return (
    <ul className="wins-list">
      {sortWinsByNewest(wins).map((win) => (
        <WinItem key={win.id} win={win} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  )
}
