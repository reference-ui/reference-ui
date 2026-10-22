import { recipe } from '@reference-ui/react'

declare const pick: () => string
let LET_DEF = 'md'
let LET_TONE = 'loud'

export const callDefault = recipe({
  className: 'callDefault',
  variants: { size: { sm: { fontSize: '12px' }, md: { fontSize: '14px' } } },
  defaultVariants: { size: pick() },
})

export const letDefault = recipe({
  className: 'letDefault',
  variants: { size: { sm: { fontSize: '12px' }, md: { fontSize: '14px' } } },
  defaultVariants: { size: LET_DEF },
})

export const callTone = recipe({
  className: 'callTone',
  variants: {
    size: { sm: { fontSize: '12px' } },
    tone: { loud: { color: 'red' } },
  },
  compoundVariants: [{ tone: pick(), size: 'sm', css: { fontWeight: '700' } }],
})

export const letTone = recipe({
  className: 'letTone',
  variants: {
    size: { sm: { fontSize: '12px' } },
    tone: { loud: { color: 'red' } },
  },
  compoundVariants: [{ tone: LET_TONE, size: 'sm', css: { fontWeight: '700' } }],
})

export const callList = recipe({
  className: 'callList',
  variants: {
    size: { sm: { fontSize: '12px' } },
    tone: { loud: { color: 'red' } },
  },
  compoundVariants: [{ tone: ['loud', pick()], size: 'sm', css: { fontWeight: '700' } }],
})

const DEFAULTS = { size: 'md' }

export const namedDefaults = recipe({
  className: 'namedDefaults',
  variants: { size: { sm: { fontSize: '12px' }, md: { fontSize: '14px' } } },
  defaultVariants: DEFAULTS,
})

export const spreadDefaults = recipe({
  className: 'spreadDefaults',
  variants: { size: { sm: { fontSize: '12px' }, md: { fontSize: '14px' } } },
  defaultVariants: { ...DEFAULTS },
})
