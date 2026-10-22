import { recipe } from '@reference-ui/react'

const baseStyles = { color: 'red' }
const smStyles = { fontSize: '12px' }
const common = { lg: { fontSize: '20px' } }
const tones = { loud: { color: 'blue' } }
const shared = { size: { sm: { fontSize: '12px' } } }
const rootCss = { fontWeight: '600' }
const rootStyles = { display: 'flex' }

export const chip = recipe({
  className: 'chip',
  base: baseStyles,
  variants: {
    size: { ...common, sm: smStyles },
    tone: tones,
  },
})

export const badge = recipe({ className: 'badge', variants: shared })

export const pill = recipe({
  className: 'pill',
  variants: { tone: { loud: { color: 'blue' } } },
  compoundVariants: [{ tone: 'loud', css: rootCss }],
})

export const card = recipe({
  className: 'card',
  slots: ['root', 'title'],
  base: { root: rootStyles, title: { fontWeight: '600' } },
  variants: { size: { sm: { root: { padding: '12px' } } } },
})

chip({ size: 'sm', tone: 'loud' })
chip({ size: 'lg' })
badge({ size: 'sm' })
pill({ tone: 'loud' })
card({ size: 'sm' })

export const lamp = recipe({ className: 'lamp', variants: { ...shared } })

lamp({ size: 'sm' })
