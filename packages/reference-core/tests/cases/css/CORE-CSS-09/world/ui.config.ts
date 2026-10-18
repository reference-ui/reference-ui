// Core config for the CSS-09 world. It takes no input and emits the system
// name plus the fragment include globs the sync loop evaluates before serving.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-css9',
  include: ['src/**/*.{js,ts,tsx}'],
})
