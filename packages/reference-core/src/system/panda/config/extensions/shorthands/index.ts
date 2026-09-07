import { borderShorthandUtilities } from './border'
import { outlineShorthandUtilities } from './outline'

export * from './parser'
export * from './factory'
export * from './border'
export * from './outline'

export const shorthandUtilities = {
  ...borderShorthandUtilities,
  ...outlineShorthandUtilities,
}
