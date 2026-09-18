# STATIC ledger

Source: PLAN.md §8.11 rows NEO-STATIC-01..03, verbatim. All three rows `done`
(T7). All engine stations confirmed present
(`packages/reference-rs/modules/atomic/tests/cases/<id>` + README);
no RS rows added. NEO-STATIC-03 pairs with NEO-MERGE-06 (same D11 rule,
static side vs runtime side) — see SPEC.md §4.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-STATIC-01 | Declared static values × conditions exist in the sheet with no call site | done | ATM-STATIC-01/02 | — (Gap-1 plumbing landed) | runtime `css({ color: pickAtRuntime })` paints because the atom exists | `[panda-v1]` `static-css.test.ts` "works" |
| NEO-STATIC-02 | Wildcard `*` expands a token category | done | ATM-STATIC-02 | — (Gap-1 plumbing landed) | count = token count | `[panda-v1]` `static-css.test.ts` |
| NEO-STATIC-03 | A runtime value outside the static set yields the MERGE-06 diagnostic, not a ghost; an unsatisfiable `staticCss` request fails sync with a diagnostic | done | ATM-STATIC-03, ATM-GHOST-02 | — (Gap-1 + MERGE-06 landed) | no class; diagnostic | `[atm]` P1 #14 |

## Slice E9 note — R1 green, R3 blocked (2026-09-17)

R1: `pnpm agentrs v atomic -t` green for ATM-STATIC-01/02/03 and ATM-GHOST-02
(1 passed each). Emit: STATIC-01 → 6 utilities (`bg`/`color` × n100/200/300)
+ 6 class-map keys, no `border-radius`; STATIC-02 → exactly 2 classes with
`bg:n300` deduped to one selector; STATIC-03 → `_hover:color n100` plus
`borderRadius *` (sm/md) utilities, stylePlans for both props, one `warning`
`Unknown property in staticCss: "unknownProp"`; GHOST-02 → `(when:)prop:value`
keys match sheet selectors. No RS gap: the engine needs nothing.

R3 blocked on two host gaps outside STATIC ownership, so no case folders were
created (PLAN §4.5: rows stay `open` until the proof rung is green):

1. SYNC gap (SPEC §2 escalation): worlds cannot declare `staticCss` —
   `ReferenceUIConfig` (`src/config/types.ts`) has no such field, and
   `mergeCollectedSpec` (`src/fragments/base/index.ts:255`) hardcodes
   `staticCss: {}`. Probed: a world declaring `staticCss: { bg: ['n100'] }`
   syncs to `spec.staticCss = {}` and the sheet lacks the atom. Blocks 01–03.
2. MERGE gap: the MERGE-06 one-dev-diagnostic does not exist yet
   (`css({ color: 'nope' })` → `""`, silent; NEO-MERGE-06 still `open`).
   Blocks the diagnostic half of 03 (the no-ghost half holds today).

Open question for the captain: STATIC-03's "unsatisfiable request fails sync"
versus the engine's `warning` severity (sync throws on `error` only) and the
NEO-COND-13 warn-and-succeed precedent — RS severity bump or claim restatement?

## Slice T7 note — R3 green, E9 gaps closed (2026-09-17)

Gap-1 plumbing landed (`ReferenceUIConfig.staticCss`, validate, fragments
carry, sync test) and NEO-MERGE-06 is `done`, so all three rows proved with
no host change. The E9 open question resolved by probe, not by restatement:
an unsatisfiable `staticCss` *property* warns (ATM-STATIC-03,
`Unknown property in staticCss`) and a bare unknown *value* passes through
literally with no diagnostic — but a token-ref value that cannot resolve
(`staticCss: { color: ['{colors.nope}'] }`) is an `error`
(`unknown token reference`) and fails sync, which is the input the
NEO-STATIC-03 `bad/` sibling proves. Runs: `agentneo run NEO-STATIC-0*`
PASS (3/3), `agentneo q` 0 errors, package vitest 198 passed.
