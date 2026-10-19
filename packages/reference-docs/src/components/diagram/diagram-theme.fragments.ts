// Diagram palette tokens collected by ref sync.
// It declares the midnight-slate canvas chrome, the six semantic tones on the core scale,
// and the legible inks. Imported for its side effects by the Diagram kit.
import { tokens } from '@reference-ui/system'

/**
 * Diagram palette. Chrome is the midnight slate ramp — the one environment every
 * panel belongs to. Tones are core: a panel says `blue.500/medium` and the amount
 * comes from the core scale. Tints never sit on tints: a toned panel sits on the
 * canvas and everything inside it is neutral (see DESIGN.md). What a tone cannot
 * express lives here: the neutral chrome, the legible inks, and one docs-only
 * strength for near-solid marks.
 */

tokens({
  colors: {
    /* Chrome — the neutral environment every panel belongs to. */
    diagramCanvas: { value: '{colors.slate.100}', dark: '{colors.slate.950}' },
    diagramPanel: { value: '#ffffff', dark: '{colors.slate.900}' },
    diagramBorder: { value: '{colors.slate.200}', dark: '{colors.slate.800}' },
    diagramArrow: { value: '{colors.slate.400}', dark: '{colors.slate.500}' },
    /* Inset content on a panel — code chips, pills, trays and stage numbers. */
    diagramChip: { value: '{colors.slate.100}', dark: '{colors.slate.800}' },

    /*
     * Tone text. Light steps to 700; amber takes 800 because 700 computes to
     * about 4.3:1 on its tinted panel. Dark stays at 400. See DESIGN.md.
     */
    diagramBlueText: { value: '{colors.blue.700}', dark: '{colors.blue.400}' },
    diagramGreenText: { value: '{colors.green.700}', dark: '{colors.green.400}' },
    diagramAmberText: { value: '{colors.amber.800}', dark: '{colors.amber.400}' },
    diagramRedText: { value: '{colors.red.700}', dark: '{colors.red.400}' },
    diagramVioletText: { value: '{colors.violet.700}', dark: '{colors.violet.400}' },

    /* Secondary copy. gray.600 clears 4.5:1 on the canvas and on tints in light
     * (docsMuted's gray.500 does not). Dark matches docsMuted. */
    diagramMuted: { value: '{colors.gray.600}', dark: '{colors.gray.400}' },
  },
})

/**
 * Docs-only tone for meter fills and window dots. The core scale stops at strong
 * (18%), so a mark that must read as nearly solid needs its own step. Both axes
 * are 70% because no edge uses it.
 */
tokens({
  tones: {
    fill: { surface: { value: '70%' }, line: { value: '70%' } },
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
