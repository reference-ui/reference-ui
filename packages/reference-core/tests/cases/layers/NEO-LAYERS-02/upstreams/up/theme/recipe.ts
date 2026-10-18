// Recipe fragment for the NEO-LAYERS-02 upstream. It takes one badge recipe with a size
// axis whose base paints the ink token, and emits the recipe definition the consumer
// adopts only under extends.

import { recipe } from '@reference-ui/neo'

recipe({
  className: 'layBadge',
  base: { color: 'upInk' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '20px' },
    },
  },
  defaultVariants: { size: 'sm' },
})
