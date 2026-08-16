import type { Win } from '../../../shared/ipc-contract'

export function sortWinsByNewest(wins: Win[]): Win[] {
  return [...wins].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
