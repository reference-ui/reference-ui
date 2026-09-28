# SITE-16 — objective log

IN PROGRESS

Scope: implement HQ-ruled semantic (i) — shadowed member roots resolve
through same-file `const` object literals to host-valued members, then
proceed to normal membership checks. Opaque rebindings stay silent.
Ruling brief: REPORT.md §1. Root-cause chain + resume: REDS.md.
Box: 90 min. Isolated worktree (sweep crew holds the shared checkout).
Crew writes below.

## T+0 — SITE-16 crew kickoff (isolated worktree)
- Ruling: semantic (i) — shadowed member root admitted ONLY via same-file
  `const` object literal whose statically-matched member value is an
  admitted host tag; opaque rebindings silent; tables not walk order.
- REDS.md root-cause chain read. No REPORT.md in landing-sequence/ (only
  AXE/FORM/LOG/REDS/SITE16/SWEEP) — ruling brief taken from the task text.
- Plan L1: `ObjectProp.ident` (shared lowering) + copy-strips + extract
  gate + ATM-SITE-88 station green. L2: diagnostics mirror + 251 flip
  check + `agentneo run NEO-SITE-16` PASS.

## T+15 — L1 code complete, gate proven both ways
- `ObjectProp.ident` in shared lowering (`entries.rs`); copies strip at
  alias/member/spread/fill/rest points; bag records const-literal refs only
  (`collect.rs` kind threading); extract gate (`context.rs`) + diagnostics
  mirror (`jsx.rs`) re-admit shadowed roots through the tables.
  `gate.rs` verified: attr filter only, no tag admission — no change.
- `pnpm agentrs c atomic -t "gating"` → 13 passed, incl. new
  `test_bound_member_root_through_const_object_extracts` (member extracts,
  twin silent, zero diagnostics) and pinned
  `test_shadowed_member_root_is_not_an_extract_site` (still silent).
- Quality: 0 violations on all 16 touched files. Warnings all pre-existing
  except `collect.rs` 385 lines (soft-limit warn, +34 for kind threading;
  precedent: lib.rs 489, builder.rs 467, element.rs 574 in-crate).
- Station ATM-SITE-88 written (member + twin + use-before-declare).
  Next: native build, station goldens, L1 green.

## T+20 — L1 GREEN
- Station ATM-SITE-88: `pnpm agentrs v cases.test.ts -t "ATM-SITE-88"
  --update-goldens` → 1 passed / 251 skipped. Goldens verified by hand:
  css.json carries minW/bg/mt, no p:4r; diagnostics.json []; sheet has
  min-width/background/margin-top, no twin utility.
- Worktree needed `pnpm install` (node_modules absent) + `pnpm agentrs b`
  (native addon, 25s). Both done, inside the box.
- L2 next: mirror unit tests, full `cases.test.ts` flip check (252),
  `pnpm agentrs c atomic`, `pnpm agentneo run NEO-SITE-16`.

## T+40 — flip check GREEN (252/252)
- Full `cases.test.ts`: `Tests 252 passed (252)` — zero flips across the
  251 pre-existing stations + new ATM-SITE-88.
- Note: first full run showed 1 failure (ATM-SITE-54) — environmental, not
  a code flip. `input/node_modules` fixtures are gitignored and absent in
  a fresh worktree; restored SITE-16/54 fixtures from the main checkout
  (gitignored paths, not deliverable changes). SITE-58's symlink fixture
  left unrestored — it passes without it.
- Mirror unit tests green (`bound_member_root_through_const_object_predicts`,
  `opaque_member_root_rebinding_predicts_nothing`); jsx.rs back under the
  soft limit (354 lines, fully clean quality).
- Next: full `pnpm agentrs c atomic`, then `pnpm agentneo run NEO-SITE-16`.

## T+50 — FINAL REPORT: semantic (i) LANDED, all proofs green

### L1 (extract gate + station) — GREEN
- `pnpm agentrs c atomic -t "gating"` → 13 passed, incl.
  `test_bound_member_root_through_const_object_extracts` (NEW: NS.Panel
  extracts, Other twin silent, zero diagnostics) and pinned
  `test_shadowed_member_root_is_not_an_extract_site` (opaque `const Tabs
  = Other` still silent — no exceptions).
- Station ATM-SITE-88: `Tests 1 passed | 251 skipped`; goldens
  hand-verified (minW/bg/mt present, no p:4r, diagnostics []).

### L2 (mirrors + flip check + neo proof) — GREEN
- Mirror unit tests: `analysis::jsx` → 9 passed, incl. NEW
  `bound_member_root_through_const_object_predicts` +
  `opaque_member_root_rebinding_predicts_nothing`.
