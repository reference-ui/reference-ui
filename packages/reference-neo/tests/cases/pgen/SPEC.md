# PGEN — the primitives test station

The PGEN group proves the RS-emitted primitive shelf that Neo vendors through
the native seam: the E1 element vocabulary as data, the E2 raw roster as a
live module, and the E4 raw types as declarations. Two parity cases gate
freshness at test time (roster names against canon, prop names against
typegen), six type cases prove the E4 surface assigns and rejects exactly
where it must, and the PRIM re-anchors tie the old census to the new shelf.
Behavior through a bound per-system roster is the W4 wave's to prove; this
station owns everything provable without it.

## Dialect

Authors will one day render bound primitives exactly like today's generated
entry — style props plus plain DOM props plus the variant and colorMode
metadata — but that day is W4's cutover, not this station. What this station
speaks is the seam vocabulary: E1 elements with dom, jsx, and family fields,
the exact style-prop key set, named conditions, the alias map, reserved keys,
and the caption and menu host overrides. There is no SVG namespace here ever:
classes land on the svg host itself and everything beneath stays native SVG,
so the vocabulary carries 101 HTML hosts and the SVG wave is retired, not
deferred. E4's open positions (css as a record, variant as unknown) are
pinned as open with W4 flip notes, never mistaken for narrow.

## Station shape

Parity cases run node-side against three live legs each: the workspace RS
build, the committed shelf, and the current canon sources or typegen napi.
Type cases sync a colors-only world to publish narrow styled declarations,
then compile temp-dir consumers against the vendored E4 composed with those
declarations — positive files exit 0, negatives exit non-zero with a pinned
diagnostic code. Nothing red lives in the repo: every negative is materialized
at spec time, since the harness pre-run typecheck resolves the react specifier
to the stable surface. Drift-injection negatives corrupt in-memory copies, not
the shelf, and the gate must name the injected member or fail itself.

## Full case list with status

Statuses: LIVE (proved tonight), WEAK (positive live, negative needs W4),
BLOCKED (needs the named W4 surface), DROPPED (retired by the namespace law).
Ids are append-only; never renumber.

| id | name | status | proof or missing surface |
| --- | --- | --- | --- |
| NEO-PGEN-01 | html-flow renders | LIVE | 27 flow probes render own tag, paint sibling color plus css background, stamp markers |
| NEO-PGEN-02 | html-text renders | LIVE | 22 text plus 7 single-letters render, holed array keeps 1r then paints 4r |
| NEO-PGEN-03 | html-form renders | LIVE | form probes keep native behavior with style props applied, no key leakage |
| NEO-PGEN-04 | html-table renders | LIVE | table probes nest inside a real table element, Caption paints |
| NEO-PGEN-05 | html-media renders | LIVE | media probes carry native attrs, svg host styled over native child, voids childless |
| NEO-PGEN-06 | html-interactive renders | LIVE | details toggles natively, dialog closed, hover plus dark arms paint |
| NEO-PGEN-07 | svg-shapes render | DROPPED | namespace law: no SVG-namespace children ever, no deferred set |
| NEO-PGEN-08 | svg-text renders | DROPPED | namespace law: Text stays native SVG, never a primitive |
| NEO-PGEN-09 | svg-gradients render | DROPPED | namespace law: gradients stay native SVG, never primitives |
| NEO-PGEN-10 | svg-containers render | DROPPED | namespace law: no F1 fold-in, the camelCase column is moot |
| NEO-PGEN-11 | special-cased roster | LIVE | Obj Var Map render, override refs land, 109-export census, no pattern pack |
| NEO-PGEN-12 | set parity with canon | LIVE | roster jsx equals E1 equals canon HTML partition at pinned 101, drift-injection trips |
| NEO-PGEN-13 | prop parity with typegen | LIVE | E1 equals napi props equals E4 union plus alias probes and seam bind |
| NEO-PGEN-14 | metadata plus passthrough | LIVE | variant plus colorMode stamp, passthrough lands, leak sweep empty |
| NEO-PGEN-15 | style props valid everywhere | LIVE | family probes assign, bogus key fails TS2353, open css pinned for W4 |
| NEO-PGEN-16 | token unions real | LIVE | literals assign incl prefixed, mistype fails TS2322, hatch documented |
| NEO-PGEN-17 | recipe variants | WEAK | selection assigns but wrong-axis assigns too: variant unknown until W4 narrows |
| NEO-PGEN-18 | conditions plus responsive | LIVE | arms and null-hole arrays assign, bare sm fails TS2353 |
| NEO-PGEN-19 | refs plus elements | LIVE | hosts resolve with overrides, bare generic fails TS2314, cross-host fails TS2322 |
| NEO-PGEN-20 | forbidden surface | LIVE | forbidden imports fail TS2305, as fails TS2353, E4 panda-clean |
| NEO-PGEN-21 | svg props | DROPPED | namespace law: no SVG hosts beyond the svg element itself |
| NEO-PGEN-22 | per-system narrow | BLOCKED | needs the bound per-system entry with system-narrowed token unions |

## Re-anchors

PRIM-09's census now cross-checks its pinned tag table against the E1 dom set
at 101, and PRIM-10's surface census cross-checks its pinned names against
the E4 declarations — both landed in this station, no renumbers. TYPE-01
compiles against the bound entry and stays blocked on W4's cutover, alongside
TYPE-02/03/04/07/08 which keep passing unmodified on the per-system surface.

## Decisions

101 pinned in three places that must move together: the E1 element count, the
canon roster, and the live E2 exports minus helpers. The css and variant
openness probes pin raw-E4 behavior that the W4 bake deliberately breaks;
their flip is specified in the case READMEs, not discovered later. The ref
probe direction (div into input) is pinned by lib.dom subtyping and documented
in the PGEN-19 README so no future edit silently un-pins it.

## Approved absences

- SVG-namespace children as primitives: retired by the namespace law, with
  PGEN-12 carrying the 24-name tripwire against a silent fold-back.
- Recipe modules and per-recipe selection types in E4: explicit non-emits;
  variant narrows only at the per-system bake.
- Splitter render behavior in PGEN-13: the bind path is proved, separation at
  render waits on the W4 assembly.

## Out of scope

| Feature | Reason |
| --- | --- |
| Bound-roster rendering cases | W4 implements the per-system assembly this station will then prove |
| Per-system token narrowing | W4 bakes system unions; raw E4 stays system-independent by design |
| tags and surface deletion | Needs the bound entry live first; the cutover wave owns the delete |
| Prose and rename leftovers | Another crew owns naming; this station proves the shelf as vendored |
