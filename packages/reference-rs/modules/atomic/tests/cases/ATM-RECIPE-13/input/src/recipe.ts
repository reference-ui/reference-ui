import { recipe } from '@reference-ui/react'

declare const opaque: Record<string, unknown>
const sharedVariants = { size: { sm: { root: { color: 'red' } } } }
const sizes = { sm: { root: { color: 'blue' } } }
const common = { lg: { root: { color: 'green' } } }
const sharedCompound = { size: 'sm', css: { root: { color: 'blue' } } }

export const slotVariants = recipe({
  className: 'slotVariants',
  slots: ['root'],
  variants: sharedVariants,
})

export const slotAxis = recipe({
  className: 'slotAxis',
  slots: ['root'],
  variants: { size: sizes },
})

export const slotSpread = recipe({
  className: 'slotSpread',
  slots: ['root'],
  variants: { size: { ...common, sm: { root: { color: 'red' } } } },
})

export const slotEntry = recipe({
  className: 'slotEntry',
  slots: ['root'],
  base: { root: opaque },
})

export const slotMap = recipe({
  className: 'slotMap',
  slots: ['root'],
  base: opaque,
})

export const slotCompound = recipe({
  className: 'slotCompound',
  slots: ['root'],
  variants: { size: { sm: { root: { color: 'red' } } } },
  compoundVariants: [sharedCompound],
})

export const slotSpreadCompound = recipe({
  className: 'slotSpreadCompound',
  slots: ['root'],
  variants: { size: { sm: { root: { color: 'red' } } } },
  compoundVariants: [{ ...sharedCompound, css: { root: { color: 'blue' } } }],
})
