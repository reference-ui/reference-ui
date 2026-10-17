# TST-EXT-04 — Module-level syntax tasty does not extract warns TST-W-UNSUPPORTED-SYNTAX naming the construct

Three module-level statements tasty does not model each warn `TST-W-UNSUPPORTED-SYNTAX` once, in their own
file, and name the construct in the message: `globals.ts` holds `declare global { … }`, `requires.ts` holds
`import shapes = require('./assign')`, and `assign.ts` holds `export = Shape`. Tasty skips each statement:
the global `Window` never becomes a symbol. The named declarations beside each statement still extract
(`Local`, `Sided`). The warnings reach the manifest `warnings` channel as well as the emitted diagnostics.

These silent drops must be visible as well.
