# diagnostics

Tree's unmatched-id decision. A standalone value or an expanded id that
names no registered item is unmatched, but a collapsed Group unmounts its
children, so absence is evidence only when the whole tree is mounted: at
least one item registered and every registered branch expanded. Otherwise
the decision is undecidable and nothing is reported. The module is pure.
The diagnostics hook supplies the registry snapshot and reading order, and
owns the once-per-instance dedupe and the console channel.
