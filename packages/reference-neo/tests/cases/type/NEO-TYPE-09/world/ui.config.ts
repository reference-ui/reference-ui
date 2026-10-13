// ui.config.ts — sync configuration for the NEO-TYPE-09 strict-colours world.
// It takes the world src glob and emits the named system with strict: ['colors'],
// the one list that narrows colour props and css() values to the colour surface.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-type',
  include: ['src/**/*.{js,ts,tsx}'],
  strict: ['colors'],
})
