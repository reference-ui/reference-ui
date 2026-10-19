// Config for the CORE-SITE-16 world. It takes no inputs beyond the sync
// defaults and emits the site-16 system plus the NSPanel concatenated host,
// so the member tag below extracts as a host; the unhosted twin lowers under own.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-16',
  include: ['src/**/*.{js,ts,tsx}'],
  jsxElements: ['NSPanel'],
})
