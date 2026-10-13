# TST-GEN-03 — generic-shadow: a type parameter or infer variable named like a top-level symbol does not resolve to that symbol

A type parameter of an interface, a method, or a function type, and an `infer` variable inside a conditional,
shadow a same-named top-level declaration within their scope. The reference they bind carries no symbol id
(the emitted id is its own name), while a reference outside the scope still resolves to the top-level symbol.
Covers the interface type parameter `Item` in `Wrap<Item>`, the `infer U` in the true branch of `Flatten`,
the method type parameter in `Holder.run`, the function type parameter in `MakeItem`, an `infer Data` nested
in an object-literal extends clause, and the mapped key `Item` in `Keyed`.
