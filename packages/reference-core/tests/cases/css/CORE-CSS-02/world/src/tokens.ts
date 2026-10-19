// Token fragment for the CORE-CSS-02 world. It takes the author tokens()
// collector and emits the single paper color both container-query probes
// consume. One token keeps the oracle minimal: any paint difference between
// the probes comes from lowering, not tokens.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    paper: { value: '#ffffff' },
  },
})
