---
date: 2026-09-24
cycle: night-r1
module: diagnostics/cross-cutting (registry + ATM/ATL/TST/STT/TGN/RS)
theories_spent: 1
verdict: break-found
---

# R1-audit: registry cites an orphan code in its normative shape example

## Hypothesis

Gap pursued: cross-cutting error-code integrity — every diagnostic code
across `packages/reference-rs` and `packages/reference-neo` must be
defined exactly once, named per convention, carry message/help where
owed, and every reference must resolve to a real definition.

Research (free, before spending any theory): enumerated all 73 defined
codes (5 per-module `CODE_TABLE`s + 2 RS placeholders), then swept every
reference class — registry inventory + "Raised in" paths (all exist),
emit sites (all 70 live codes emit; 1 retired by design), the Rust + JS
suggestion gates (identical 8-code lists), Neo's 51-entry warning-hint
table (complete for all warnings), all three `DiagnosticCode` type unions
(atlas/typegen/styletrace, exact), every wire `code` value in goldens and
specs (all resolve), all constructor/severity pairings at every emit site
(no tag/severity mismatch anywhere), `-I-` containment (never enters
template validation on either side of napi), and the repro suites
(40 ATM rows + 5 ATM request tests + 6 TST + 4 ATL + 3 STT + 8 TGN = every
emittable code pinned; details in Appendix).

Theory 1 (spent, RED): the registry's own normative shape section cites a
code that resolves to no definition. `REGISTRY.md:17` lists
`` `ATL-W-UNRESOLVED-PROPS` `` as a "Valid:" example, but no such code
exists — the defined code is `ATL-W-UNRESOLVED-PROPS-TYPE` (atlas
`codes.rs`, inventory row 160). The bare string occurs exactly once in
both packages: the registry line itself. No definition, no emit site, no
test, no golden, no wire value.

Red test (planted by the repro, deleted after): extract every strict
`NS-W/E-NAME` token cited in `REGISTRY.md` (glob prefixes like
`RS-W-EXAMPLE-*` excluded) and assert each is in the defined set built
from the five `codes.rs` tables plus the RS placeholders from the
diagnostics crate's own goldens. Result:
`expected [ 'ATL-W-UNRESOLVED-PROPS' ] to deeply equal []`.

No further theories spent: the sweep was exhaustive (research is free)
and this is the only crisp integrity violation; everything else held.

## Verdict

`break-found`. Repro: `/tmp/doom-r1-audit-repro.sh` (run
`bash /tmp/doom-r1-audit-repro.sh /Users/ryn/Developer/reference-ui`;
plants one vitest file, runs targeted
`packages/reference-neo/node_modules/.bin/vitest run` on it, deletes the
file, verifies the touched path is git-clean; exits 1 showing the orphan).

Violated contract:

- `REGISTRY.md` header promise: "A code is always present, always
  documented, and always traceable here" — the registry's own shape
  example traces to nothing.
- Assignment convention step 4 ("A code with no row is unshipped"):
  the cited string has no row because it was never minted; presenting it
  under "Valid:" inverts the rule (an unshipped string presented as
  valid).
- Fix is one line: `ATL-W-UNRESOLVED-PROPS` →
  `ATL-W-UNRESOLVED-PROPS-TYPE` on `REGISTRY.md:17` (finder does not fix).

Severity: curiosity (doc integrity), with a minor user-facing edge: a
host author copy-pasting the normative "Valid" example into a
filter/suppression list builds a filter that silently never matches any
real diagnostic. No runtime manifestation — nothing emits, parses, or
depends on the orphan string. In-bounds: orphan reference, one of the
brief's enumerated violation classes, in the normative contract
document itself — not a will-never-work shape.

Doom-log note: `search "diagnostic code integrity"` returned no prior
audit (nearest: wave1 unknown-prop channel report, a different gap).
Thin log on code integrity; this gap was unexplored.

## Appendix A — full code table (73 defined codes)

Legend: D = defined exactly once (per-module exactly-once test +
namespaces disjoint); E = ≥1 emit site with matching severity; R =
whole-compiler repro row/test; H = Neo warning hint (warnings only);
G = suggestion-gate member. All 73 verified by string sweep + site read.

ATM — `modules/atomic/src/diagnostics/codes.rs` (50):

