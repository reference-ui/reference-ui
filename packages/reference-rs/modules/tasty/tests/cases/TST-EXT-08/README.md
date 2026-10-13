# TST-EXT-08 — heritage-alias: an extends clause binds the type parameters of an object type alias it names, through a generic parent too

`interface UseAlias extends Alias<number>` inherits the members of `type Alias<A> = { a: A; b: A[] }`. The inherited
members must show the clause's argument: `a` is `number` and `b` is `number[]`. A generic parent that names the alias,
`interface Outer<T> extends Alias<T>`, passes its own argument down, so `interface UseOuter extends Outer<string>`
inherits `string` members. No inherited member may keep a type-parameter reference after the projection.
