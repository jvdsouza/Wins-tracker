import { useEffect, useState } from 'react'
import type { Win, AddWinInput, Settings } from '../../shared/ipc-contract'
import { AddWinForm } from './components/AddWinForm'
import { WinsList } from './components/WinsList'
import { Celebration } from './components/Celebration'
import { SettingsPanel } from './components/SettingsPanel'

export default function App(): JSX.Element {
  const [wins, setWins] = useState<Win[]>([])
  const [celebrating, setCelebrating] = useState<Win | null>(null)
  const [volume, setVolume] = useState(0.7)
  const [shortcut, setShortcut] = useState('Alt+Shift+W')

  useEffect(() => {
    window.api.wins.getAll().then(setWins)
    window.api.wins.onUpdated(setWins)
    window.api.settings.get().then((s: Settings) => {
      setVolume(s.volume)
      setShortcut(s.shortcut)
    })
  }, [])

  async function handleAdd(input: AddWinInput): Promise<void> {
    const created = await window.api.wins.add(input)
    setCelebrating(created)
  }

  async function handleUpdate(id: string, patch: Partial<AddWinInput>): Promise<void> {
    const updated = await window.api.wins.update(id, patch)
    if (updated && patch.rating !== undefined) {
      setCelebrating(updated)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    await window.api.wins.delete(id)
  }

  async function handleSettingsChange(patch: Partial<Settings>): Promise<void> {
    const updated = await window.api.settings.set(patch)
    setVolume(updated.volume)
    setShortcut(updated.shortcut)
  }

  return (
    <div className="app-shell">
      <h1>Your Wins</h1>
      <AddWinForm onAdd={handleAdd} />
      <WinsList wins={wins} onUpdate={handleUpdate} onDelete={handleDelete} />
      <SettingsPanel settings={{ shortcut, volume }} onChange={handleSettingsChange} />
      {celebrating && (
        <Celebration win={celebrating} volume={volume} onDone={() => setCelebrating(null)} />
      )}
    </div>
  )
}
