/**
 * Conditional types whose check type is a bare type parameter, or a union reached through an alias.
 */

/** The check type is a bare type parameter, so the conditional stays deferred. */
export type IsString<T> = T extends string ? 'yes' : 'no'

export type Letters = 'a' | 'b'

/** The check type is an alias union, which TypeScript does not distribute. */
export type NotDistributed = Letters extends 'a' ? 1 : 2

/** The naked type parameter is instantiated with the union, so it distributes over the members. */
export type Narrow<T> = T extends 'a' ? 1 : 2

export type Distributed = Narrow<Letters>
