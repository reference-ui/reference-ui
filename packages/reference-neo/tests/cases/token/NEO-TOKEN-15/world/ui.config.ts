// Config for the TOKEN-15 world. It takes the neo config surface and emits
// a single-system sync rooted at src. The fragments live beside the entry,
// so the documented one-liner is the only authoring the spec proves.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-token15',
  include: ['src/**/*.{js,ts,tsx}'],
})
