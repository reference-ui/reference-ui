# ReferenceLibrary

Public surface lives at this root: `ReferenceLibrary`, `types`, `index`.

Contract: the ReferenceLibrary contract. Proof: the ReferenceLibrary test catalog.

The library is a document runtime mount, not a provider. `ReferenceLibrary`
composes children with the gated runtime hosts: the
`hooks/` activation hook mints a host id and runs the
election, `election/` seats the earliest live mount per document
and fails over on unmount, `warmup/` writes the Tooltip skip-delay
policy, and `parts/` renders the Toast host plus live-region
announcer inside the winning root. `shared/` mints host ids.

There is deliberately no `context/`: descendant transparency is the contract
(RL-DOM-03), so the component owns no React context and submodules coordinate
through document-scoped stores instead. Server renders emit children alone —
no document, no election, no hosts.

Up: Components.