| Code | E | R | H | G | Note |
| --- | --- | --- | --- | --- | --- |
| ATM-W-DYNAMIC-EXPRESSION | warn | compiler row | yes | — | |
| ATM-W-DYNAMIC-MEMBER | warn | compiler row | yes | — | |
| ATM-W-DYNAMIC-IDENTIFIER | warn | compiler row | yes | — | |
| ATM-W-MUTATED-BINDING | warn | compiler row | yes | — | |
| ATM-W-DYNAMIC-TEMPLATE | warn | compiler row | yes | — | |
| ATM-W-DYNAMIC-UNARY | warn | compiler row | yes | — | |
| ATM-W-UNFOLDABLE-KEY | warn | compiler row | yes | — | |
| ATM-W-UNKNOWN-PROPERTY | warn | default row | yes | yes | |
| ATM-W-UNKNOWN-BREAKPOINT | warn | compiler row | yes | yes | |
| ATM-W-NON-OBJECT-CONDITION | warn | compiler row | yes | — | |
| ATM-W-UNFOLDABLE-SPREAD | warn | compiler row | yes | — | |
| ATM-W-UNKNOWN-CONDITION | warn | default row | yes | yes | |
| ATM-W-MISSING-CONTAINER-ROOT | warn | default row | yes | — | |
| ATM-W-NON-CANONICAL-NUMERIC | warn | default row | yes | — | |
| ATM-W-INVALID-CSS-VALUE | warn | default row | yes | — | |
| ATM-W-MALFORMED-OPACITY | warn | default row | yes | — | |
| ATM-W-UNKNOWN-TOKEN-PATH | warn | default row | yes | yes | |
| ATM-W-TOKEN-CATEGORY-MISMATCH | — retired, never emitted, kept for wire stability | round-trip test | yes (harmless) | — | |
| ATM-W-UNTERMINATED-BRACE | warn | default row | yes | — | |
| ATM-W-STATIC-WILDCARD | warn | default row | yes | — | |
| ATM-W-EMPTY-AT-RULE | warn | default row | yes | — | |
| ATM-W-UNSUPPORTED-GLOBAL-VALUE | warn | default row | yes | — | |
| ATM-W-TRACE-SKIPPED | warn | default row | yes | — | |
| ATM-E-MISSING-HOST-GRAPH | error | request test | n/a (E) | — | rides payload |
| ATM-E-RECIPE-ARG-SHAPE | error | default row | n/a | — | rides payload |
| ATM-E-RECIPE-SPREAD | error | default row | n/a | — | rides payload |
| ATM-E-RECIPE-CLASSNAME | error | default row | n/a | — | rides payload |
| ATM-E-PARSE | error | default row | n/a | — | file refused, siblings kept |
| ATM-E-DUPLICATE-RECIPE | error | default row | n/a | — | rides payload |
| ATM-E-UNKNOWN-TOKEN | error | default row | n/a | yes | |
| ATM-E-INVALID-BASE-SYSTEM | error | request test | n/a | — | preamble-only rejection |
| ATM-W-NON-OBJECT-CSS-ARG | warn | compiler row | yes | — | |
| ATM-W-NON-OBJECT-JSX-STYLE | warn | compiler row | yes | — | |
| ATM-W-RESPONSIVE-ARRAY-SPREAD | warn | compiler row | yes | — | |
| ATM-W-TAGGED-TEMPLATE-SITE | warn | compiler row | yes | — | |
| ATM-W-UNFOLDABLE-OBJECT-PROP | warn | compiler row | yes | — | |
| ATM-W-PARTIAL-OBJECT-PROP | warn | compiler row | yes | — | |
| ATM-W-DYNAMIC-BINARY | warn | compiler row | yes | — | |
| ATM-I-DEAD-BRANCH | info, module-local | telemetry (no row) | n/a (I) | — | never crosses template |
| ATM-W-TOKEN-CALL-REFUSED | warn | compiler row | yes | — | |
| ATM-W-UNKNOWN-COLOR | warn | default row | yes | yes | |
| ATM-I-HARVEST-SINK | info, module-local | telemetry (no row) | n/a | — | never crosses template |
| ATM-W-MISSING-STYLE-PLAN | warn | default row | yes | — | |
| ATM-I-EXPECTED-LOOKUP | info, module-local | telemetry (no row) | n/a | — | never crosses template |
| ATM-I-DYNAMIC-SLOT | info, module-local | telemetry (no row) | n/a | — | never crosses template |
| ATM-W-RESPONSIVE-LEAF-IMPORTANT | warn | default row | yes | — | |
| ATM-W-UNREALIZABLE-EXTENSION | warn | default row | yes | — | |
| ATM-E-CONFLICTING-SCAN-INPUTS | error | request test | n/a | — | token_rejection |
| ATM-E-UNKNOWN-RETENTION-TOKEN | error | request test | n/a | — | token_rejection |
| ATM-E-DRAINED-RETENTION-TOKEN | error | request test | n/a | — | token_rejection |

ATL — `modules/atlas/src/diagnostics/codes.rs` (4, template constructors enforce severity):

| Code | E | R | H |
| --- | --- | --- | --- |
| ATL-W-UNRESOLVED-PROPS-TYPE | warning | atlas row | yes |
| ATL-W-UNSUPPORTED-PROPS-ANNOTATION | warning | atlas row | yes |
| ATL-W-UNRESOLVED-INCLUDE-PACKAGE | warning | atlas row | yes |
| ATL-E-SCAN-FAILED | error | atlas row | n/a (rides payload as error) |

TST — `modules/tasty/src/diagnostics/codes.rs` (6):

