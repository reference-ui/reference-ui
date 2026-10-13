import { tokens } from '@reference-ui/system'

/**
 * Diagram palette. Chrome is the midnight slate ramp — the one environment every
 * panel belongs to. Tones are core: a panel says `blue.500/medium` and the amount
 * comes from the core scale. Only what a tone cannot express lives here: the
 * neutral chrome, the legible side of each family for tone text, and the one
 * docs-only strength below.
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
 * A docs-only strength for the near-solid marks: meter fills and window dots.
 * The core scale tops out at strong (18%), so a fill that must read as nearly
 * solid needs its own step. Both axes are 70% because no edge uses it.
 */
tokens({
  tones: {
    solid: { surface: { value: '70%' }, line: { value: '70%' } },
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
