import { useEffect, useState } from 'react'
import type { Win, AddWinInput } from '../../shared/ipc-contract'
import { AddWinForm } from './components/AddWinForm'
import { WinsList } from './components/WinsList'

export default function App(): JSX.Element {
  const [wins, setWins] = useState<Win[]>([])

  useEffect(() => {
    window.api.wins.getAll().then(setWins)
    window.api.wins.onUpdated(setWins)
  }, [])

  async function handleAdd(input: AddWinInput): Promise<void> {
    await window.api.wins.add(input)
  }

  return (
    <div className="app-shell">
      <h1>Your Wins</h1>
      <AddWinForm onAdd={handleAdd} />
      <WinsList wins={wins} />
    </div>
  )
}
