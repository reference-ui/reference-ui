// Config for the CORE-LAYER-02 world. It takes the upstream stand-in plus the
// sync defaults and emits a two-system build: theme and src includes with the
// upstream extends entry, so adopted tokens nest inside the downstream package.
import { defineConfig } from '@reference-ui/core'
import { upstream } from './theme/upstream.ts'

export default defineConfig({
  name: 'core-layer2',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [upstream],
})
