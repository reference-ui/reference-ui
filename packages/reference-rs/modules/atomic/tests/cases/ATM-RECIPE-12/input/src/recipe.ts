import { recipe } from '@reference-ui/react'

declare const opaque: Record<string, string>
declare const sizes: Record<string, string>
declare const common: Record<string, string>
const sharedCompound = { tone: 'loud', css: { color: 'red' } }

export const byName = recipe({ className: 'byName', variants: opaque })

export const byAxis = recipe({ className: 'byAxis', variants: { size: sizes } })

export const spreadAxis = recipe({
  className: 'spreadAxis',
  variants: { size: { ...common, sm: { color: 'red' } } },
})

export const byEntry = recipe({
  className: 'byEntry',
  variants: { tone: { loud: { color: 'red' } } },
  compoundVariants: [{ tone: 'loud', css: { color: 'blue' } }, sharedCompound],
})

export const byStyle = recipe({
  className: 'byStyle',
  base: opaque,
  variants: { size: { sm: opaque } },
})

declare const key: string

export const byKey = recipe({
  className: 'byKey',
  variants: { [key]: { sm: { color: 'red' } } },
})

export const spreadEntry = recipe({
  className: 'spreadEntry',
  variants: { tone: { loud: { color: 'red' } } },
  compoundVariants: [{ ...sharedCompound, css: { color: 'blue' } }],
})

declare const dyn: Record<string, string>
const dynSizes = { sm: dyn }

export const dynamicItem = recipe({ className: 'dynamicItem', variants: { size: dynSizes } })

declare const compoundList: unknown[]

export const listCompound = recipe({
  className: 'listCompound',
  variants: { tone: { loud: { color: 'red' } } },
  compoundVariants: compoundList,
})

declare const axes: Record<string, unknown>

export const spreadTop = recipe({ className: 'spreadTop', variants: { ...axes } })
