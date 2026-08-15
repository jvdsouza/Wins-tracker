export const IPC = {
  WINS_ADD: 'wins:add',
  WINS_GET_ALL: 'wins:getAll',
  WINS_UPDATED: 'wins:updated',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set'
} as const

export interface Win {
  id: string
  text: string
  rating: number | null
  createdAt: string // ISO 8601
  emoji: string
}

export interface AddWinInput {
  text: string
  rating: number | null
}

export interface Settings {
  shortcut: string
  volume: number // 0-1
}
