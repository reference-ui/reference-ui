---
date: 2026-09-20
cycle: 1
module: atomic/diagnostics/proof+channels
theories_spent: 1
verdict: break-found
---

# Unknown-prop exact misses are default-silent (wrong channel)

## Hypothesis

Gap pursued: extract-gate static refusals that name exact runtime
misses produce zero default signal. `css({ frobnicate: 'red' })`
is a complete static literal; the engine mints no plan for it and
the runtime genuinely queries-and-misses the exact key
`["@reference-ui/lib",[],"frobnicate","red",false]` — yet the
default channel is `[]`.

Two mechanisms interact, each citing the other half:

- Proof's causeless join excludes unknown props
  (`proof/render.rs:121`): "extract owns that jurisdiction and
  already warns located at the gate".
- The S5 partition classifies ALL extract outcomes/notes as
  compiler audience (`policy/mod.rs:42-46`), so the gate's
  located `ATM-W-UNKNOWN-PROPERTY` rides the opt-in channel only.

Analysis proves the key is knowable: it emits
`ExactLookupExpected{frobnicate:red}` for the site (walk_leaf
gates no prop), visible as `ATM-I-EXPECTED-LOOKUP` on the
channel. The exclusion's premise ("extract warns") is true but
insufficient — nobody sees the warning by default.

The red test (`/tmp/doom-t1-unknown-prop/run.mts`, blind-runnable
via repo tsx) compiles a real fixture through real
`atomic::compile`, then runs the real neo runtime over the real
compiled plans: control `color:red` paints, `frobnicate:red`
resolves to `class=""` with a genuine runtime miss diagnostic,
and the default channel names `frobnicate` zero times —
assertion fails. `SystemStyleObject` is `Record<string, unknown>`
(`css.ts:17`), so tsc catches nothing either; the author's only
signal is the runtime dev warning, whose advice ("Add a static
call site or staticCss entry") can never fix an unknown prop.

Sibling instances of the same root (not separately pursued):
scalar conditions (`_hover: 'red'` → `NON-OBJECT-CONDITION`,
runtime queries `prop=_hover`) and unknown `r` breakpoints
(`wat` → `UNKNOWN-BREAKPOINT`, runtime queries
`when=['r','wat']`) — both in DIAG-05's input, both channel-only.

## Verdict

`break-found`. Repro: `/tmp/doom-t1-unknown-prop/run.mts`
(fixture `input/src/typo.ts`; run:
`packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-t1-unknown-prop/run.mts` from the repo root; exits
non-zero on the red assertion).

Violated contract:

- `ATM-DIAG-09` (absent exact keys get userspace warnings):
  `frobnicate:red` is absent from final plans with an exact
  expectation, and warns nowhere by default.
- O9-R3 COND-17 precedent ("moving would silence a real typo" —
  kept default): this is the same real-typo shape, moved.
- Same-mistake inconsistency: unknown props on the static/global
  surfaces stay default (R3), while `css()` unknown props are
  opt-in-only.
- DIAG-05's own rationale ("The refusals prove no exact runtime
  miss") is false for this row: analysis records the exact
  expectation and the runtime misses it.

Severity: user-facing. Author typo → silent sync → unpainted
style, with the only signal (runtime dev) carrying unactionable
advice. In-bounds: complete static literal in a TS compile
input; silence where a diagnostic is owed, not a
will-never-work shape.

Doom-log note: thin log on diagnostics (3 reports, none on this
module); this gap was unexplored. F-O9a (channel-dedup dup
groups) was carried as a lead but not pursued — over-reporting,
outside this brief's false-negative scope.
