import { recipe } from '@reference-ui/react'

const badge = recipe({
  className: 'badge',
  base: { fontWeight: 'bold' },
  variants: {
    variant: {
      solid: { bg: 'blue', color: 'white' },
      outline: { border: '1px solid' },
    },
  },
  compoundVariants: [{ variant: 'solid', css: { opacity: '0.9' } }],
})
void badge
