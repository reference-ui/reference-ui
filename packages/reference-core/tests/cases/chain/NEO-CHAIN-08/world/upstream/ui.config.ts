// Config for the NEO-CHAIN-08 prebuilt package. It takes its own token
// fragment and emits a real materialized base system plus a bound `react.mjs`
// the consumer world extends and the fixture component renders through.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain8-up',
  include: ['theme/**/*.{ts,tsx}'],
})
