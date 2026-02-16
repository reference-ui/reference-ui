import { staticCss, tokens, globalFontface } from '../api'

tokens({
  fonts: {
    sans: { value: '"Inter", ui-serif, serif' },
    serif: { value: '"Literata", ui-sans-serif, sans-serif' },
    mono: { value: '"JetBrains Mono", ui-monospace, monospace' },
  },
})

globalFontface({
  Inter: {
    src: 'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  Literata: {
    src: 'url(https://fonts.gstatic.com/s/literata/v40/or38Q6P12-iJxAIgLa78DkrbXsDgk0oVDaDlbJ5W7i5aOg.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
    descentOverride: '47%',
  },
  '"JetBrains Mono"': {
    src: 'url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2) format("woff2")',
    fontWeight: '100 800',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '101%',
  },
})

staticCss({
  css: [{ properties: { fontSize: ['*'], fontWeight: ['*'], fontFamily: ['*'] } }],
})
