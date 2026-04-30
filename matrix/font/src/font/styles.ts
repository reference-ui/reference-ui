import { font } from '@reference-ui/system'

export const fontMatrixConstants = {
  compoundWeight: 'sans.bold',
  fontDisplay: 'swap',
  monoFamily: 'JetBrains Mono',
  monoLetterSpacing: '-0.04em',
  monoName: 'mono',
  sansFamily: 'Inter',
  sansLetterSpacing: '-0.01em',
  sansName: 'sans',
  serifDescentOverride: '47%',
  serifFamily: 'Literata',
  serifName: 'serif',
  serifSizeAdjust: '104%',
} as const

export const fontMatrixDefinitions = {
  [fontMatrixConstants.sansName]: {
    value: '"Inter", ui-sans-serif, sans-serif',
    fontFace: [
      {
        src: 'url(/fonts/inter.woff2) format("woff2")',
        fontWeight: '100 900',
        fontStyle: 'normal',
        fontDisplay: fontMatrixConstants.fontDisplay,
      },
      {
        src: 'url(/fonts/inter-italic.woff2) format("woff2")',
        fontWeight: '100 900',
        fontStyle: 'italic',
        fontDisplay: fontMatrixConstants.fontDisplay,
      },
    ],
    weights: {
      thin: '200',
      light: '300',
      normal: '400',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    css: {
      letterSpacing: fontMatrixConstants.sansLetterSpacing,
      fontWeight: 'normal',
    },
  },
  [fontMatrixConstants.serifName]: {
    value: '"Literata", ui-serif, serif',
    fontFace: {
      src: 'url(/fonts/literata.woff2) format("woff2")',
      fontWeight: '200 900',
      fontStyle: 'normal',
      fontDisplay: fontMatrixConstants.fontDisplay,
      sizeAdjust: fontMatrixConstants.serifSizeAdjust,
      descentOverride: fontMatrixConstants.serifDescentOverride,
    },
    weights: {
      thin: '100',
      light: '300',
      normal: '373',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    css: {
      letterSpacing: 'normal',
      fontWeight: 'normal',
    },
  },
  [fontMatrixConstants.monoName]: {
    value: '"JetBrains Mono", ui-monospace, monospace',
    fontFace: {
      src: 'url(/fonts/jetbrains-mono.woff2) format("woff2")',
      fontWeight: '100 800',
      fontStyle: 'normal',
      fontDisplay: fontMatrixConstants.fontDisplay,
      sizeAdjust: '101%',
    },
    weights: {
      thin: '100',
      light: '300',
      normal: '393',
      semibold: '600',
      bold: '700',
    },
    css: {
      letterSpacing: fontMatrixConstants.monoLetterSpacing,
      fontWeight: 'normal',
    },
  },
} as const

for (const [name, options] of Object.entries(fontMatrixDefinitions)) {
  font(name, options)
}