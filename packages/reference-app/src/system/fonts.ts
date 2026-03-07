/**
 * Font definitions for the reference app
 * This demonstrates how users define fonts in their applications
 */

import { extendFont } from '@reference-ui/cli/config'

extendFont('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '200',
    light: '300',
    normal: '400',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: '-0.01em',
    fontWeight: 'normal',
  },
})

extendFont('serif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/literata/v40/or38Q6P12-iJxAIgLa78DkrbXsDgk0oVDaDlbJ5W7i5aOg.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
    descentOverride: '47%',
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
})

extendFont('mono', {
  value: '"JetBrains Mono", ui-monospace, monospace',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2) format("woff2")',
    fontWeight: '100 800',
    fontStyle: 'normal',
    fontDisplay: 'swap',
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
    letterSpacing: '-0.04em',
    fontWeight: 'normal',
  },
})
