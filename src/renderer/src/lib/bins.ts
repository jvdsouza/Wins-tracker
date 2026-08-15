// Stub: Task 12 implements the real rating -> bin -> emoji/animation mapping
// and overwrites this file. src/main/ipc.ts imports getEmojiForRating from
// this exact path so no import changes are needed once Task 12 lands.
export function getEmojiForRating(rating: number | null): string {
  return '✨'
}
