import { tokens } from '@reference-ui/system'

/**
 * UI colors scoped to primitive surfaces / elements (`colors.ui.<scope>.*`).
 * Values intentionally repeat palette steps where semantics match but names stay local to each element.
 */
export const ui = {
  copy: {
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  },

  dialog: {
    background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  hr: {
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  meta: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  blockquote: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
    border: { light: '{colors.gray.300}', dark: '{colors.gray.700}' },
  },

  cite: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  small: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  code: {
    inline: {
      foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
      background: { light: '{colors.gray.100}', dark: '{colors.gray.900}' },
    },
  },

  kbd: {
    background: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
    shadowMix: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
  },

  pre: {
    background: { light: '{colors.gray.100}', dark: '{colors.gray.900}' },
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    border: { light: '{colors.gray.200}', dark: '{colors.gray.800}' },
  },

  samp: {
    background: { light: '{colors.gray.100}', dark: '{colors.gray.800}' },
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
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
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    decoration: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
  },

  abbr: {
    textDecoration: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  del: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  dfn: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  q: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  s: {
    foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  u: {
    textDecoration: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
  },

  varTag: {
    foreground: { light: '{colors.blue.700}', dark: '{colors.blue.400}' },
  },

  list: {
    marker: {
      foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
    },
    definition: {
      description: {
        foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
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
    border: { light: '{colors.gray.200}', dark: '{colors.gray.700}' },
    background: { light: 'oklch(100% 0 0)', dark: '{colors.gray.950}' },
    foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
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

  focus: {
    ring: { light: '{colors.gray.400}', dark: '{colors.gray.50}' },
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
      foreground: { light: '{colors.gray.950}', dark: '{colors.gray.50}' },
    },
    caption: {
      foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
    },
  },

  media: {
    caption: {
      foreground: { light: '{colors.gray.500}', dark: '{colors.gray.400}' },
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
