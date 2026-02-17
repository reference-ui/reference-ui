import { keyframes } from '../api/keyframes'

/**
 * Fade animations - opacity transitions
 */
keyframes({
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' }
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' }
  },
  fadeInUp: {
    from: { 
      opacity: '0',
      transform: 'translateY(20px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateY(0)'
    }
  },
  fadeInDown: {
    from: { 
      opacity: '0',
      transform: 'translateY(-20px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateY(0)'
    }
  },
  fadeInLeft: {
    from: { 
      opacity: '0',
      transform: 'translateX(-20px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateX(0)'
    }
  },
  fadeInRight: {
    from: { 
      opacity: '0',
      transform: 'translateX(20px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateX(0)'
    }
  }
})
