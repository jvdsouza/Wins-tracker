import Store from 'electron-store'
import type { Bounds } from './window'
import type { Win, Settings } from '../shared/ipc-contract'
import { defaultAccelerator } from './shortcut'

export interface StoreSchema {
  windowBounds: Bounds | null
  wins: Win[]
  settings: Settings
}

export const DEFAULT_STORE: StoreSchema = {
  windowBounds: null,
  wins: [],
  settings: {
    shortcut: defaultAccelerator(process.platform),
    volume: 0.7
  }
}

// electron-store/conf only consult `projectName` when they can't infer a
// `cwd` from a running Electron `app` (e.g. under vitest, outside Electron).
// In the real app this is unused: the userData path always wins.
// electron-store's `Options<T>` type omits `projectName` (it assumes
// Electron's `app` is always available), so it's set via an intermediate
// variable to avoid TS's excess-property check on an inline object literal.
const storeOptions = {
  defaults: DEFAULT_STORE,
  projectName: 'adhd-wins-record'
}

export const store = new Store<StoreSchema>(storeOptions)
