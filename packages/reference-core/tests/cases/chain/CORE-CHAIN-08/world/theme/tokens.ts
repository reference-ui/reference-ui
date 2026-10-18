// Consumer token fragment for the CORE-CHAIN-08 world. It defines the novel
// probe token the prebuilt component is styled with: the token exists only
// downstream, so a painted value proves the consumer resolved and emitted it
// rather than reading a rule the package already shipped.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    chain8Ink: { value: '#b70233' },
  },
})
