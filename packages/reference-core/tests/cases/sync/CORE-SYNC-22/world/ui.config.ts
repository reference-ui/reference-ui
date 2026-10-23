// Config for the CORE-SYNC-22 world: one include over src/, shaped like CORE-BOUND-03's. The spec copies this folder into a temp
// project and adds a source that is not valid UTF-8 there, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync-22',
  include: ['src/**/*.{ts,tsx}'],
})
