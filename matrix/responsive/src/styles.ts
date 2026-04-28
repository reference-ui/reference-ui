import { css, recipe } from '@reference-ui/react'

export const responsiveMatrixClasses = {
  sidebarCss: css({
    padding: '0px',
    backgroundColor: 'transparent',
    r: {
      200: {
        padding: '12px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
      },
    },
  }),
} as const

export const responsiveCardRecipe = recipe({
  base: {
    padding: '0px',
    backgroundColor: 'transparent',
    r: {
      300: {
        padding: '12px',
        backgroundColor: '#16a34a',
        color: '#ffffff',
      },
    },
  },
})