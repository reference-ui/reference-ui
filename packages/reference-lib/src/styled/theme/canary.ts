/**
 * Canary token for testing baseSystem emission.
 * Unique value so we can quickly scan the generated baseSystem to verify it was built.
 */
import { tokens } from '@reference-ui/system'
import { REF_LIB_CANARY } from '../../colors.js'

tokens({
  colors: {
    refLibCanary: {
      value: REF_LIB_CANARY,
      description: 'Canary token — scan for refLibCanary to verify baseSystem contains reference-lib tokens',
    },
  },
})
