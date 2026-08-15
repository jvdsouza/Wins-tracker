import type { IpcRenderer } from 'electron'
import { IPC } from '../shared/ipc-contract'
import type { AddWinInput, Win, Settings } from '../shared/ipc-contract'

type MinimalIpcRenderer = Pick<IpcRenderer, 'invoke' | 'on'>

export function buildApi(renderer: MinimalIpcRenderer) {
  return {
    wins: {
      add: (input: AddWinInput): Promise<Win> => renderer.invoke(IPC.WINS_ADD, input),
      getAll: (): Promise<Win[]> => renderer.invoke(IPC.WINS_GET_ALL),
      onUpdated: (callback: (wins: Win[]) => void): void => {
        renderer.on(IPC.WINS_UPDATED, (_event, wins: Win[]) => callback(wins))
      }
    },
    settings: {
      get: (): Promise<Settings> => renderer.invoke(IPC.SETTINGS_GET),
      set: (patch: Partial<Settings>): Promise<Settings> => renderer.invoke(IPC.SETTINGS_SET, patch)
    }
  }
}

export type Api = ReturnType<typeof buildApi>

// Expose API in Electron preload process
try {
  const { contextBridge, ipcRenderer } = require('electron')
  contextBridge.exposeInMainWorld('api', buildApi(ipcRenderer))
} catch {
  // Running in test environment where electron is not available
}
