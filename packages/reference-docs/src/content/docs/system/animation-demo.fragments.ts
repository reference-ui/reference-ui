import { keyframes, tokens } from '@reference-ui/system'

/**
 * Motion defined by the System > Animation page itself, so its live demo
 * shows the API rather than any library's animations. Two keyframes plus
 * three animation tokens; the `example` prefix keeps them apart from the
 * docs' own motion.
 */

keyframes({
  exampleSpin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  exampleFade: {
    from: { opacity: '0', transform: 'translateY(4px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
})

tokens({
  animations: {
    example: {
      spin: { value: 'exampleSpin 3s linear infinite' },
      spinFast: { value: 'exampleSpin 0.8s linear infinite' },
      fade: { value: 'exampleFade 0.6s ease-out both' },
    },
  },
})
