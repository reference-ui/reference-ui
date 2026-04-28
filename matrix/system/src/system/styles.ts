import { globalCss, keyframes, tokens } from '@reference-ui/system'

export const systemMatrixConstants = {
  accentToken: 'systemMatrixAccent',
  accentValue: 'rgb(37, 99, 235)',
  animationName: 'systemMatrixFadeIn',
  globalVarName: '--system-matrix-global-var',
  globalVarValue: '42px',
  layerName: 'system',
} as const

tokens({
  colors: {
    [systemMatrixConstants.accentToken]: { value: systemMatrixConstants.accentValue },
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