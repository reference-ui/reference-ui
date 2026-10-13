# TST-CND-02 — A conditional whose check is a bare type parameter stays deferred, and a union reached through an alias is never distributed.

TypeScript defers `T extends string ? 'yes' : 'no'` while `T` is generic, so the emitted conditional keeps its
structure and has no `resolved` branch. It distributes over a union only when the checked type is a naked type
parameter. `Letters extends 'a' ? 1 : 2` with `Letters = 'a' | 'b'` is not distributive and resolves to `2`, while
`Narrow<Letters>` instantiates the naked parameter with the union and resolves to `1 | 2`.
