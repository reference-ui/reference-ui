// Config for the CORE-CHAIN-08 prebuilt package. It takes its own token
// fragment and emits a real materialized base system plus a bound `react.mjs`
// the consumer world extends and the fixture component renders through.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain8-up',
  include: ['theme/**/*.{ts,tsx}'],
})
