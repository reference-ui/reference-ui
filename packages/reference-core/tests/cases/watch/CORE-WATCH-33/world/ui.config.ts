// Config for the CORE-WATCH-33 world: one include over src/. The spec copies this folder into a temp
// project and adds a source that is not valid UTF-8 there, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-33',
  include: ['src/**/*.{ts,tsx}'],
})
