import { recipe } from '@reference-ui/react'
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
  layeredGlobalBorderColor: 'rgb(185, 28, 28)',
  layeredGlobalColor: 'rgb(220, 38, 38)',
  layeredRecipeBackground: 'rgb(254, 240, 138)',
  layeredRecipeColor: 'rgb(22, 101, 52)',
  radiusToken: 'system-matrix-radius',
  radiusValue: '0.75rem',
  spacingToken: 'system-matrix-spacing',
  spacingValue: '1.25rem',
} as const

tokens({
  colors: {
    [systemMatrixConstants.accentToken]: { value: systemMatrixConstants.accentValue },
  },
  spacing: {
    [systemMatrixConstants.spacingToken]: { value: systemMatrixConstants.spacingValue },
  },
  radii: {
    [systemMatrixConstants.radiusToken]: { value: systemMatrixConstants.radiusValue },
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
  '[data-testid="system-layered-target"]': {
    color: systemMatrixConstants.layeredGlobalColor,
    borderTopStyle: 'solid',
    borderTopWidth: '4px',
    borderTopColor: systemMatrixConstants.layeredGlobalBorderColor,
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

export const systemLayeredRecipe = recipe({
  base: {
    color: systemMatrixConstants.layeredRecipeColor,
    backgroundColor: systemMatrixConstants.layeredRecipeBackground,
  },
})