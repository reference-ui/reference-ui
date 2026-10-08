// Motion for the PARITY-01 mini-lib world. It takes no input and emits the
// fadeIn keyframes the fade.quick animation token names. Frame values are
// hand-written var(--...) references only (RS-16): no token paths ride in
// keyframes. The engine prints these as @keyframes inside @layer global.
import { keyframes } from '@reference-ui/neo'

keyframes({
  fadeIn: {
    from: { opacity: '0', color: 'var(--colors-ink)' },
    to: { opacity: '1', color: 'var(--colors-ink)' },
  },
})
