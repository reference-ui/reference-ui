/**
 * Type-operator scenario: keyof, readonly, and unique symbol.
 * Used to verify structural TypeRef emission for TS type operators.
 */

/** Base shape used by keyof and readonly operator tests. */
export interface User {
  id: string;
  name: string;
}

/** Type operator alias using keyof. */
export type KeysOfUser = keyof User;

/** Type operator alias using readonly on an array type. */
export type ReadonlyUsers = readonly User[];

/** Interface members that use type operators directly. */
export interface WithOperators {
  key: keyof User;
  frozenUsers: readonly User[];
  readonly token: unique symbol;
}
