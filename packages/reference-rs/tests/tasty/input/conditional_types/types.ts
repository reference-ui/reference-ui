/**
 * Conditional-type scenario: structural conditional TypeRefs without evaluation.
 * Used to verify check/extends/true/false branches and member usage.
 */

export interface User {
  id: string
}

/** Simple conditional alias. */
export type IsString<T> = T extends string ? 'yes' : 'no'

/** Conditional alias using a reference branch. */
export type ToUser<T> = T extends object ? User : never

/** Interface members that use conditional types directly. */
export interface WithConditionals<T> {
  result: T extends string ? 'yes' : 'no'
  userish: T extends object ? User : never
}
