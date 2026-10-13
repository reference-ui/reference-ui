# TST-EXT-06 — heritage-projection: an extends clause binds the parent's type parameters in its inherited members, through a generic parent too

`interface UseHolder extends Holder<number>` inherits `first: A` and `second: B` from `Holder<A, B = A>`. The
inherited members must show the clause's argument: `first` and `second` are both `number`, since `B` defaults to
`A`. The declaration `Holder` keeps its own parameters, because no argument binds them.
`interface UseOuter extends Outer<string>` goes through a generic parent, `Outer<T> extends Holder<T>`. The argument
`string` binds `T` in `Outer`, and `Outer` then passes `T` to `Holder`, so both inherited members are `string`.
No inherited member may keep a type-parameter reference after the projection.
