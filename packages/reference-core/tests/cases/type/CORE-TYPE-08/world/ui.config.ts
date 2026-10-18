// ui.config.ts — sync configuration for the CORE-TYPE-08 colors-only world.
// It takes the world src glob and emits the named system the runner syncs
// before the spec runs. Tokens stay colors-only so the generated declarations
// prove keys never depended on spacing or radii categories.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-type',
  include: ['src/**/*.{js,ts,tsx}'],
})
