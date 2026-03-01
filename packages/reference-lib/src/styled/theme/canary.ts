/**
 * Canary token for testing baseSystem emission.
 * Unique value so we can quickly scan the generated baseSystem to verify it was built.
 */
import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    refLibCanary: {
      value: 'oklch(50% 0.2 180)',
      description: 'Canary token — scan for refLibCanary to verify baseSystem contains reference-lib tokens',
    },
  },
})
