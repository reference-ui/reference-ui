# STT-WRAP-12 — Same-named generic or infer forwarding traces without recursing forever

Two inputs forward a type under its own name. `Forward<T> = Wrap<T>` passes its `T` into `Wrap<T>`, whose parameter is also `T`; `recipe.tsx` mirrors the generated `RecipeVariantProps`, where `T extends { variants: infer V } ? VariantSelection<V>` passes an unbound `V` into a parameter named `V`.
An argument must resolve in the scope it was written in (the caller's), not the callee's, where the parameter names itself.
Resolving it in the callee's scope looped until the stack overflowed and killed `ref sync` (SIGILL) once the recipe variant types reached the generated `react.d.mts`.
Card and Badge are traced.
