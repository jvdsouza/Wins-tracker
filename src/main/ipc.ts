import { ipcMain, BrowserWindow, globalShortcut } from 'electron'
import { randomUUID } from 'node:crypto'
import { store as realStore } from './store'
import type { StoreSchema } from './store'
import { IPC } from '../shared/ipc-contract'
import type { Win, AddWinInput, Settings } from '../shared/ipc-contract'
import { getEmojiForRating } from '../renderer/src/lib/bins'
import { registerToggleShortcut } from './shortcut'

interface Deps {
  store: Pick<typeof realStore, 'get' | 'set'>
  newId?: () => string
  now?: () => string
}

export function addWin(input: AddWinInput, deps: Deps): Win {
  const newId = deps.newId ?? randomUUID
  const now = deps.now ?? (() => new Date().toISOString())

  const win: Win = {
    id: newId(),
    text: input.text,
    rating: input.rating,
    createdAt: now(),
    emoji: getEmojiForRating(input.rating)
  }

  const existing = deps.store.get('wins') as Win[]
  deps.store.set('wins', [win, ...existing])
  return win
}

export function getAllWins(deps: Pick<Deps, 'store'>): Win[] {
  return deps.store.get('wins') as Win[]
}

export function getSettings(deps: Pick<Deps, 'store'>): Settings {
  return deps.store.get('settings') as Settings
}

export function setSettings(patch: Partial<Settings>, deps: Pick<Deps, 'store'>): Settings {
  const current = deps.store.get('settings') as Settings
  const updated = { ...current, ...patch }
  deps.store.set('settings', updated)
  return updated
}

export function registerIpcHandlers(win: BrowserWindow): void {
  const deps = { store: realStore }

  ipcMain.handle(IPC.WINS_ADD, (_event, input: AddWinInput) => {
    const created = addWin(input, deps)
    win.webContents.send(IPC.WINS_UPDATED, getAllWins(deps))
    return created
  })

  ipcMain.handle(IPC.WINS_GET_ALL, () => getAllWins(deps))
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings(deps))
  ipcMain.handle(IPC.SETTINGS_SET, (_event, patch: Partial<Settings>) => {
    const previous = getSettings(deps)
    const updated = setSettings(patch, deps)
    if (patch.shortcut && patch.shortcut !== previous.shortcut) {
      globalShortcut.unregister(previous.shortcut)
      registerToggleShortcut(win, updated.shortcut)
    }
    return updated
  })
}
