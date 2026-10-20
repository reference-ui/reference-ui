# Type payload emitters

TypeRefs into manifest literals. One exhaustive match over all seventeen variants dispatches each family to its emitter: leaves and fragments, collections, and the symbol-table references, construct signatures, and mapped types — with no dispatcher calling another.
