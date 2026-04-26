import { tokens } from '@reference-ui/system'

/**
 * UI colors scoped to primitive surfaces / elements (`colors.ui.<scope>.*`).
 * Values intentionally repeat palette steps where semantics match but names stay local to each element.
 */
export const ui = {
  copy: {
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
  },

  selection: {
    background: { light: '{colors.gray.900}', dark: '{colors.gray.300}' },
    foreground: { light: '{colors.gray.50}', dark: '{colors.gray.800}' },
  },

  dialog: {
    background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  hr: {
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  meta: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  blockquote: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
    border: { light: '{colors.gray.300}', dark: '{colors.gray.700}' },
  },

  cite: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  small: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  code: {
    inline: {
      foreground: { light: '{colors.design.accent.foreground}', dark: '{colors.design.accent.foreground}' },
      background: { light: '{colors.design.accent.background}', dark: '{colors.design.accent.background}' },
      border: { light: '{colors.design.accent.border}', dark: '{colors.design.accent.border}' },
    },
  },

  kbd: {
    background: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
    shadowMix: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  },

  pre: {
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    background: { light: '{colors.gray.100}', dark: '{colors.gray.900}' },
    border: { light: '{colors.design.accent.border}', dark: '{colors.gray.800}' },
  },

  samp: {
    background: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.light}' },
  },

  link: {
    default: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
    hover: { light: '{colors.blue.800}', dark: '{colors.blue.300}' },
  },

  mark: {
    background: { light: '{colors.blue.200}', dark: '{colors.blue.950}' },
    foreground: { light: '{colors.blue.950}', dark: '{colors.blue.200}' },
  },

  ins: {
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    decoration: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
  },

  abbr: {
    textDecoration: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  del: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  dfn: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  q: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  s: {
    foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  u: {
    textDecoration: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
  },

  varTag: {
    foreground: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
  },

  list: {
    marker: {
      foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
    },
    definition: {
      description: {
        foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
      },
    },
  },

  fieldset: {
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  label: {
    controlAccent: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  },

  field: {
    border: { light: '{colors.gray.300}', dark: '{colors.gray.700}' },
    borderHover: { light: '{colors.gray.400}', dark: '{colors.gray.600}' },
    background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    focusRing: { light: '{colors.gray.400}', dark: '{colors.gray.500}' },
    placeholder: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
    controlAccent: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  },

  checkbox: {
    unchecked: {
      borderMix: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    },
    checked: {
      fill: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    },
    tick: {
      stroke: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    },
  },

  radio: {
    track: {
      background: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    },
    checked: {
      inner: {
        background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
      },
      ring: {
        border: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
      },
    },
  },

  button: {
    background: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    foreground: { light: '{colors.gray.50}', dark: '{colors.gray.950}' },
    disabled: {
      background: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
      foreground: { light: '{colors.design.text.lighter}', dark: '{colors.design.text.lighter}' },
    },
  },

  progress: {
    bar: {
      foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    },
    track: {
      mixForeground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
      mixBackground: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    },
  },

  meter: {
    optimum: {
      foreground: { light: '{colors.blue.600}', dark: '{colors.blue.400}' },
    },
    suboptimum: {
      foreground: { light: '{colors.amber.500}', dark: '{colors.amber.400}' },
    },
    evenLessGood: {
      foreground: { light: '{colors.red.600}', dark: '{colors.red.400}' },
    },
  },

  focus: {
    ring: { light: '{colors.gray.900}', dark: '{colors.gray.50}' },
  },

  table: {
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
    row: {
      mutedBackground: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    },
    footer: {
      mutedBackground: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    },
    cell: {
      foreground: { light: '{colors.design.text.base}', dark: '{colors.design.text.base}' },
    },
    caption: {
      foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
    },
  },

  media: {
    caption: {
      foreground: { light: '{colors.design.text.light}', dark: '{colors.design.text.light}' },
    },
    embed: {
      border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
    },
  },

  disclosure: {
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },
} as const

tokens({ colors: { ui } })
