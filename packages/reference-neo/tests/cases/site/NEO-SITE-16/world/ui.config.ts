// Config for the NEO-SITE-16 world. It takes no inputs beyond the sync
// defaults and emits the site-16 system plus the NSPanel concatenated host,
// so the member tag below extracts while the unhosted twin stays silent.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-16',
  include: ['src/**/*.{js,ts,tsx}'],
  jsxElements: ['NSPanel'],
})
