# Recursive type tracer

Concrete style-prop names from declaration roots. Recurses through declarations with type arguments bound in child environments, expands builtins and literal-key passes over unions, keyof targets, mapped sources, and indexed access — emitting a flat name set or explicit failure diagnostics.
