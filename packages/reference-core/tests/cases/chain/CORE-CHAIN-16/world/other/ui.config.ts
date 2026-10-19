// Config for the CORE-CHAIN-16 other system, `core-chain16-other`. It takes its token fragment and emits a real
// published base system the app composes in place of the package's: the partly composed leg, where some system is
// composed but not the one that renders the package's components.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain16-other',
  include: ['theme/**/*.{ts,tsx}'],
})
