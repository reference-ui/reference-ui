import { tokens } from '@reference-ui/system'

/**
 * Diagram palette. Chrome is the midnight slate ramp — the one environment every
 * panel belongs to. Tones are not tokens of their own: `DiagramPanel` composites
 * a whisper of a family over `diagramPanel` at a chosen intensity, so the hue
 * vocabulary stays in the component and the palette stays small. Only the two
 * things a composite cannot express live here: the neutral chrome, and the
 * legible side of each family for tone text.
 */

tokens({
  colors: {
    /* Chrome — the neutral environment every panel belongs to. */
    diagramCanvas: { value: '{colors.slate.100}', dark: '{colors.slate.950}' },
    diagramPanel: { value: '#ffffff', dark: '{colors.slate.900}' },
    diagramBorder: { value: '{colors.slate.200}', dark: '{colors.slate.800}' },
    diagramArrow: { value: '{colors.slate.400}', dark: '{colors.slate.500}' },
    /* Inset content on a panel — code chips and blocks. */
    diagramChip: { value: '{colors.slate.100}', dark: '{colors.slate.800}' },

    /* Tone text — the legible side of each ramp. */
    diagramBlueText: { value: '{colors.blue.600}', dark: '{colors.blue.400}' },
    diagramGreenText: { value: '{colors.green.600}', dark: '{colors.green.400}' },
    diagramAmberText: { value: '{colors.amber.600}', dark: '{colors.amber.400}' },
    diagramRedText: { value: '{colors.red.600}', dark: '{colors.red.400}' },
    diagramVioletText: { value: '{colors.violet.600}', dark: '{colors.violet.400}' },
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
