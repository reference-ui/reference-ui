# TST-INT-04 interface merging

Verifies that same-file `interface Widget` blocks declared twice merge into
one manifest symbol carrying the union of members (`alpha`, `beta`), with
empty warnings and diagnostics — a clean merge of legal TS is silent.
Proves primary SPEC ID anchor TST-INT-04.

## Same-file declaration-merge rules (M1–M3)

Same-file same-name declarations share one symbol id
(`sym:{file_id}#{name}`), which is correct — merged blocks ARE one type.
The resolve layer folds them over `parsed.exports` before
`resolve_symbol_references`, so member TypeRefs resolve once:

- **M1 (honor):** all-`Interface` shells fold into ONE symbol with
  unioned members in declaration order. `extends`/`references`
  concatenate, docs take first-Some, type parameters stay the first
  block's, `exported` is OR-ed. Silent: no diagnostic.
- **M2 (member collision):** the same nominal (property/method) member
  in two blocks keeps the FIRST and emits a diagnostic naming
  file/symbol/member. Call/construct/index signatures are overloads,
  not collisions — they always union additively.
- **M3 (non-mergeable):** alias+alias or mixed kinds are tsc-error
  shapes (duplicate identifier): keep the deterministic last survivor
  and emit a diagnostic naming file/symbol/kinds.

This is the semantic opposite of TST-DUP-01 (cross-file same-name:
preserve-all + duplicate warning + ambiguous bare-name lookup).
