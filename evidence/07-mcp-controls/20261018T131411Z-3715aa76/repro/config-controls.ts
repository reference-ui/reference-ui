import { defineConfig } from '@reference-ui/core'

// Both spellings are documented in docs/mcp.md and docs/mcp-tools.md.
export const libraryDisabled = defineConfig({
  name: 'mcp-controls-repro',
  include: ['src/**/*.{ts,tsx}'],
  use_reference_library: false,
})

export const iconsDisabled = defineConfig({
  name: 'mcp-controls-repro',
  include: ['src/**/*.{ts,tsx}'],
  use_reference_icons: false,
})
