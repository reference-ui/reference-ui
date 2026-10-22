import { recipe } from '@reference-ui/react'

const LOUD = 'loud'
const DEF = 'md'
const ON = true

export const chip = recipe({
  className: 'chip',
  variants: {
    size: { sm: { fontSize: '12px' }, md: { fontSize: '14px' } },
    tone: { loud: { color: 'red' }, quiet: { color: 'gray' } },
  },
  defaultVariants: { size: DEF },
  compoundVariants: [{ tone: LOUD, size: 'sm', css: { fontWeight: '700' } }],
})

export const tag = recipe({
  className: 'tag',
  variants: {
    tone: { loud: { color: 'red' }, quiet: { color: 'gray' } },
  },
  compoundVariants: [{ tone: LOUD, css: { textDecoration: 'underline' } }],
})

export const pill = recipe({
  className: 'pill',
  variants: {
    on: { true: { opacity: '1' }, false: { opacity: '0.5' } },
    tone: { loud: { color: 'red' }, quiet: { color: 'gray' } },
  },
  compoundVariants: [{ on: ON, tone: LOUD, css: { fontWeight: '700' } }],
})

export const card = recipe({
  className: 'card',
  slots: ['root', 'title'],
  variants: {
    size: {
      sm: { root: { padding: '12px' }, title: { fontSize: '14px' } },
      md: { root: { padding: '16px' }, title: { fontSize: '16px' } },
    },
    tone: {
      loud: { root: { color: 'red' } },
      quiet: { root: { color: 'gray' } },
    },
  },
  defaultVariants: { size: DEF },
  compoundVariants: [
    {
      tone: LOUD,
      size: 'sm',
      css: { root: { fontWeight: '700' }, title: { letterSpacing: '1px' } },
    },
  ],
})

chip({ tone: 'loud' })
tag({ tone: 'loud' })
pill({ on: true, tone: 'loud' })
card({ tone: 'loud' })
