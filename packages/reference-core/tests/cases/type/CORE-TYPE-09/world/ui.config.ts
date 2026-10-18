// ui.config.ts — sync configuration for the CORE-TYPE-09 strict-colours world.
// It takes the world src glob and emits the named system with strict: ['colors'],
// the one list that narrows colour props and css() values to the colour surface.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-type',
  include: ['src/**/*.{js,ts,tsx}'],
  strict: ['colors'],
})
