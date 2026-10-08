---
date: 2026-09-20
cycle: 4
module: atomic/diagnostics/proof+adapters
theories_spent: 1
verdict: break-found
---

# Custom-prop objects mint a ghost plan and miss silently

## Hypothesis

Gap pursued: proof-join soundness where analysis, extraction, and the
runtime disagree on the reading of one authored shape — custom
properties with object values. `css({ '--x': { base: '1', md: '2' } })`
is a complete static literal on the pinned `css()` surface, and the
neighboring custom-prop shapes paint (scalar `--x: '1'` and array
`--x: ['1','2']` both serve classes — controls in the repro).

Three layers read the object shape three ways:

- Extraction (`is_known_style_prop("--x") == true`, canon
  `--*` rule) treats it as a style position and mints a
  whole-object `--x` plan with real declarations — warning nothing,
  reporting no producer fact.
- Analysis mirrors neo (`walk_nested_object`: `--x` ∉ style props)
  and predicts the nested exacts `base`/`md` under `['--x']`
  (visible as `ATM-I-EXPECTED-LOOKUP` on the channel).
- The runtime recurses `--x` as a condition and genuinely misses
  both nested queries (`class=""` + 2 dev warnings).

The default channel is `[]`: the nested exacts are absent from plans
(the plan is keyed `--x`/whole-object, which nothing queries), and
proof's F2 causeless exclusion skips them — `!is_known_style_prop`
on `base`/`md` — on the stated premise that "extract owns that
jurisdiction and already warns located at the gate"
(`proof/render.rs:113-115`). That premise is false on this shape:
extraction minted a plan and warned nowhere, at no level. The ghost
plan's classes are unservable; the runtime dev advice ("Add a static
call site") can never fix the miss.

The red test (`/tmp/doom-wave4-custom-prop-object/run.mts`,
blind-runnable via repo tsx) compiles a real fixture through real
`atomic::compile`, then runs the real neo runtime over the real
compiled plans: 2 nested exacts predicted, ghost `--x` plan minted,
both controls paint, object resolves to `class=""` with 2 genuine
runtime misses, 0 default lines naming the miss — assertion fails.

Not wave-1b ground: no typo, no gate warning hidden by partition —
there is no warning at any level, and the engine affirmatively mints
a plan for the shape. Not the carried scalar-condition / unknown-`r`
fodder either: those warn channel-only at extraction; this warns
nowhere. Unexplored: doom log has zero custom-prop entries.

## Verdict

`break-found`. Repro: `/tmp/doom-wave4-custom-prop-object/run.mts`
(fixture `input/src/a.ts`; run:
`packages/reference-neo/node_modules/.bin/tsx
/tmp/doom-wave4-custom-prop-object/run.mts` from the repo root; exits
non-zero on the red assertion).

Violated contract:

- `ATM-DIAG-09` (absent exact keys get userspace warnings): both
  nested exacts are absent from final plans with expectations
  recorded, and warn nowhere by default.
- Proof F2's own premise (`proof/render.rs:113-115`): the exclusion
  assumes an extract gate warning that does not exist for this
  shape — the exclusion is overbroad.
- Engine/runtime contract: the engine mints a responsive `--x` plan
  (claiming the shape), the runtime can never query it (ghost
  classes `@reference-ui/lib__--x_1`, `@reference-ui/lib__md:--x_2`
  served to nobody); sibling custom-prop shapes (scalar, array)
  agree and paint.

Severity: user-facing. Static authorship on a supported prop family
→ silent sync → unpainted style + orphan sheet rules, with the only
signal (runtime dev) carrying unactionable advice. In-bounds:
complete static literal in a TS compile input; silence where a
diagnostic is owed, not a will-never-work shape. Fix placement
(extraction refuse-vs-runtime query) is for the architect, not this
report.
