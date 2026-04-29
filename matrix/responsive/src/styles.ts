import { css, recipe } from '@reference-ui/react'

export const responsiveViewportConstants = {
  cssActiveBackground: '#7c3aed',
  cssActivePadding: '24px',
  cssBreakpointWidth: 800,
  recipeActiveBackground: '#0f766e',
  recipeActivePadding: '16px',
  recipeBreakpointHeight: 700,
  viewportForeground: '#ffffff',
} as const

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
  viewportCss: css({
    padding: '0px',
    backgroundColor: 'transparent',
    '@media (min-width: 800px)': {
      padding: responsiveViewportConstants.cssActivePadding,
      backgroundColor: responsiveViewportConstants.cssActiveBackground,
      color: responsiveViewportConstants.viewportForeground,
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

export const responsiveViewportRecipe = recipe({
  base: {
    padding: '0px',
    backgroundColor: 'transparent',
    '@media (min-height: 700px)': {
      padding: responsiveViewportConstants.recipeActivePadding,
      backgroundColor: responsiveViewportConstants.recipeActiveBackground,
      color: responsiveViewportConstants.viewportForeground,
    },
  },
})
