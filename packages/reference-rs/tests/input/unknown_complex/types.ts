/**
 * Unknown/complex scenario: mapped types and conditional types become Unknown with summary.
 * We do not fully model these; the scanner should emit kind: "unknown" with a summary string.
 */

/** Simple interface for testing reference from complex type. */
export interface User {
  id: string;
  name: string;
}

/** Mapped type: all keys of T become optional. Partial<T> style. */
export type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

/** Conditional type: picks string keys from T. */
export type StringKeys<T> = T extends object
  ? { [K in keyof T as K extends string ? K : never]: T[K] }
  : never;

/** Type alias that references the mapped type (so we see Unknown in a member). */
export interface UsesOptionalKeys {
  /** User with all keys optional (mapped type). */
  partialUser: OptionalKeys<User>;
}
