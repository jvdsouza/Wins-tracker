import { useState } from 'react'
import type { Settings } from '../../../shared/ipc-contract'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

export function SettingsPanel({ settings, onChange }: Props): JSX.Element {
  const [shortcutDraft, setShortcutDraft] = useState(settings.shortcut)

  return (
    <div className="settings-panel">
      <label htmlFor="shortcut-input">Overlay shortcut</label>
      <input
        id="shortcut-input"
        value={shortcutDraft}
        onChange={(e) => setShortcutDraft(e.target.value)}
        onBlur={() => {
          if (shortcutDraft !== settings.shortcut) onChange({ shortcut: shortcutDraft })
        }}
      />

      <label htmlFor="volume-input">Volume</label>
      <input
        id="volume-input"
        type="range"
        min={0}
        max={1}
        step={0.1}
        defaultValue={settings.volume}
        onChange={(e) => onChange({ volume: Number(e.target.value) })}
      />
    </div>
  )
}
