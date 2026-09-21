import { recipe } from '@reference-ui/react'

export const button = recipe({
  className: 'button',
  base: { fontWeight: 'bold' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
      md: { fontSize: '16px' },
    },
    muted: {
      true: { opacity: '0.5' },
      false: { opacity: '1.0' },
    },
  },
  defaultVariants: {
    size: 'md',
    muted: 'false',
  },
})
button({ size: 'sm', muted: true })
