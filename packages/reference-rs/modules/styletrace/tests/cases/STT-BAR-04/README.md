# STT-BAR-04 — A wrapper re-exported through a local named barrel stays traced under its public name

Traces a wrapper re-exported through a local named barrel.
Converted from fixtures/styletrace-library: index.ts re-exports
MyStyleComponent from its sibling file, and the public name stays traced.
Sibling: `STT-BAR-01` (the `export *` barrel form).
