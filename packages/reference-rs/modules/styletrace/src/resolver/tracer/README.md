# Recursive type tracer

Concrete style-prop names from declaration roots. Recurses through declarations with type arguments bound in child environments, expands builtins and literal-key passes over unions, keyof targets, mapped sources, and indexed access — emitting a flat name set or explicit failure diagnostics.

Every declaration expansion passes a session-wide expansion guard. A repeat of an expansion already in progress (same pass, declaration and caller-scoped arguments) is refused silently, since it adds no names, so a self-referential or mutually recursive type ends the walk instead of overflowing the stack. Depth, argument-size and per-session expansion limits stop recursive generics whose arguments grow; each such cut loses names, so the session keeps its first cut and the analysis reports it as `STT-W-TYPE-EXPANSION-LIMIT`. A refused expansion contributes no names, like any reference the tracer cannot resolve.
