// Config for the CORE-BOUND-03 world: one include over src/, with lib/ kept outside it. The spec copies this folder into
// temp projects, and links src/ to lib/ and to itself only inside those copies, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-03',
  include: ['src/**/*.{ts,tsx}'],
})
