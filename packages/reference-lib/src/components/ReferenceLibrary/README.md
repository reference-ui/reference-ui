# ReferenceLibrary

Public surface lives at this root: `ReferenceLibrary.tsx`, `types.ts`, `index.ts`.

Contract: [ReferenceLibrary.md](./ReferenceLibrary.md). Proof: [TESTS.md](./TESTS.md).

The library is a document runtime mount, not a provider. `ReferenceLibrary.tsx`
composes children with the gated runtime hosts: the
[`hooks/`](./hooks) activation hook mints a host id and runs the
election, [`election/`](./election) seats the earliest live mount per document
and fails over on unmount, [`warmup/`](./warmup) writes the Tooltip skip-delay
policy, and [`parts/`](./parts) renders the Toast host plus live-region
announcer inside the winning root. [`shared/`](./shared) mints host ids.

There is deliberately no `context/`: descendant transparency is the contract
(RL-DOM-03), so the component owns no React context and submodules coordinate
through document-scoped stores instead. Server renders emit children alone —
no document, no election, no hosts.
