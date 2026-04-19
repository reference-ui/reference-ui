import { keyframes } from '@reference-ui/system'

export const spinKeyframes = {
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spinReverse: {
    from: { transform: 'rotate(360deg)' },
    to: { transform: 'rotate(0deg)' },
  },
  rotate90: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(90deg)' },
  },
  rotate180: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(180deg)' },
  },
  wigglewiggle: {
    '0%, 100%': { transform: 'rotate(-3deg)' },
    '50%': { transform: 'rotate(3deg)' },
  },
} as const

keyframes(spinKeyframes)
