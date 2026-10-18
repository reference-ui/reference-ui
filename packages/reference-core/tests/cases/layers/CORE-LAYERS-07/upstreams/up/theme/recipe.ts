// Recipe fragment for the CORE-LAYERS-07 layered upstream. It takes one badge recipe
// whose base paints the upstream ink, so the layer's own rule resolves that token inside
// its block while the consumer's raw names never do. The consumer never uses the recipe.

import { recipe } from '@reference-ui/core'

recipe({
  className: 'upBadge',
  base: { color: 'upInk' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '20px' },
    },
  },
  defaultVariants: { size: 'sm' },
})
