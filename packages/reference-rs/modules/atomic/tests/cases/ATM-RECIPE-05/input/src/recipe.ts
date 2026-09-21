import { recipe } from '@reference-ui/react'

export const button = recipe({
  className: 'button',
  base: { padding: '10px' },
  variants: {
    size: {
      lg: { fontSize: '20px', padding: '20px' },
    },
    tone: {
      danger: { color: 'red', padding: '15px' },
    },
  },
  compoundVariants: [
    {
      size: 'lg',
      tone: 'danger',
      css: { padding: '25px', borderColor: 'darkred' },
    },
  ],
})
button({ size: 'lg', tone: 'danger' })
