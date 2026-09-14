/**
 * Default type parameters scenario.
 * Type parameters with default (e.g. T = string) are emitted in the bundle.
 */

/** Type alias with default type parameter. */
export type WithDefault<T = string> = {
  value: T;
};

/** Interface with default type parameter. */
export interface KeyValue<K = string, V = unknown> {
  key: K;
  value: V;
}

/** Multiple params, only some with defaults. */
export type PartialDefault<T, U = number> = {
  a: T;
  b: U;
};