| Code | E | R | H |
| --- | --- | --- | --- |
| TST-W-PARSE-ERROR | warning | tasty row | yes |
| TST-W-DUPLICATE-DECLARATION | warning | tasty row | yes |
| TST-W-DUPLICATE-MEMBER | warning | tasty row | yes |
| TST-W-STAR-AMBIGUITY | warning | tasty row | yes |
| TST-W-DUPLICATE-SYMBOL-NAME | warning | tasty row | yes |
| TST-E-SCAN-FAILED | coded throw | throw test | n/a |

STT — `modules/styletrace/src/diagnostics/codes.rs` (3):

| Code | E | R | H |
| --- | --- | --- | --- |
| STT-W-SKIPPED-FILE | warning | styletrace row | yes |
| STT-E-SCAN-FAILED | coded throw | throw test | n/a |
| STT-E-UNRESOLVED-SURFACE | coded throw | throw test | n/a |

TGN — `modules/typegen/src/diagnostics/codes.rs` (8):

| Code | E | R | H |
| --- | --- | --- | --- |
| TGN-W-UNKNOWN-TOKEN-CATEGORY | warning | typegen row | yes (+gate) |
| TGN-W-INVALID-RECIPE-NAME | warning | typegen row | yes |
| TGN-W-EMPTY-RECIPE | warning | typegen row | yes |
| TGN-W-INVALID-COMPOUND-VARIANT | warning | typegen row | yes |
| TGN-W-UNKNOWN-STRICT-CATEGORY | warning | typegen row | yes (+gate) |
| TGN-W-ABSENT-STRICT-CATEGORY | warning | typegen row | yes |
| TGN-W-EMPTY-FONT-FAMILY | warning | typegen row | yes |
| TGN-E-INVALID-BASE-SYSTEM | coded throw | throw test | n/a |

RS — template placeholders, test/doc only, never emitted by shipped code
(all 85 references verified test/golden/doc):

| Code | Defined by |
| --- | --- |
| RS-W-EXAMPLE-TOKEN | diagnostics crate goldens + registry reservation |
| RS-E-EXAMPLE-BOOM | diagnostics crate goldens + registry reservation |

Reserved, unminted, verified zero codes: CAN, BSS, VRS, MGP.

## Appendix B — lesser observations (all verified, none filed)

- L1 — Registry preamble overclaims repro coverage: "every warn/err
  code … pins a whole-compiler repro in Neo's `repro.test.ts`". Five
  ATM-E codes pin in `repro-request.test.ts`, not `repro.test.ts`, and
  the retired `ATM-W-TOKEN-CATEGORY-MISMATCH` pins no repro (it can
  never emit; convention step 5 is still satisfied via the Rust
  round-trip wire test). Reword, don't re-pin.
- L2 — Neo `codes.ts` comment "errors throw unchanged" is imprecise:
  ATM-E-* and ATL-E-SCAN-FAILED ride payloads as errors; only
  TST/STT/TGN -E- codes throw. Harmless (it only explains a
  warnings-only table).
- L3 — `message.rs` doc prose lists the gate as "properties,
  breakpoints, conditions, token paths, colors, and token categories",
  omitting token-reference and strict-category, while the registry
  names all 8. The gate itself is exact and identical in Rust and JS.
- L4 — Same failure class, different severity across modules:
  `ATM-E-PARSE` (error: file refused, siblings kept) vs
  `TST-W-PARSE-ERROR` (warning: recoverable shells kept). Both fit the
  convention's "affected part" latitude; the fallback behavior
  genuinely differs. Not a violation; noted for architects.
- L5 — `RS-W-X` / `RS-E-X` fixtures in `diagnostics/js/index.test.ts`
  sit outside the `RS-*-EXAMPLE-*` reservation. Test-only,
  shape-valid, registered namespace. Consider clarifying that the
  reservation names the preferred fixtures rather than the only legal
  test strings.
- L6 — Station/case IDs (`ATM-SITE-*`, `TST-RXP-*`, `NEO-DIAG-*`,
  `ATM-COND-*`, …) share the `NS-TOPIC-NN` look but are a separate,
  documented vocabulary (stations/cases, not diagnostics). Verified
  none rides a diagnostic `code` field: every wire `code` value in
  goldens and specs resolves to a real defined code.
- L7 — Fragments that look like codes but are filters/globs, each
  occurrence verified: `ATM-W-DYNAMIC-` / `ATM-W-UNFOLDABLE` prefixes
  in `startsWith`/regex filters, `ATM-W-DYNAMIC-*` in a README,
  `RS-W-EXAMPLE-*` / `RS-E-EXAMPLE-*` reservation globs, plus
  intentional negative fixtures (`*-NOPE`, `ZZ-W-SOMETHING`,
  `ATM-I-NAME`, `ATM-W-FROM-THE-FUTURE`, off-shape strings) — all
  confined to tests/docs, none emitted.
