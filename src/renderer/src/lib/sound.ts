import type { Bin } from './bins'

export function volumeToGain(volume: number): number {
  return Math.min(1, Math.max(0, volume))
}

const BIN_TONES: Record<Bin, number[]> = {
  unrated: [880],
  small: [523.25, 659.25],
  medium: [523.25, 659.25, 783.99],
  large: [523.25, 659.25, 783.99, 1046.5],
  epic: [523.25, 659.25, 783.99, 1046.5, 1318.51]
}

export function tonesForBin(bin: Bin): number[] {
  return BIN_TONES[bin]
}

export function playChime(bin: Bin, volume: number, ctx: AudioContext = new AudioContext()): void {
  const gain = volumeToGain(volume)
  const tones = tonesForBin(bin)
  const noteDuration = 0.14

  tones.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gainNode.gain.value = gain * 0.3

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    const startTime = ctx.currentTime + index * noteDuration
    oscillator.start(startTime)
    oscillator.stop(startTime + noteDuration)
  })
}
