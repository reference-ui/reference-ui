// Config for the CORE-BOUND-04 world: one include over src/, valid as committed. The spec copies this folder into temp
// projects and overwrites ui.config.ts there with a hostile include pattern, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-04',
  include: ['src/**/*.{ts,tsx}'],
})
