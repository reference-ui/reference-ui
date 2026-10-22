import { recipe } from '@reference-ui/react'

declare const pick: () => string
let LET_DEF = 'md'
let LET_TONE = 'loud'

export const slotCallDefault = recipe({
  className: 'slotCallDefault',
  slots: ['root', 'title'],
  variants: {
    size: {
      sm: { root: { padding: '12px' }, title: { fontSize: '14px' } },
      md: { root: { padding: '16px' }, title: { fontSize: '16px' } },
    },
  },
  defaultVariants: { size: pick() },
})

export const slotLetDefault = recipe({
  className: 'slotLetDefault',
  slots: ['root', 'title'],
  variants: {
    size: {
      sm: { root: { padding: '12px' }, title: { fontSize: '14px' } },
      md: { root: { padding: '16px' }, title: { fontSize: '16px' } },
    },
  },
  defaultVariants: { size: LET_DEF },
})

export const slotCallTone = recipe({
  className: 'slotCallTone',
  slots: ['root', 'title'],
  variants: {
    size: { sm: { root: { padding: '12px' }, title: { fontSize: '14px' } } },
    tone: { loud: { root: { color: 'red' }, title: { color: 'red' } } },
  },
  compoundVariants: [
    {
      tone: pick(),
      size: 'sm',
      css: { root: { fontWeight: '700' }, title: { letterSpacing: '1px' } },
    },
  ],
})

export const slotLetTone = recipe({
  className: 'slotLetTone',
  slots: ['root', 'title'],
  variants: {
    size: { sm: { root: { padding: '12px' }, title: { fontSize: '14px' } } },
    tone: { loud: { root: { color: 'red' }, title: { color: 'red' } } },
  },
  compoundVariants: [
    {
      tone: LET_TONE,
      size: 'sm',
      css: { root: { fontWeight: '700' }, title: { letterSpacing: '1px' } },
    },
  ],
})
