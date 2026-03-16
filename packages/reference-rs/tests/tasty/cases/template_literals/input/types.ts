/**
 * Template-literal scenario: text and interpolated type parts.
 * Used to verify structural TypeRef emission for template literal types.
 */

export interface Tokens {
  sm: string
  lg: string
}

/** Template literal alias using a union interpolation. */
export type SizeVariant = `size-${'sm' | 'lg'}`

/** Template literal alias using a nested type operator interpolation. */
export type TokenKeyLabel = `token-${keyof Tokens}`

/** Interface members that use template literal types directly. */
export interface WithTemplateLiterals {
  size: `size-${'sm' | 'lg'}`
  label: `token-${keyof Tokens}`
}
