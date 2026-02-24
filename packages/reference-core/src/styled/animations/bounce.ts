import { extendKeyframes } from '../api/internal/extendKeyframes'

/**
 * Bounce and elastic animations
 */
extendKeyframes({
  bounce: {
    '0%, 100%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  bounceIn: {
    '0%': {
      opacity: '0',
      transform: 'scale(0.3)',
    },
    '50%': {
      opacity: '1',
      transform: 'scale(1.05)',
    },
    '70%': {
      transform: 'scale(0.9)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  bounceOut: {
    '0%': {
      transform: 'scale(1)',
    },
    '25%': {
      transform: 'scale(0.95)',
    },
    '50%': {
      opacity: '1',
      transform: 'scale(1.1)',
    },
    '100%': {
      opacity: '0',
      transform: 'scale(0.3)',
    },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
  },
})
