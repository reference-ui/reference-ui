# Doom RULE — CONTINUITY-01 / continuity-x

Ruling: **CURIO** (working as designed). No fortify owed.

## Firsthand verification

Replayed the unmodified repro firsthand: exit 1, `condition miss class: ""`,
`condition miss warns: []`, all three controls green. The *behavior* is
confirmed exactly as finder/reproducer state it. The dispute is only whether
stated physics is violated. It is not.

## The blessing contract: refusal, not miss

The finder's case rests on reading "miss" colloquially (a query that paints
nothing). The architecture uses "miss" as a term of art — a *constructed class*
with no backing rule — and unknown conditions are *refusals*, a separate,
explicitly blessed path:

1. `packages/reference-rs/modules/atomic/js/namer/shape.ts:132-136` —
   `shapeMember`: "an unknown entry drops the whole want… Refusal granularity
   is per declaration." Line 157: "unknown drops the want."
2. `packages/reference-rs/modules/atomic/js/namer/when.ts:31-42` — P7 `unknown`
   is a designed verdict mirroring Rust `lower_when`, pinned by golden 13.
3. `packages/reference-neo/src/runtime/css/css.ts:252-257` — `css()`: "refused
   declarations name nothing (plus no diagnostic — there is no class to
   probe)."
4. `css.ts:117-123` — `reportStyleMisses`: "refused queries name nothing to
   check, so every candidate is a class the probe confirms."
5. The miss channel's own type excludes it: `MissCandidate` (`namer/miss.ts`)
   *requires* a `className`. A refused query produces no class, so it is
   literally unrepresentable in the miss channel — not skipped by it.

## Why the finder-cited contracts do not cover this

- **css.ts header** ("misses still construct a class… warns once"): "miss" here
  means the term of art (same file's docstring defines refused queries as
  non-candidates). The file is self-consistent; no carve-out is violated.
- **NEO-CSS-16**: pins the miss path for *value* misses (`999r`, a passthrough
  stem). No condition pin exists; extending it to conditions is inference,
  not stated physics.
- **classPrefix** ("the oracle never kebabs on a miss"): a *prop-position*
  prefix-fallback rule. No parallel rule promises verbatim condition segments;
  `when.ts` explicitly refuses them. Asymmetry without a symmetry contract
  is not a break.
- **Static `ATM-W-UNKNOWN-CONDITION` (default-visible)**: a *compile-channel*
  decision. No contract makes compile severity transitively obligate a runtime
  channel. The engine deliberately splits channels (compiler / diagnostics /
  runtime probe).

## The division of labor (uniform, load-bearing)

Refusals diagnose at **compile** (`ATM-W-UNKNOWN-CONDITION`, default channel,
pinned by `NEO-DIAG-06` and `ATM-DIAG-09`); misses diagnose at **runtime** via
the sheet probe (`miss.ts`, `NEO-CSS-16`). The condition position is not
singled out: value refusals (boolean → `ATM-W-INVALID-CSS-VALUE`, NaN/hex →
`ATM-W-NON-CANONICAL-NUMERIC`, `value.ts`) are equally runtime-silent. Both
namers refuse together — Rust `lower_conditions` warns `UnknownCondition` and
returns `None` (`ATM-DIAG-09` README; SPEC.md ATM-DIAG-09: "warns and drops
the whole want") — so runtime `name()` cannot unilaterally construct without
breaking compiler/runtime parity (`NAMER_RULES_VERSION`, goldens 13/15/16).
A "fix" would be either a new direct-warn channel bypassing every `miss.ts`
guard (document-gating, load re-arm, scan-error silence — including firing in
Node where the probe deliberately stays silent) or a sheet-language change on
both namers. That is a design proposal, not a fortify.

## Severity honesty

Real papercut, correctly classified: a *dynamic* condition typo vanishes with
no DOM class to grep and (by nature — compile cannot see computed keys) no
compile signal. But: static sites already warn default-visible at compile
*and* fail `tsc` in bound worlds (generated `StyleConditionKey` union;
`generate.test.ts:265`); dynamic *value* refusals share the identical hole, so
this is uncovered-by-design (no channel owns dynamic refusals), not a
condition-specific break. A future feature brief could propose a runtime
refusal-diagnostic channel (gating? message shape? all refusals or
conditions-only? parity story?) — explicitly out of doom-fortify scope.

## Fortify boundary

None. No pins, no regression case, no sweep: there is nothing to fortify
without inventing a channel the architecture does not state.
