import { defineTokens } from '@pandacss/dev'

/** Font tokens. Panda generates CSS vars from these values. */
export const fontTokens = defineTokens({
  fonts: {
    sans: {
      value: '"Inter", ui-serif, serif',
    },
    serif: {
      value: '"Literata", ui-sans-serif, sans-serif',
    },
    mono: {
      value: '"JetBrains Mono", ui-monospace, monospace',
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

/**
 * Default font-face rules using direct woff2 URLs from Google Fonts CDN.
 * These are the Latin subset variable fonts.
 */
export const defaultGlobalFontface = {
  // Inter - sans-serif variable font (latin subset)
  Inter: {
    src: 'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  // Literata - serif variable font (latin subset)
  Literata: {
    src: 'url(https://fonts.gstatic.com/s/literata/v40/or38Q6P12-iJxAIgLa78DkrbXsDgk0oVDaDlbJ5W7i5aOg.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
    descentOverride: '47%'

  },
  // JetBrains Mono - monospace variable font (latin subset)
  '"JetBrains Mono"': {
    src: 'url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2) format("woff2")',
    fontWeight: '100 800',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '101%',
  },

}

/** staticCss properties for font utilities */
export const fontStaticCssProperties = {
  fontSize: ['*'],
  fontWeight: ['*'],
  fontFamily: ['*'],
}
