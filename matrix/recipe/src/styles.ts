import { recipe } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import type { RecipeVariantRecord } from '@reference-ui/types'

export const recipeMatrixConstants = {
  solidBackground: 'recipeMatrixSolidBackground',
  solidForeground: 'recipeMatrixSolidForeground',
  outlineBackground: 'recipeMatrixOutlineBackground',
  outlineForeground: 'recipeMatrixOutlineForeground',
  outlineBorder: 'recipeMatrixOutlineBorder',
  compoundBackground: 'recipeMatrixCompoundBackground',
  compoundForeground: 'recipeMatrixCompoundForeground',
  compoundBorder: 'recipeMatrixCompoundBorder',
} as const

tokens({
  colors: {
    [recipeMatrixConstants.solidBackground]: { value: '#2563eb' },
    [recipeMatrixConstants.solidForeground]: { value: '#ffffff' },
    [recipeMatrixConstants.outlineBackground]: { value: '#f8fafc' },
    [recipeMatrixConstants.outlineForeground]: { value: '#0f172a' },
    [recipeMatrixConstants.outlineBorder]: { value: '#94a3b8' },
    [recipeMatrixConstants.compoundBackground]: { value: '#fce7f3' },
    [recipeMatrixConstants.compoundForeground]: { value: '#be185d' },
    [recipeMatrixConstants.compoundBorder]: { value: '#ec4899' },
  },
})

const recipeMatrixButtonDefinition = {
  base: {
    padding: '2r',
    borderRadius: '12px',
    fontWeight: '600',
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: recipeMatrixConstants.solidBackground,
        color: recipeMatrixConstants.solidForeground,
      },
      outline: {
        backgroundColor: recipeMatrixConstants.outlineBackground,
        color: recipeMatrixConstants.outlineForeground,
        border: '1px solid',
        borderColor: recipeMatrixConstants.outlineBorder,
      },
    },
    tone: {
      teal: {},
      pink: {},
    },
    size: {
      sm: {
        fontSize: '14px',
      },
      lg: {
        fontSize: '18px',
      },
    },
  },
  compoundVariants: [
    {
      visual: 'outline',
      tone: 'pink',
      css: {
        backgroundColor: recipeMatrixConstants.compoundBackground,
        color: recipeMatrixConstants.compoundForeground,
        borderColor: recipeMatrixConstants.compoundBorder,
      },
    },
  ],
  defaultVariants: {
    visual: 'solid',
    tone: 'teal',
    size: 'sm',
  },
} as const

let recipeMatrixButtonRuntime: ReturnType<typeof recipe<typeof recipeMatrixButtonDefinition>> | undefined

function getRecipeMatrixButtonRuntime() {
  recipeMatrixButtonRuntime ??= recipe(recipeMatrixButtonDefinition)
  return recipeMatrixButtonRuntime
}

export function recipeMatrixButton(variants?: RecipeVariantRecord<typeof recipeMatrixButtonDefinition>): string {
  return getRecipeMatrixButtonRuntime()(variants)
}