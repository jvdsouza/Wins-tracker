import { useEffect, useState } from 'react'
import type { Win, AddWinInput, Settings } from '../../shared/ipc-contract'
import { AddWinForm } from './components/AddWinForm'
import { WinsList } from './components/WinsList'
import { Celebration } from './components/Celebration'

export default function App(): JSX.Element {
  const [wins, setWins] = useState<Win[]>([])
  const [celebrating, setCelebrating] = useState<Win | null>(null)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    window.api.wins.getAll().then(setWins)
    window.api.wins.onUpdated(setWins)
    window.api.settings.get().then((s: Settings) => setVolume(s.volume))
  }, [])

  async function handleAdd(input: AddWinInput): Promise<void> {
    const created = await window.api.wins.add(input)
    setCelebrating(created)
  }

  return (
    <div className="app-shell">
      <h1>Your Wins</h1>
      <AddWinForm onAdd={handleAdd} />
      <WinsList wins={wins} />
      {celebrating && (
        <Celebration win={celebrating} volume={volume} onDone={() => setCelebrating(null)} />
      )}
    </div>
  )
}
