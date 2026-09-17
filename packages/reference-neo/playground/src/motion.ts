import { keyframes } from '@reference-ui/neo'

// Playground motion: the five keyframe sets the animation tokens name.
// Frame values are plain CSS only (no token paths ride in keyframes); the
// engine prints these as @keyframes and pages pair every animation with a
// _motionReduce twin that parks it at none.
keyframes({
  beacon: {
    '0%': { opacity: '1' },
    '50%': { opacity: '0.25' },
    '100%': { opacity: '1' },
  },
  riseIn: {
    from: { opacity: '0', transform: 'translateY(10px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  scanX: {
    from: { transform: 'translateX(-120%)' },
    to: { transform: 'translateX(1300%)' },
  },
  blink: {
    '0%': { opacity: '1' },
    '50%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  spinSlow: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
})
