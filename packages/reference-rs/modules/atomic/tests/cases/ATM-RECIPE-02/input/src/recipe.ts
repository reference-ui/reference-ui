import { recipe } from '@reference-ui/react'

const button = recipe({
  className: 'button',
  base: { fontWeight: 'bold' },
  variants: {
    variant: {
      solid: { bg: 'blue', color: 'white' },
      outline: { border: '1px solid' },
    },
  },
  compoundVariants: [{ variant: 'solid', css: { opacity: '0.9' } }],
})
button({ variant: 'solid' })
