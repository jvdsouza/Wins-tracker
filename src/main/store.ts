import Store from 'electron-store'
import type { Bounds } from './window'

export interface StoreSchema {
  windowBounds: Bounds | null
}

export const DEFAULT_STORE: StoreSchema = {
  windowBounds: null
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
