import { recipe } from '@reference-ui/react'

export const watchRecipe = recipe({
  base: {
    color: 'white',
    padding: '16px',
    borderRadius: '12px',
  },
  variants: {
    tone: {
      solid: {
        backgroundColor: 'violet.600',
      },
    },
  },
})