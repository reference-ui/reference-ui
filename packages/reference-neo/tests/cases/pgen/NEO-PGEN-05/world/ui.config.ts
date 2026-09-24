// Neo config for the PGEN-05 world. It takes no input and emits the system
// name plus the fragment include globs the sync loop evaluates before serving.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-pgen5',
  include: ['src/**/*.{js,ts,tsx}'],
})
