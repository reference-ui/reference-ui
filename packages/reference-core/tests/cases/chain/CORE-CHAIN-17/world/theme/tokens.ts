// Root token fragment for the CORE-CHAIN-17 monorepo. It defines the app's novel ink, which no package defines, and
// its own value for `shared`, a name the component package defines too: the probe for whose value paints inside the
// package's components once the package runs its own system.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    chain17Ink: { value: '#1d4ed8' },
    shared: { value: '#15803d' },
  },
})
