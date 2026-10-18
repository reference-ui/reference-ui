// Core config for the GLOBAL-09 world. It takes no input and emits the system
// name plus the fragment include globs the sync loop evaluates before serving.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-global9',
  include: ['src/**/*.{js,ts,tsx}'],
})
