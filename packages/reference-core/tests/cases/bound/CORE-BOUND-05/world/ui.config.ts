// Config for the CORE-BOUND-05 world: one include over src/, with no sources of its own. The spec writes the 70 small
// files and the 2,000-deep file into a temp copy of this folder, so the committed world stays free of generated sources.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-05',
  include: ['src/**/*.{ts,tsx}'],
})
