import { recipe } from '@reference-ui/react'

export const observed = recipe({
  className: 'observed',
  base: { display: 'inline-flex' },
  variants: {
    tone: {
      loud: { color: 'white' },
      quiet: { color: 'black' },
    },
  },
  defaultVariants: { tone: 'quiet' },
})

export const uncalled = recipe({
  className: 'uncalled',
  base: { display: 'block' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
    },
  },
})

export const dynamic = recipe({
  className: 'dynamic',
  base: { display: 'grid' },
  variants: {
    shade: {
      light: { color: 'white' },
      dark: { color: 'black' },
    },
  },
})

export const ghost = recipe({
  className: 'ghost',
  base: { display: 'contents' },
  variants: {
    kind: {
      plain: { color: 'gray' },
    },
  },
})

recipe({
  className: 'bare',
  base: { display: 'inline' },
})
