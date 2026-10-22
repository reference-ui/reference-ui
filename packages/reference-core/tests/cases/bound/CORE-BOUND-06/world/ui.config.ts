// Config for the CORE-BOUND-06 world: one include over src/a/, with src/x.ts kept outside it. The spec copies this folder into
// temp projects, and adds the clique, the lattice and the loop-closing link only inside those copies, never in the committed world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-06',
  include: ['src/a/**/*.{ts,tsx}'],
})
