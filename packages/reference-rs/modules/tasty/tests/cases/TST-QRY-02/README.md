# TST-QRY-02 — typeof-instantiation: typeof with explicit type arguments keeps them in the query expression

An instantiation expression `typeof identity<string>` names the generic function instantiated at `string`.
The type query keeps the type arguments in its expression text (`identity<string>`) and resolves no value,
because the instantiated signature is not evaluated. A plain `typeof identity` keeps the bare name.
