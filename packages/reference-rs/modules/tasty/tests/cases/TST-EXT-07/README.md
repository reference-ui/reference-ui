# TST-EXT-07 — heritage-array: an extends Array<T> clause keeps its element T as a dependency, as a built-in reference with arguments does

`interface ArrHeir extends Array<UserT>` names the built-in `Array` with one type argument. The clause must stay a
reference to `Array` that carries its element, so the element is a dependency. `Array` has no manifest symbol, so it
is a reference-only descriptor, the same way `extends Omit<...>` is, and it is listed with its arguments.
`interface ArrNested extends Array<Wrap<UserT>>` checks the walk one level deeper: `Wrap` and `UserT` both count.
The `extends` descriptor keeps `Array` with `UserT` as its type argument, which the spec checks as a control.
