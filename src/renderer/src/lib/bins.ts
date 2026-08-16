export type Bin = 'unrated' | 'small' | 'medium' | 'large' | 'epic'

export function getBinForRating(rating: number | null): Bin {
  if (rating === null) return 'unrated'
  if (rating <= 3) return 'small'
  if (rating <= 6) return 'medium'
  if (rating <= 9) return 'large'
  return 'epic'
}

const BIN_EMOJI: Record<Bin, string> = {
  unrated: '✨',
  small: '🎉',
  medium: '🎊',
  large: '👏',
  epic: '🚀'
}

export function getEmojiForRating(rating: number | null): string {
  return BIN_EMOJI[getBinForRating(rating)]
}

export const BIN_VARIANTS: Record<Bin, string[]> = {
  unrated: ['sparkle-drift'],
  small: ['confetti-burst', 'party-poppers', 'balloon-float', 'star-sparkle'],
  medium: ['confetti-cannon', 'firework-pop', 'ribbon-swirl', 'balloon-bunch'],
  large: ['applause-hands', 'firework-show', 'confetti-rain', 'trophy-shine', 'crowd-cheer'],
  epic: ['rocket-launch', 'fireworks-finale', 'starburst-explosion', 'confetti-monsoon', 'standing-ovation']
}

export function pickAnimationVariant(bin: Bin, rng: () => number = Math.random): string {
  const variants = BIN_VARIANTS[bin]
  const index = Math.min(variants.length - 1, Math.floor(rng() * variants.length))
  return variants[index]
}
