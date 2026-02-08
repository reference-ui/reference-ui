import { defineTokens } from '@pandacss/dev'

/** Font tokens. Panda generates CSS vars from these values. */
export const fontTokens = defineTokens({
  fonts: {
    sans: {
      value: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    serif: {
      value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    },
    mono: {
      value: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "Courier New", monospace',
    },
  },
  fontSizes: {
    body: { value: '1rem' },
    h1: { value: '2.5rem' },
    h2: { value: '2rem' },
    h3: { value: '1.75rem' },
    h4: { value: '1.5rem' },
    h5: { value: '1.25rem' },
    h6: { value: '1rem' },
    small: { value: '0.875rem' },
    xs: { value: '0.75rem' },
  },
})

/** staticCss properties for font utilities */
export const fontStaticCssProperties = {
  fontSize: ['*'],
  fontWeight: ['*'],
  fontFamily: ['*'],
}
