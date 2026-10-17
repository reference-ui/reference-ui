# STATIC ledger

All three rows are `done`. The reference-rs cases are present
(`packages/reference-rs/modules/atomic/tests/cases/<id>` + README), and no RS
rows back them. NEO-STATIC-03 pairs with NEO-MERGE-06 (same rule,
static side vs runtime side) — see SPEC.md §4.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-STATIC-01 | Declared static values × conditions exist in the sheet with no call site | done | ATM-STATIC-01/02 | — (`staticCss` plumbing is in place) | runtime `css({ color: pickAtRuntime })` paints because the atom exists | Panda v1 static-css test "works" |
| NEO-STATIC-02 | Wildcard `*` expands a token category | done | ATM-STATIC-02 | — (`staticCss` plumbing is in place) | count = token count | Panda v1 static-css tests |
| NEO-STATIC-03 | A runtime value outside the static set yields the MERGE-06 diagnostic, not a ghost; an unsatisfiable `staticCss` request fails sync with a diagnostic | done | ATM-STATIC-03, ATM-GHOST-02 | — (`staticCss` plumbing and MERGE-06 are in place) | no class; diagnostic |  |

## Atomic seam emit

`pnpm agentrs v atomic -t` covers ATM-STATIC-01/02/03 and ATM-GHOST-02, one test
each. They emit: STATIC-01 → 6 utilities (`bg`/`color` × n100/200/300) + 6
class-map keys, no `border-radius`; STATIC-02 → exactly 2 classes with `bg:n300`
deduped to one selector; STATIC-03 → `_hover:color n100` plus `borderRadius *`
(sm/md) utilities, stylePlans for both props, one `warning`
`Unknown property in staticCss: "unknownProp"`; GHOST-02 → `(when:)prop:value`
keys match sheet selectors. No RS gap: the engine needs nothing.

## staticCss plumbing

The `staticCss` plumbing (`ReferenceUIConfig.staticCss`, validate, fragments
carry, sync test) and NEO-MERGE-06 are `done`, so all three rows prove with no
host change. An unsatisfiable `staticCss` *property* warns (ATM-STATIC-03,
`Unknown property in staticCss`) and a bare unknown *value* passes through
literally with no diagnostic. A token-ref value that cannot resolve
(`staticCss: { color: ['{colors.nope}'] }`) is an `error` (`unknown token
reference`) and fails sync; the NEO-STATIC-03 `bad/` sibling proves that.
