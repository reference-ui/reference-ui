# TST-GEN-04 — generic-default: a default that names an earlier type parameter evaluates to that parameter's argument, never to a top-level symbol

`type Two<A, B = A>` names its earlier parameter `A` in the default of `B`, and the file also declares a top-level
`A`. TypeScript evaluates that default where `A` is the parameter, so `Two<number>` gives `second: number`. The
top-level `A` must never capture the default, and no dependency on it may appear.
Covers three forms: the supplied argument (`UseTwo = Two<number>`, where `B` falls back to `A`); the chain where
every parameter takes its default (`Two2<A = string, B = A>` used bare as `UseTwoBare`, so both members are
`string`); and a default that is an object naming `A` (`Nest<A, B = { inner: A }>` as `UseNest = Nest<string>`).
The declaration's own default `B = A` keeps naming the parameter, not the top-level symbol.
