# Const value inference

Top-level const bindings into inferred types. Collects bindings from variable and export declarations, dispatches initializers through expression inference with const-assertion context, and narrows through `as` and `satisfies` — including literal narrowing under const assertion.
