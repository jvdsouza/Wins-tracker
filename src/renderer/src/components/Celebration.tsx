import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { Win } from '../../../shared/ipc-contract'
import { getBinForRating, pickAnimationVariant } from '../lib/bins'
import { playChime } from '../lib/sound'

interface Props {
  win: Win
  volume: number
  onDone: () => void
}

const ANIMATION_DURATION_MS = 3000

function fireConfetti(particleMultiplier: number): void {
  confetti({
    particleCount: 40 * particleMultiplier,
    spread: 70,
    origin: { y: 0.6 }
  })
}

const CONFETTI_VARIANTS = new Set([
  'confetti-burst',
  'party-poppers',
  'confetti-cannon',
  'confetti-rain',
  'confetti-monsoon',
  'starburst-explosion',
  'fireworks-finale',
  'firework-pop',
  'firework-show'
])

export function Celebration({ win, volume, onDone }: Props): JSX.Element {
  const bin = getBinForRating(win.rating)
  const variant = pickAnimationVariant(bin)

  useEffect(() => {
    playChime(bin, volume)

    if (CONFETTI_VARIANTS.has(variant)) {
      const multiplier = { unrated: 0.5, small: 1, medium: 1.5, large: 2, epic: 3 }[bin]
      fireConfetti(multiplier)
    }

    const timer = setTimeout(onDone, ANIMATION_DURATION_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win.id])

  return (
    <div className={`celebration celebration--${variant}`} aria-hidden="true">
      {variant === 'rocket-launch' && <span className="celebration-emoji">🚀</span>}
      {variant === 'applause-hands' && <span className="celebration-emoji">👏</span>}
      {variant === 'standing-ovation' && <span className="celebration-emoji">👏🎉👏</span>}
      {variant === 'balloon-float' && <span className="celebration-emoji">🎈</span>}
      {variant === 'balloon-bunch' && <span className="celebration-emoji">🎈🎈🎈</span>}
      {variant === 'trophy-shine' && <span className="celebration-emoji">🏆</span>}
      {variant === 'crowd-cheer' && <span className="celebration-emoji">🙌</span>}
      {variant === 'star-sparkle' && <span className="celebration-emoji">⭐</span>}
      {variant === 'ribbon-swirl' && <span className="celebration-emoji">🎀</span>}
      {variant === 'sparkle-drift' && <span className="celebration-emoji">✨</span>}
    </div>
  )
}
