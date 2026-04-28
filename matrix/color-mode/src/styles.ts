import { tokens } from '@reference-ui/system'

export const colorModeMatrixConstants = {
  tokenName: 'matrixColorModeToken',
  lightValue: '#dbeafe',
  darkValue: '#1e293b',
} as const

tokens({
  colors: {
    [colorModeMatrixConstants.tokenName]: {
      value: colorModeMatrixConstants.lightValue,
      dark: colorModeMatrixConstants.darkValue,
    },
  },
})