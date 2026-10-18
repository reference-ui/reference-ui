// Config for the TOKEN-15 world. It takes the core config surface and emits
// a single-system sync rooted at src. The fragments live beside the entry,
// so the documented one-liner is the only authoring the spec proves.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token15',
  include: ['src/**/*.{js,ts,tsx}'],
})
