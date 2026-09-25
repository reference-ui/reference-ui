---
date: 2026-09-24
cycle: night-g1
module: atomic/extract/expressions (walk leaf/member + plan keys)
theories_spent: 1
verdict: break-found
---

# Const-resolved `!` markers mint unqueryable plan keys (silent no-paint)

## Hypothesis

Gap pursued: S5-2 pins that a const leaf's `!`/`!important` suffix "is a
flag, never part of the value" — but only the const-object *spread* path
(`push_entry_leaves` → `split_entry_leaf`, `object/entries.rs:76-102`)
splits it. The scalar value paths push the recorded leaf raw with
`important: false`: identifiers (`walk/leaf.rs:33-35`), static members
(`walk/member.rs:22-24`), computed members (`member.rs:60-62`), chains
(`member.rs:110-112`), and spliced const-array slots
(`responsive.rs:92-94`). Recorded leaves are raw by construction
(`constants/collect.rs:237`, `entries.rs:275`, `scope/init.rs:106`).

Mechanism, end to end for `const c = 'red !important';
css({ color: c })`: the want is `("color","red !important",imp=false)`,
so the plan rows carry the raw key with `important: false` and the
sheet mints `__c_red_!important { color: red !important; }` — while the
runtime strips `!` on *every* scalar value before lookup
(`packages/reference-neo/src/runtime/css/css.ts:194-195`,
`splitImportant`), querying `("color","red",imp=true)`. The raw key is
unqueryable by construction: plan miss, zero paint, plus an orphan
sheet rule nothing can reach. The identical inline spelling
(`css({ color: 'red !important' })`) splits at extract, plans
`("color","red",true)`, and paints. Resolve additionally misdiagnoses
the raw want with `ATM-W-UNKNOWN-COLOR` ("neither a color token nor a
CSS color") — the value IS a color wearing the engine's own flag.

Red test (transient plant, since removed): control inline mints
`("color","red",true)` and paints under `__c_red\!` (passes);
identifier and member wants assert stripped value + flag (both fail:
`"red !important"` / `false`); plan-key test asserts a
`("color","red",true)` row and no `c_red_\!important` orphan (fails:
plan holds the raw key, orphan rule present). Result: 1 passed /
3 failed.

Fresh ground: doom history holds the responsive-leaf `!` drop (wave1,
a responsive-object shape since fortified with refusal) and tonight's
bare-attr span drop (r1-atomic, diagnostics) — no report on
const-identifier/member `!` splitting; `search "important const
identifier member split S5"` returns neither. Untried siblings of the
same root cause (code-read, unprobed): computed members, chains, and
const-array slots push raw the same way; JSX `mt={space}` routes
through the same walk.

## Verdict

`break-found`. Repro: `/tmp/doom-g1-extract-repro.sh`
(blind-runnable, `bash /tmp/doom-g1-extract-repro.sh [repo-root]`;
exit 1 = break; plants a transient `cargo test -p atomic` red suite
via `pnpm agentrs`, captures 1-passed/3-failed, deletes the plant,
verifies `git status` on the touched path is clean).

Violated contract:

- S5-2 (`object/entries.rs:74-76` + test
  `const_leaf_important_suffix_mints_flagged_and_silent`): "the suffix
  is a flag, never part of the value" — the identifier/member paths
  treat it as part of the value.
- Same-value inconsistency: inline literals (`literal.rs`), templates,
  binary/logical folds (`push_folded_want`), ternary literal arms, and
  const-object spreads all split; only const-resolved identifier /
  member / element / chain / array-slot leaves do not — same authored
  bytes modulo indirection, different paint.
- Runtime lookup contract (`css.ts splitImportant`, pinned physics
  "runtime looks up a map"): the runtime always queries the stripped
  key, so the raw plan key is a key no query can ever name — a
  plan/sheet pair that cannot paint.

Severity: user-facing. Shared important constants (`const danger =
'red !important'`) and theme objects (`theme.primary`) are ordinary
authoring; the failure is silent no-paint with dead sheet bytes, and
the one warning (`UnknownColor`) misnames the cause. In-bounds:
complete static literals in TS compile inputs; dropped paint plus
misdiagnosis, not a will-never-work shape.
