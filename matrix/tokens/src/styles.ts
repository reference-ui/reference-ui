import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

export const tokensMatrixConstants = {
  primaryToken: 'matrixPrimaryToken',
  primaryValue: '#2563eb',
  mutedToken: 'matrixMutedToken',
  mutedValue: '#94a3b8',
} as const

tokens({
  colors: {
    [tokensMatrixConstants.primaryToken]: { value: tokensMatrixConstants.primaryValue },
    [tokensMatrixConstants.mutedToken]: { value: tokensMatrixConstants.mutedValue },
  },
})

export const tokensMatrixClasses = {
  card: css({
    color: tokensMatrixConstants.primaryToken,
    backgroundColor: tokensMatrixConstants.mutedToken,
  }),
} as const