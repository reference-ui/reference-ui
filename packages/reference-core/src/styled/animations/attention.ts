import { extendKeyframes } from '../api/internal/extendKeyframes'

/**
 * Attention-seeking animations
 */
extendKeyframes({
  ping: {
    '0%': {
      transform: 'scale(1)',
      opacity: '1',
    },
    '75%, 100%': {
      transform: 'scale(2)',
      opacity: '0',
    },
  },
  flash: {
    '0%, 50%, 100%': { opacity: '1' },
    '25%, 75%': { opacity: '0' },
  },
  glow: {
    '0%, 100%': {
      opacity: '1',
      filter: 'brightness(1)',
    },
    '50%': {
      opacity: '1',
      filter: 'brightness(1.5)',
    },
  },
  shimmer: {
    '0%': {
      backgroundPosition: '-200% 0',
    },
    '100%': {
      backgroundPosition: '200% 0',
    },
  },
})
