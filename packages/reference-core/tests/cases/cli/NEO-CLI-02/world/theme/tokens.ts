// tokens.ts — the NEO-CLI-02 token fragment. It takes the author tokens()
// collector and emits two color tokens, brand and ink. The resync leg
// rewrites brand's value mid-run to prove the spawned watcher resyncs on
// a file mutation, then restores this canonical spelling in a finally.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
