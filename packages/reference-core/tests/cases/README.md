---
memex: cases
---

# Case groups, specs, and leaf cases

One folder per feature family (group); one leaf folder per case. Groups
cover the generated-folder contracts, tokens, conditions, responsive
lowering, the `css()` value grammar, merge semantics, recipes, cascade
layers, global CSS, pre-generated atoms, extraction shapes, native
primitives, generated declarations, diagnostics, sync and watch
lifecycles, staged publish, layers config, and the smaller families
beside them — plus the parity group with its lib-shaped world and the
harness group whose three cases prove the runner itself rather than
the system.

The `layers/` group (`CORE-LAYERS-NN`) covers the `layers` config surface:
visual-only upstream systems, each synced for real. Selectors match an exact id
or folder first, then an id prefix, so `agentcore run CORE-LAYER` also runs
`CORE-LAYERS-*`; `agentcore run CORE-LAYER-` runs only the `CORE-LAYER-*` ids, and
`agentcore run CORE-LAYERS` runs this group.

Fourteen groups hold a spec (behaviour, decisions, approved absences,
the out-of-scope table), fronted by a short group README; the chain,
diag, layers, namer, pgen, and watch contracts live in their group
READMEs, and the cli, harness, mdx,
and ref groups are README-only. There is no ledger file: a case folder
exists only once its proof is green, so the folders are the ledger.
Leaf shape everywhere:
a case index entry (id, name, `"sync": true` to opt into the sync loop),
a README (first line is the claim), a world folder (TypeScript sources
built to `dist/` and served over HTTP), run specs (default-export `run`:
computed-style and DOM assertions — sheet text only alongside, never
alone).

Discovery is recursive: any folder with a case index entry is a case at any
depth, and ids stay unique across groups. Status words: `open`,
`in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. A
case folder exists only once its proof is green, so `agentcore run`
stays green at every merge.
