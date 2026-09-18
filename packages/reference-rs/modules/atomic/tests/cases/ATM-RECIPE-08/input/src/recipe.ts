import { recipe } from '@reference-ui/react'

// Inferred identity: the binding suffix declares the stem.
const chipRecipe = recipe({
  base: { display: 'inline-flex', alignItems: 'center' },
  variants: {
    tone: {
      soft: { backgroundColor: 'blue', color: 'white' },
      accent: { backgroundColor: 'black', color: 'yellow' },
    },
    radius: {
      pill: { borderRadius: '9999px' },
      rounded: { borderRadius: '4px' },
    },
  },
  defaultVariants: { tone: 'soft', radius: 'rounded' },
})

// Bare `Recipe` binding: nothing to infer, must refuse.
const Recipe = recipe({
  base: { color: 'red' },
})

// Non-suffixed binding: identity stays ambiguous, must refuse.
const plain = recipe({
  base: { color: 'green' },
})

void chipRecipe
void Recipe
void plain
