# `tests/cases/` — groups, specs, and leaf cases

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

Most groups hold `SPEC.md` (behaviour, decisions, approved absences, the
out-of-scope table) and `TESTS.md` (the case ledger: one row per id with
a status word), fronted by a short group README; `cli/`, `harness/`,
`mdx/`, and `ref/` are README-only. Leaf shape everywhere:
`case.json` (id, name, `"sync": true` to opt into the sync loop),
`README.md` (first line is the claim), `world/` (TypeScript sources
built to `dist/` and served over HTTP), `specs/` (default-export `run`:
computed-style and DOM assertions — sheet text only alongside, never
alone).

Discovery is recursive: any folder with a `case.json` is a case at any
depth, and ids stay unique across groups. Status words: `open`,
`in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. A
case folder exists only once its proof is green, so `agentcore run`
stays green at every merge.
