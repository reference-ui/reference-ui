import { font, globalCss, keyframes, tokens } from '@reference-ui/system'

export const systemMatrixConstants = {
  accentToken: 'systemMatrixAccent',
  accentValue: 'rgb(37, 99, 235)',
  animationName: 'systemMatrixFadeIn',
  fontDisplay: 'swap',
  fontFaceFamily: 'Inter',
  fontLetterSpacingValue: '-0.01em',
  fontName: 'sans',
  fontValue: '"Inter", ui-sans-serif, sans-serif',
  fontWeight: 'bold',
  globalVarName: '--system-matrix-global-var',
  globalVarValue: '42px',
  layerName: 'system',
} as const

tokens({
  colors: {
    [systemMatrixConstants.accentToken]: { value: systemMatrixConstants.accentValue },
  },
})

font(systemMatrixConstants.fontName, {
  value: systemMatrixConstants.fontValue,
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: systemMatrixConstants.fontDisplay,
  },
  weights: {
    normal: '400',
    [systemMatrixConstants.fontWeight]: '700',
  },
  css: {
    letterSpacing: systemMatrixConstants.fontLetterSpacingValue,
  },
})

globalCss({
  ':root': {
    [systemMatrixConstants.globalVarName]: systemMatrixConstants.globalVarValue,
  },
  body: {
    margin: '0',
  },
})

keyframes({
  [systemMatrixConstants.animationName]: {
    from: {
      opacity: '0',
      transform: 'translateY(8px)',
    },
    to: {
      opacity: '1',
      transform: 'translateY(0px)',
    },
  },
})