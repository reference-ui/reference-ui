// Shared namer fixtures for the css() suites: one namer table set, the runtime artifact built over it, and the
// container class the suites expect. Suites register the artifact themselves; this module only defines the data.
import type { NamerTables, NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { NAMER_RULES_VERSION } from '@reference-ui/rust/namer'

export const TABLES: NamerTables = {
  rulesVersion: NAMER_RULES_VERSION,
  aliases: { p: 'padding', w: 'width' },
  prefixes: {
    backgroundColor: 'bg-c',
    backgroundImage: 'background-image',
    color: 'c',
    content: 'content',
    fontFamily: 'font-family',
    fontWeight: 'font-weight',
    opacity: 'op',
    outlineColor: 'outline-c',
    padding: 'p',
    width: 'w',
    zIndex: 'z',
  },
  lowerings: {
    font: [{ macro: 'font' }],
    weight: [{ macro: 'weight' }],
  },
  keywords: {},
  weightKeywords: [
    ['thin', '100'],
    ['light', '300'],
    ['normal', '400'],
    ['semibold', '600'],
    ['bold', '700'],
    ['black', '900'],
  ],
  colorProps: ['backgroundColor', 'color', 'outlineColor'],
  breakpoints: ['base', 'sm', 'md'],
  breakpointWidths: { sm: '640', md: '768' },
  conditions: ['_dark', '_hover', 'dark', 'hover'],
  fonts: {
    sans: {
      weight: 'normal',
      weights: {
        thin: '200',
        light: '300',
        normal: '400',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      css: [
        ['letterSpacing', '-0.01em'],
        ['fontWeight', 'normal'],
      ],
    },
    serif: {
      weight: 'normal',
      weights: {
        thin: '100',
        light: '300',
        normal: '373',
        semibold: '600',
        bold: '700',
        black: '900',
      },
      css: [
        ['letterSpacing', 'normal'],
        ['fontWeight', 'normal'],
      ],
    },
    mono: {
      weight: 'normal',
      weights: {
        thin: '100',
        light: '300',
        normal: '393',
        semibold: '600',
        bold: '700',
      },
      css: [
        ['letterSpacing', '-0.04em'],
        ['fontWeight', 'normal'],
      ],
    },
  },
}

export const ARTIFACT: NativeRuntimeArtifact = {
  schemaVersion: 2,
  namer: TABLES,
  recipes: {},
  stylePropNames: ['color', 'p', 'font', 'fontFamily', 'fontWeight', 'weight'],
}

export const CONTAINER_CLASS = 'test__[@container_(min-width:_320px)]:c_paper'
