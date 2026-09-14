/**
 * Mapped-type scenario: key binding, modifiers, remapping, and value type.
 * Used to verify structural TypeRef emission for mapped types.
 */

export interface Tokens {
  sm: string
  lg: string
}

/** Basic optional mapped type. */
export type OptionalTokens<T> = { [K in keyof T]?: T[K] }

/** Readonly mapped type with key remapping. */
export type TokenLabels<T> = { readonly [K in keyof T as `token-${K}`]: T[K] }

/** Interface members that use mapped types directly. */
export interface WithMappedTypes<T> {
  optional: { [K in keyof T]?: T[K] }
  labels: { readonly [K in keyof T as `token-${K}`]: T[K] }
}