- Flip check: full `cases.test.ts` → `Tests 252 passed (252)` — zero
  flips over the 251 pre-existing stations.
- `pnpm agentrs c atomic` (full) → 738+1+1+7+5 passed, 0 failed.
- `pnpm agentneo run NEO-SITE-16` → `[NEO-SITE-16] PASS member.spec.ts`
  (after env builds below; sync 62ms, sheet + paint + twin all asserted).

### Quality
- `pnpm agentrs q` on all 16 touched files: 0 violations. Warnings only:
  `collect.rs` 385 lines (soft-limit warn, +34 kind threading; precedent:
  lib.rs 489, builder.rs 467, element.rs 574 in-crate). All other
  warnings pre-existing (element/types/pattern_key/lower args).
- rustfmt: every edited line clean; remaining `cargo fmt --check` hits
  crate-wide are pre-existing toolchain drift (incl. context.rs:192,244
  and lower.rs:127, outside my hunks — verified via git diff).

### How semantic (i) is implemented
- `ObjectProp.ident` (entries.rs): the shared lowering records a
  bare-identifier member value (`{ Panel: Div }`) beside the empty
  marker; value resolution is untouched (`is_empty` ignores it).
- Copies strip (`strip_member_refs` at alias/member/spread/fill/rest
  points): only the declarator's OWN literal proves a spelling, so
  `const Tabs = NS`, `{...NS}`, `const x = o.k` stay silent in lockstep
  with the bag (which never copies across bindings).
- Extract gate (context.rs `shadowed_member_admitted`): shadowed root
  re-admits iff use-site scope resolution finds a same-file `const`
  object literal whose statically matched member ident is itself an
  admitted host (unshadowed + in jsx_hosts); then normal membership
  decides. `let`/`var`/params/functions/imports/mutated never re-admit.
- Bag const-only (collect.rs kind threading): non-const declarators
  keep style values but shed idents, so the mirror matches the gate.
- Mirror (diagnostics jsx.rs `shadowed_member_admitted`): same rule
  through the const bag + file bindings/hosts. `gate.rs` verified as
  attr-filter only (no tag admission) — no change needed. All other
  `is_shadowed` uses are value gates (css/member/attr resolution), not
  the tag gate — out of scope, untouched.

### Files changed (captain landing list)
Modified (15): atomic/src/{extract/{constants/{entries,collect,mod},
context,scope/{value,fill,spreads,types,call_init,collect/declarator,
destructure/object},expressions/object/lower,fold/element,tests/gating},
diagnostics/analysis/jsx}.rs; plus this log.
New: tests/cases/ATM-SITE-88/{input/src/spot.tsx,README.md,spec.ts,
output/{styles.css,css.json,diagnostics.json}}.
Untracked-but-deliverable: ATM-SITE-88 only. Nothing committed (per orders).

### Environment notes (NOT deliverable changes)
- Fresh worktree needed: `pnpm install`, `pnpm agentrs b`, `pnpm
  --filter @reference-ui/rust run build:js`, `node
  tools/mirror-reference-component.mjs` (gitignored), `pnpm --filter
  @reference-ui/neo run build`, and the gitignored SITE-16/54
  `input/node_modules` fixtures copied from the main checkout. All are
  gitignored build state; git status shows only the deliverable above.
- No REPORT.md exists under landing-sequence/ (only AXE/FORM/LOG/REDS/
  SITE16/SWEEP); ruling taken from the task brief + REDS.md chain.

### Resume checklist
Nothing unlanded. Captain: apply the 15 modified files + ATM-SITE-88,
verify firsthand (gating tests, station, flip check, neo case), commit.

## Captain verification + landing

- Applied from isolated worktree via patch (excluded log, copied log +
  station separately): 15 modified + ATM-SITE-88. Patch applied clean
  on shared HEAD; DIAG crew's log untouched throughout.
- Code reviewed: gate + mirror match the ruled semantic exactly
  (const-only, object-init-only, mutation veto, tables not walk order);
  pinned opaque test untouched; patch scanned clean (no allows,
  unwraps, todos).
- Firsthand: gating 13/13; full cargo 738+1+1+7+5 zero failed;
  `agentrs q` 0 violations (1 disclosed collect.rs soft-limit warn);
  flip check 252/252; `pnpm agentneo run NEO-SITE-16` → PASS.
- Committed (arc + this log closeout). SITE-16 CLOSED — the last
  case-vs-contract design conflict is resolved, not skipped.
