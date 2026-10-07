import { tokens } from '@reference-ui/system'

/**
 * Docs-only semantic colors (dark mode via Panda `dark` keys).
 * Collected by `ref sync` from ui.config `include` patterns.
 *
 * A single grayscale ramp — no tinted chrome. Surfaces, borders, and the
 * sidebar/topbar all resolve to the page background; separation is hairlines
 * only. `docsHighlight` is the one near-contrast step used for brand, links,
 * and the active nav state, and it is still gray.
 */
tokens({
  colors: {
    docsPageBg: {
      value: '#ffffff',
      dark: '{colors.gray.950}',
    },
    docsPanelBg: {
      value: '{colors.gray.50}',
      dark: '{colors.gray.900}',
    },
    docsBorder: {
      value: '{colors.gray.200}',
      dark: '{colors.gray.800}',
    },
    docsText: {
      value: '{colors.gray.950}',
      dark: '{colors.gray.50}',
    },
    docsMuted: {
      value: '{colors.gray.500}',
      dark: '{colors.gray.400}',
    },
    docsNavHeading: {
      value: '{colors.gray.400}',
      dark: '{colors.gray.500}',
    },
    docsHighlight: {
      value: '{colors.gray.900}',
      dark: '{colors.gray.100}',
    },
    docsActiveBg: {
      value: '{colors.gray.100}',
      dark: '{colors.gray.800}',
    },
    docsHoverBg: {
      value: '{colors.gray.100}',
      dark: '{colors.gray.900}',
    },
    docsControlBg: {
      value: 'rgba(255, 255, 255, 0.72)',
      dark: 'color-mix(in oklch, var(--colors-gray-900) 72%, transparent)',
    },
    docsControlBorder: {
      value: 'color-mix(in oklch, var(--colors-gray-950) 10%, transparent)',
      dark: 'rgba(255, 255, 255, 0.12)',
    },
    docsScrim: {
      value: 'color-mix(in oklch, var(--colors-gray-950) 44%, transparent)',
      dark: 'rgba(0, 0, 0, 0.62)',
    },
    docsInlineCodeBg: {
      value: '{colors.gray.100}',
      dark: '{colors.gray.800}',
    },
    docsBlockquoteBorder: {
      value: '{colors.gray.300}',
      dark: '{colors.gray.700}',
    },
    docsRing: {
      value: '{colors.gray.400}',
      dark: '{colors.gray.600}',
    },
  },
})
