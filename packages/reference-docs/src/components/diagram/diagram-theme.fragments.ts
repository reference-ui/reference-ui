import { tokens } from '@reference-ui/system'

/**
 * Docs-only diagram tokens. The Diagram kit owns its surfaces outright so the
 * diagram look survives docs-chrome drift: canvas, panel, hairline, and arrow
 * shaft each resolve per color mode. Tones reuse the shared ramps through
 * color-mix washes (see Diagram.tsx), so only the accent text roles need
 * explicit light/dark pairs here.
 */
tokens({
  colors: {
    diagramCanvas: {
      value: '{colors.gray.100}',
      dark: '{colors.gray.900}',
    },
    diagramPanel: {
      value: '#ffffff',
      dark: '{colors.gray.950}',
    },
    diagramBorder: {
      value: '{colors.gray.200}',
      dark: '{colors.gray.800}',
    },
    diagramArrow: {
      value: '{colors.gray.400}',
      dark: '{colors.gray.500}',
    },
    diagramBlueText: {
      value: '{colors.blue.600}',
      dark: '{colors.blue.400}',
    },
    diagramGreenText: {
      value: '{colors.green.600}',
      dark: '{colors.green.400}',
    },
    diagramAmberText: {
      value: '{colors.amber.600}',
      dark: '{colors.amber.400}',
    },
    diagramRedText: {
      value: '{colors.red.600}',
      dark: '{colors.red.400}',
    },
    diagramVioletText: {
      value: '{colors.violet.600}',
      dark: '{colors.violet.400}',
    },
  },
})

/**
 * Diagram roundness. Cards sit between the docs shell (md) and a full pill:
 * generous enough to read as diagram surfaces, tight enough to stay quiet.
 */
tokens({
  radii: {
    diagramPanel: { value: '0.875rem' },
    diagramCanvas: { value: '1.25rem' },
  },
})
