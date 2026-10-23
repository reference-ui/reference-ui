// Config for the CORE-BOUND-02 world: one include over src/. A tokens() call there hands sync a hostile tree. The spec
// copies this folder into a temp project and runs ref sync there, so the committed world never holds a generated folder.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-02',
  include: ['src/**/*.{ts,tsx}'],
})
