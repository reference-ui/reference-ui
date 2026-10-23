// Config for the CORE-BOUND-07 world: one include over src/. The spec copies this folder into temp projects, and makes
// the FIFO and the link to it only inside those copies, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-07',
  include: ['src/**/*.{ts,tsx}'],
})
