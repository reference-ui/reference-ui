// Core config for the PRIM-08 world. It takes no input and emits the system
// name plus the fragment include globs the sync loop evaluates before serving.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-prim8',
  include: ['src/**/*.{js,ts,tsx}'],
})
