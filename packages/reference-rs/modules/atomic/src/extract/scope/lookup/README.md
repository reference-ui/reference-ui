# Scoped lookup

The walker-facing query handle at one fixed use-site scope. Answers static leaves, helper descriptors, style objects and arrays, import bindings, mutation poison, and unfoldable spreads with locals first and imports through the module graph. A valueless const copy of an import (`const copy = imported`, or a copy of a copy) answers the import it ends at, through `resolve_value`, so a copy folds and is poisoned exactly as the import is.
