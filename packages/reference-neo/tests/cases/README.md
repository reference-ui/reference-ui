# `tests/cases/` — groups, specs, and leaf cases

One folder per feature family (group); one leaf folder per case. Thirteen
groups carry the parity voyage — generated-folder contracts, tokens,
conditions, responsive lowering, the `css()` value grammar, merge
semantics, recipes, cascade layers, global CSS, pre-generated atoms,
extraction shapes, native primitives, and generated declarations — plus
the parity group with its lib-shaped world and the harness group whose
three cases prove the runner itself rather than the system.

Each group holds `SPEC.md` (behaviour, decisions, approved absences, the
out-of-scope table) and `TESTS.md` (the case ledger: one row per id with
a status word), plus leaf cases `NEO-<GROUP>-NN/`. Leaf shape: `case.json`
(id, name, `"sync": true` to opt into the sync loop), `README.md` (first
line is the claim, plus evidence tags), `world/` (TypeScript sources
built to `dist/` and served over HTTP), `specs/` (default-export `run`:
computed-style and DOM assertions — sheet text only alongside, never
alone).

Discovery is recursive: any folder with a `case.json` is a case at any
depth, and ids stay unique across groups. Status words: `open`,
`in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. A
case folder exists only once its proof rung is green, so `agentneo run`
stays green at every merge.
