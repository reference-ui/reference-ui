import { extendKeyframes } from '../api/extendKeyframes'

/**
 * Scale animations - size transformations
 */
extendKeyframes({
  scaleIn: {
    from: { 
      opacity: '0',
      transform: 'scale(0.9)' 
    },
    to: { 
      opacity: '1',
      transform: 'scale(1)' 
    }
  },
  scaleOut: {
    from: { 
      opacity: '1',
      transform: 'scale(1)' 
    },
    to: { 
      opacity: '0',
      transform: 'scale(0.9)' 
    }
  },
  scaleUp: {
    from: { transform: 'scale(0.95)' },
    to: { transform: 'scale(1)' }
  },
  scaleDown: {
    from: { transform: 'scale(1.05)' },
    to: { transform: 'scale(1)' }
  },
  pulse: {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' }
  },
  heartbeat: {
    '0%, 100%': { transform: 'scale(1)' },
    '14%': { transform: 'scale(1.3)' },
    '28%': { transform: 'scale(1)' },
    '42%': { transform: 'scale(1.3)' },
    '70%': { transform: 'scale(1)' }
  }
})
