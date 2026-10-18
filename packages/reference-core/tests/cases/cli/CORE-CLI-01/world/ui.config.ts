// ui.config.ts — the CORE-CLI-01 world config. It takes no inputs beyond the
// file itself and emits the system the lifecycle legs sync against: name
// core-cli over the theme sources. The name doubles as the base-system pin
// every leg asserts after its heal.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-cli',
  include: ['theme/**/*.{ts,tsx}'],
})
