/**
 * Concrete conditionals whose operands are any, unknown, never or a fractional number.
 */

/** `any` as the check type: TypeScript answers both branches, so tasty leaves it unresolved. */
export type AnyOperand = any extends string ? 'yes' : 'no'

/** Everything extends unknown. */
export type UnknownExtends = string extends unknown ? 'yes' : 'no'

/** `never` as the check type: a naked parameter would distribute to never, so it stays unresolved. */
export type NeverOperand = never extends string ? 'yes' : 'no'

/** A fractional literal is a number. */
export type FractionOperand = 1.5 extends number ? 'yes' : 'no'

/** A string is not a number. */
export type StringNotNumber = string extends number ? 'yes' : 'no'
