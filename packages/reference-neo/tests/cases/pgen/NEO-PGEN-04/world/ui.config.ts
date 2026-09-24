// Neo config for the PGEN-04 world. It takes no input and emits the system
// name plus the fragment include globs the sync loop evaluates before serving.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-pgen4',
  include: ['src/**/*.{js,ts,tsx}'],
})
