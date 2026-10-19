// Config for the CORE-CHAIN-17 workspace package, `@acme/ui`, when it runs its own sync. It takes the package's tokens
// and sources and emits its own system, `chain17-ui`: a published base system the root composes and a bound runtime
// its components render through. The one-system leg never runs it, so the package then has no system of its own.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'chain17-ui',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
