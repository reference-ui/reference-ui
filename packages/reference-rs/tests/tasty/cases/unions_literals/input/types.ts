/**
 * Unions and literals scenario: union types, literal types, optional properties.
 * Used to test TypeRef::Union, TypeRef::Literal, and member optional: true.
 */

/** String literal union (discriminated union style). */
export type Status = 'pending' | 'success' | 'error';

/** Numeric literal union. */
export type LogLevel = 0 | 1 | 2 | 3;

/** Union of intrinsic types. */
export type StringOrNumber = string | number;

/** Union with literal and intrinsic. */
export type MaybeId = string | null;

/** Interface with optional and required members. */
export interface OptionalProps {
  /** Required name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Optional count (number). */
  count?: number;
}

/** Type alias that is a union of object types. */
export type ButtonVariant = { type: 'primary' } | { type: 'secondary'; outline: boolean };

/** Oxc coverage: intrinsic keywords we handle explicitly. */
export type BigintAlias = bigint;
export type SymbolAlias = symbol;
export type NeverAlias = never;
export type VoidAlias = void;
