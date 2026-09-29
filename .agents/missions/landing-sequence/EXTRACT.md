# EXTRACT — objective log

IN PROGRESS

Scope: smoke #9 — teach styletrace/atomic to emit
`reference-ui__[&_>_:last-child]:bd-b-w_0` for the
`css={identifier}` form (`ReferenceMemberList.tsx:12-23`:
spread const + `as` cast threaded through a wrapper prop).
The inline `css={{...}}` sibling IS extracted — identifier/
spread/prop-threading dataflow is the gap. Full forensics +
resume in NAMER.md. Repro: full smoke shows exactly this 1
warning; sheet grep for `last-child` shows zero utility rules.
Gate: full smoke exit 0 with missRaceNoise=0 + zero-true-gap
still PASS. Follow the agent-rs skill (project skill id) —
canonical `pnpm agentrs` + quality gate on every touched file.
Box: 60 min. No API shape changes. Crew writes below.

## T+5 — forensics: dataflow gap confirmed in code

- `css={identifier}` on a host (`<Div css={styles}>`) IS supported:
  `jsx/mod.rs:284-286` → `lower_block_attr` → `resolve_block_target`
  (same-file const objects, incl. `as`-cast initializers — collector
  `unwrap_expression` strips `TSAsExpression`, and SITE-50 pins it).
- The #9 call site threads through a wrapper, and BOTH halves miss:
  1. `ReferenceMemberList.tsx:83` `<Div css={css}>` — `css` is a
     destructured function param, not a const → `BlockLookup::Miss` →
     refused (`NonObjectJsxStyle`) or silent; nothing emits.
  2. `:111/:141` `<ReferenceMemberRows css={memberRowsCss|declaredMemberRowsCss}>`
     — `ReferenceMemberRows` is a non-exported local fn, not a host
     (styletrace records *exported* components per its README; atomic
     `allows_jsx_tag` gates on hosts) → attribute skipped entirely.
- So the gap is same-file wrapper-prop threading (param forward
  `<Div css={css}>` + call-site value `<Wrapper css={const}>`), exactly
  the brief's "identifier/spread/prop-threading dataflow gap".
- Next (≤15 min): regression test mirroring the call site (must FAIL
  pre-fix), then minimal same-file threading fix in atomic extract.

## T+20 — repro green/red as predicted, fix designed

- New `extract/tests/wrapper_thread.rs`: control (direct
  `css={as-cast const}`) PASSES — want + utility minted (fixture
  prefix `@reference-ui/lib__`); threading case FAILS with wants `[]`.
  Gap isolated to wrapper threading, not const/`as`/spread handling.
- Fix (minimal, evidence-bound): same-file pre-pass in atomic extract
  recording capitalized fns (declarations + arrow declarators) whose
  first param destructures a `css` key and whose body renders bare
  `<Host css={param}>` on a host; non-host call-site tags in that set
  lower ONLY their direct `css={...}` attr via the existing
  `walk_style_attr`. No styletrace change (it records exported
  components by design), no diagnostic change (forward-site refusal
  stays as-is), no host-gating change (host path still wins).
- Files to touch (logged pre-edit): NEW `extract/wrapper_thread.rs`;
  `extract/mod.rs` (module + 2 collect sites); `extract/visitor.rs`
  (owned field + ctx wire); `extract/context.rs` (Option field +
  `threads_css`); `extract/jsx/mod.rs` (fallback + walker,
  `pub(crate)` name re-export); test files (done).

## T+35 — fix green, quality green (0 violations)

- 4/4 `wrapper_thread` tests pass (control, declaration threading,
  arrow threading, non-forwarding silent).
- Mid-course correction: arrow (`const W = ...`) wrappers were vetoed
  by the top-scope shadow of their own definition → new
  `bindings::is_inner_shadowed` (only deeper scopes veto; `shadows[0]`
  is the file-top scope per oxc `walk_program`). Added `bindings.rs`
  to the file list (helper only, +7 lines).
- Quality on all 8 touched files: `0 Code violations, 2 warning(s)` —
  both pre-existing (`jsx/mod.rs` was 582 lines before me;
  `lower_attr_const` untouched). Refactored my walker split so my
  code adds zero new findings; `context.rs` kept at ≤365.
- Next: full `c atomic` + `v atomic` (byte pins may move → re-pin with
  note), rebuild rs+lib, full smoke.

## T+50 — DONE: smoke #9 closed, gate PASS

- Confirmed dataflow gap (evidence): `css={identifier}` on a host
  already worked (control test green pre-fix); the miss was BOTH
  wrapper halves — `<ReferenceMemberRows css={const}>` skipped
  (non-exported fn, not a host, styletrace records exported only)
  and `<Div css={css}>` refused (param, not const). Repro test showed
  wants `[]` pre-fix.
- Fix: same-file `css` wrapper-threading pre-pass (`wrapper_thread.rs`,
  ~200 lines) + fallback in `jsx::extract` lowering only direct
  `css={...}` on threaded tags via existing `walk_style_attr`. No
  styletrace/host/diagnostic/API changes. Fail-closed: non-forwarding
  tags silent (test), inner-scope rebinds veto, spreads unhandled.
- Proof quoted:
  - quality (8 touched files): `0 Code violations, 2 warning(s)` —
    both pre-existing; my code adds zero findings.
  - `pnpm agentrs c atomic`: `742 passed; 0 failed` (738 + 4 new).
  - `pnpm agentrs v atomic`: `Test Files 14 passed (14), Tests 309
    passed (309)`; byte pins UNMOVED (`reactRaw:158291,
    reactGzip:39659` — same as NAMER re-pin) → no re-pin needed.
  - lib sheet now contains line 3584:
    `.reference-ui__\[\&_\>_\:last-child\]\:bd-b-w_0 > :last-child`
    (the exact #9 class; `last-child` lines 2 → 3).
  - FULL `pnpm --dir packages/reference-lib run smoke`: `SMOKE_EXIT=0`,
    `PASS zero-race-style-warnings`, `PASS zero-true-gap-style-warnings`,
    json `missRaceNoise=0, missTrueGaps=0`, `SMOKE-GATE PASS`.
- Probe bucket untouched: relabeling mooted by the genuine fix (#9's
  warning is simply gone). Residue removed (smoke tarball). Tree:
  7 modified (EXTRACT.md + 6 rs: bindings/context/jsx-mod/mod/
  tests-mod/visitor) + 2 new (wrapper_thread.rs + its test).
  NOT committed (crew never commits).
- Resume checklist: none — no hold. Captain: verify + land.

## Captain verification + landing

- Firsthand: `q` 0 violations; `c atomic` 742+1+1+7+5 zero
  failed; `v atomic` 309/309; FULL smoke exit 0 with
  missRaceNoise=0 + zero-true-gap PASS. Matches crew on all.
- Module reviewed: narrow pre-pass (capitalized fns, bare
  forward only, nested/default-export excluded), fail-closed,
  documented. 224 lines, within gates.
- Committed (arc + this log). Smoke #9 CLOSED — the gate is
  fully green. No crews remain. VOYAGE COMPLETE.
