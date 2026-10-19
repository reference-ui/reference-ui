import { recipe, type RecipeVariantProps } from '@reference-ui/react'

const button = recipe({
  className: 'responsive-type-repro',
  variants: {
    size: {
      sm: { padding: 'launch.card' },
      lg: { padding: 'launch.roomy' },
    },
  },
})

// Scalar control: accepted.
button({ size: 'sm' })

// Documented in docs/system/recipes.mdx, “Responsive variants”.
button({ size: { base: 'sm', md: 'lg' } })

// The documented reusable-component inference has the same restriction.
const responsive: RecipeVariantProps<typeof button> = {
  size: { base: 'sm', md: 'lg' },
}
void responsive
