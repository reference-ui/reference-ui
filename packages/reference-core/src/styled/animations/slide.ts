import { extendKeyframes } from '../api/internal/extendKeyframes'

/**
 * Slide animations - smooth positional transitions
 */
extendKeyframes({
  slideUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideDown: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideLeft: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideRight: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideUpOut: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-100%)' },
  },
  slideDownOut: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(100%)' },
  },
})
