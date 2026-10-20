# Namespaces and aliases

Namespace members and import-equals expansion. A `declare namespace` member becomes a dotted symbol when a reference or export names it; aliases rewrite to their target text through chains with a hop cap on cycles; a module-level pre-pass keys members and binds aliases so forward references resolve like backward ones.
