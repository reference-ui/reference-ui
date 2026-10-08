---
date: 2026-09-20
cycle: wave3
module: canon/generate/emit
theories_spent: 1
verdict: break-found
---

# Canon-blessed extensions emit fictional CSS declarations silently

## Hypothesis

The emit surface serves whatever the gate passes: `to_css_declaration_property`
(`packages/reference-rs/modules/canon/generate/emit/lib.ts:60-69`) returns the
`css` form straight from the emitted `Property` row, and the compiler mints a
class + sheet rule for it with no further check. Wave 2 hardened the NAME side
of the join; the `css` emission form was unexplored ground — no validator gates
whether an extension's `css` is real CSS, and no atomic pass intercepts these
props (zero Rust references outside canon).

Gap pursued: longhand-less dialect extensions
(`packages/reference-rs/modules/canon/generate/overlay/extensions.ts`) carry
`css` forms absent from `@webref/css` — the engine's own platform truth — so
blessed props compile to rules no browser honors, with zero diagnostics.
Red test: compile `css({ translateX / boxSize / spaceX: '10px' })` through the
real native binding and assert each emitted declaration is either in
`@webref/css` (queried live, independent oracle) or named by a diagnostic.

Free-research kills (no theories spent): no webref→camel collisions (821/821,
completeness holds); no alias∩canonical shadows; zero dangling longhands;
zero `toConstIdent` collisions; UNITLESS sorted (but unpinned — only
binary-searched table missing from the JOIN-04 assertion, note for
scheduling); `webkitTextFillColor` ext row (wrong css, missing dash) is dead
data — platform wins; tag API (`is_html_tag`/`is_reference_primitive`) has
zero callers outside canon's own tests, so its case-folding is unreachable.
Consulted doom log (`canon`, `canon emit`) + VOYAGE-LOG-3 wave-1/2 entries —
no logged ground re-proven.

## Verdict

`break-found`. Repro `/tmp/doom-wave3-canon-emit-dead-decl.mjs`
(blind-runnable: `node /tmp/doom-wave3-canon-emit-dead-decl.mjs [repo-root]`,
exit 1): `translateX` → `{ translate-x: 10px }`, `boxSize` → `{ box-size:
10px }`, `spaceX` → `{ space-x: 10px }` — all three absent from `@webref/css`,
`diagnostics: []`. In-family controls hold: `translate` emits real
`translate`, and `borderStartRadius` (the one extension WITH longhands)
expands to real `border-start-start-radius` + `border-end-start-radius` —
proving the realization mechanism exists and the siblings lack theirs.

Violated contract: canon SPEC §1 + `CAN-PROP-03`
(`to_css_declaration_property` promises CSS declaration properties) against
`overlay/extensions.ts` rows whose `css` is fictional per the engine's own
`@webref/css` truth; silence where a diagnostic is owed (skill §3
misdiagnosis clause, wave-1a refusal precedent, Error Correct boundary
philosophy). Code: `overlay/extensions.ts` (fictional `css` forms) +
`emit/css.ts` / `emit/lib.ts` (served unconditionally).

Severity: user-facing silent wrong paint, broad. Family scope for consult:
~26 longhand-less extension props with no atomic interception (only
`borderStartRadius`/`borderEndRadius` work via longhands;
`webkitTextFillColor` is safe via platform shadowing).

Honesty note for review: fix direction (refuse-with-diagnostic at the
extraction boundary per the wave-1a precedent vs. implementing expansion)
needs an architect ruling — but blessed props minting dead rules silently
cannot stand. Lead, not order: scalar-`r` fall-through (`css({ r: '2' })` →
dead SVG `r: 2px`, silent) while JSX `r="2"` refuses loud is an atomic-side
asymmetry for a future brief, off this surface.
