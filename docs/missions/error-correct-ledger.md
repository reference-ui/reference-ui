# Error Correct emitter ledger (Slice 0)

Adopted from VOYAGE-LOG-2 map §A2, re-derived firsthand 2026-09-19/20 by the
Slice-0 ledger crew (lead + 3 nested workers over disjoint families + lead-read
static/global/hosts/harvest family). Every row traces to a `DiagnosticCode::`
token line read in this session; the mapper's `/tmp/obj2-map-A.md` was not used.

- Scope: every `ATM-W-*` / `ATM-I-*` emission site. Fatal `ATM-E-*` sites are
  listed as excluded (preserved unchanged, out of ledger scope per doc Slice 0).
- Base path for all `file:line` pointers:
  `packages/reference-rs/modules/atomic/src/`
  (one site lives one level up in `modules/atomic/native.rs` — excluded E).
- Line convention: the line of the `DiagnosticCode::…` token (one per row,
  grep-verified this session). The `push`/`ctx.warn` call is that line or up
  to 2 lines above; single-line emits are identical.
- Located = carries file / line / col on the default channel today.
- Exact key = full runtime `(system, when, prop, value, important)` five-tuple
  knowable at the site.
- Verdicts: **userspace** (intended: exact key known + declaration dropped, so
  the final plan provably lacks it — every such row names its proof witness);
  **compiler** (true/useful, no exact-miss proof — doc seeds all `DYNAMIC-*`,
  `UNFOLDABLE-SPREAD`, `HARVEST-SINK`, `DEAD-BRANCH` here); **drop**
  (duplicate / non-actionable / useless even to compiler dev).

## Counts

| verdict | rows |
|---|---|
| userspace | 6 |
| compiler | 90 |
| drop | 0 |
| unclassified | 0 |
| **total W/I rows** | **96** |

## Userspace (6) — every row names its witness

All six are resolve-phase DROPs with the exact authored key in hand. All six
are unlocated today, so each witness pairs `ATM-DIAG-09` (exact absent-key
proof) with `ATM-DIAG-04` (located resolve). Runtime-key parity evidence: the
plan key is built from RAW authored `when` strings (`runtime/builder.rs:31-39`
`lookup_key` over `decl.when`), and runtime queries raw `when` strings too
(`collectEntries` pushes `[...when, prop]` verbatim, neo
`runtime/css/css.ts`); a dropped authored declaration is therefore an exact
absent key, including unknown-condition drops (see R2 note).

| id | site | code | behavior | exact key? | witness |
|---|---|---|---|---|---|
| R1 | `resolve/mod.rs:48` | UnknownProperty (W, unlocated) | whole want dropped (`return Vec::new()` `:51`) | YES — `want.when/prop/value/important` + system in hand | `ATM-DIAG-09` (+ `04` location gap); backstop behind extract's own prop gates |
| R2 | `resolve/mod.rs:129` | UnknownCondition (W, unlocated) | whole want dropped (`lower_conditions` → None → `:53-55` empty) | YES — raw `when` + prop + value + important + system in hand; runtime key uses raw whens, no lowering needed (lead override of worker compiler-suggest; matches architect Q4 prime suspect) | `ATM-DIAG-09` (+ `04`); witness-hunt confirms a live runtime query |
| R4 | `resolve/unit.rs:94` | NonCanonicalNumeric, Number (W, unlocated) | pair dropped (`return None` `:97` → `?` at `resolve/mod.rs:148` → atom skipped) | YES — via upstream authored decl/want (prop post-expansion, value/when/important upstream) | `ATM-DIAG-09` (+ `04`) |
| R5 | `resolve/unit.rs:132` | InvalidCssValue, empty string (W, unlocated) | pair dropped (`return None` `:135`, same `?` path) | YES — via upstream authored decl/want | `ATM-DIAG-09` (+ `04`) |
| R6 | `resolve/unit.rs:139` | NonCanonicalNumeric, String (W, unlocated) | pair dropped (`return None`, same `?` path as R4/R5; S3 correction: S0 misread it as passthrough) | YES — via upstream authored decl/want (prop post-expansion, value/when/important upstream), same as R4 | `ATM-DIAG-09` (+ `04`); proven live by S4 (ATM-UNIT-02 ×3 proof replacements) |
| R7 | `resolve/unit.rs:164` | InvalidCssValue, Bool (W, unlocated) | pair dropped (`return None` `:167`, same `?` path; `border=true` intercepted earlier at `resolve/mod.rs:103`) | SPLIT by value (E9, O4-F6): `true` → YES, userspace-provable (runtime queries it, resolve drops it → genuine miss); `false` → compiler-at-most (runtime `isHole` skips, no query exists — never userspace). S3 adapters carry the value so policy splits by (code, value). | `ATM-DIAG-09` (+ `04`) for `true`; compiler channel for `false` |

## Compiler (90)

### C1. Extract dynamic refusals — `extract/expressions/walk/*`, `literal.rs`, `responsive.rs` (24)

All located (file always; line/col iff source present) via `walk/mod.rs`
`warn` (`:91`) / `info` (`:98`) / `warn_dynamic` (`:105-125`) helpers.
Structural fact: `DynamicRefusal` (`walk/mod.rs:47-52`) carries only
`{span, code, message, when}` — no value channel — so no refusal site can know
the full key. Sink recorded iff code ∈ `is_sink_code` six (`harvest/sinks.rs:71-81`).

| id | site | code | behavior | exact key? | sink? |
|---|---|---|---|---|---|
| D1 | `extract/expressions/walk/leaf.rs:56` | DynamicIdentifier (W) | ident → no want; siblings survive | NO — value unknown | yes |
| D2 | `extract/expressions/walk/leaf.rs:75` | MutatedBinding (W, plain `warn`) | stale ident refused, no want; siblings kept | NO — init stale | no |
| D3 | `extract/expressions/walk/leaf.rs:103` | DynamicUnary (W) | folded values pushed beside the refusal warn | NO | yes |
| D4 | `extract/expressions/walk/leaf.rs:112` | DynamicTemplate (W) | unary's template refusals, same coexistence | NO | yes |
| D5 | `extract/expressions/walk/leaf.rs:139` | DynamicBinary (W) | values + warns coexist | NO | yes |
| D6 | `extract/expressions/walk/leaf.rs:148` | DynamicUnary (W) | binary's unary refusals | NO | yes |
| D7 | `extract/expressions/walk/leaf.rs:157` | DynamicTemplate (W) | binary's template refusals | NO | yes |
| D8 | `extract/expressions/walk/member.rs:29` | PartialObjectProp (W) | leaves pushed; dropped dynamic arm named | NO — arm value unknown | no |
| D9 | `extract/expressions/walk/member.rs:46` | DynamicMember (W) | static-path total refusal, no want; siblings kept | NO — unresolvable path | yes |
| D10 | `extract/expressions/walk/member.rs:83` | DynamicMember OR MutatedBinding (W; code mapped `fold/element.rs:79-80`: MutatedBase→MutatedBinding, else DynamicMember) | resolving keys push wants; each miss warns; MutatedBase refused | NO | yes iff DynamicMember (MutatedBinding warns without recording — intentional per architect Q5a) |
| D11 | `extract/expressions/walk/member.rs:70` | PartialObjectProp (W) | values pushed; computed residue named | NO | no |
| D12 | `extract/expressions/walk/member.rs:114` | PartialObjectProp (W) | values pushed; chain residue named | NO | no |
| D13 | `extract/expressions/walk/member.rs:124` | DynamicExpression (W) | chain fallback, no want; siblings kept | NO | yes |
| D14 | `extract/expressions/walk/call.rs:30` | TokenCallRefused (W; code mapped `fold/token.rs:63`) | refused fold has `value: None` → no want; siblings kept | NO — path/fallback unfoldable | no (plain `warn`) |
| D15 | `extract/expressions/walk/call.rs:52` | DynamicExpression (W) | refused arg fragments warned; folded value still lowers | NO — fragment value unknown | yes |
| D16 | `extract/expressions/walk/call.rs:60` | PartialObjectProp (W) | value still lowers; callee residue noted | NO | no |
| D17 | `extract/expressions/walk/call.rs:89` | DynamicExpression (W, `warn_dynamic_expression`; called `walk/mod.rs:228`, `call.rs:77`) | no want; siblings kept | NO | yes |
| D18 | `extract/expressions/walk/branch.rs:97` | DeadBranch (I) | dead arm eliminated, live arm walked → live want pushed | N/A — intentional elimination, not a miss | no (info path; compiler per doc seed + `ATM-DIAG-07` opt-in contract, not drop) |
| D19 | `extract/expressions/literal.rs:109` | DynamicTemplate (W) | joined strings push wants; each unfoldable part warns at its span | NO — part value unknown | yes |
| D20 | `extract/expressions/responsive.rs:63` | MutatedBinding (W) | whole array refused, zero wants (arity honesty) | NO — spread contents stale | no |
| D21 | `extract/expressions/responsive.rs:75` | ResponsiveArraySpread (W) | whole array refused, zero wants | NO — unknown spread length/values | no |
| D22 | `extract/expressions/responsive.rs:128` | UnfoldableSpread (W) | object spread entry skipped; siblings kept | NO — keys/values unknown | no |
| D23 | `extract/expressions/responsive.rs:136` | UnfoldableKey (W) | entry skipped; siblings kept | NO — key itself unknown | no |
| D24 | `extract/expressions/responsive.rs:144` | PartialObjectProp (W) | entry still walked; key residue noted | NO | no |

Payload builders that emit nothing (not rows): `fold/element.rs:79-80`
(code map, consumed D10), `fold/token.rs:63` (code map, consumed D14),
`fold/call.rs` (message/span builders, consumed D15).

### C2. Extract object/css/jsx/fold structure — `extract/expressions/object/*`, `css`, `jsx`, `fold/call_lower` (50)

All located via `ObjectWalk::warn/info` (`object/mod.rs:83-90`) or
`ExtractContext::warn/info` (`extract/mod.rs:152-168`). No `warn_dynamic` in
this family (verified by full read) — all MutatedBinding sites use plain
`ctx.warn`, so none records a sink by design. Every spread site keeps siblings.
OM=`object/mod.rs`, SP=`object/spread.rs`, EN=`object/entries.rs`,
KY=`object/keys.rs`, AT=`object/attrs.rs`, LO=`object/lower.rs`,
CO=`object/condition.rs`, CS=`css/mod.rs`, JX=`jsx/mod.rs`, CL=`fold/call_lower.rs`.

| id | site | code | behavior | exact key? |
|---|---|---|---|---|
| O1 | `extract/expressions/object/mod.rs:130` | UnfoldableKey (W) | this prop dropped (`return`), siblings kept | NO — key dynamic, prop+value unknown |
| O2 | `extract/expressions/object/mod.rs:162` | UnknownProperty (W) | item dropped, no want/plan; silent under JsxAttributes | NO — value never folded, no valid runtime key |
| O3 | `extract/expressions/object/spread.rs:39` | UnfoldableSpread (W) | whole spread dropped, siblings kept | NO — spread shape unknown by definition |
| O4 | `extract/expressions/object/spread.rs:92` | DynamicExpression (W, `ctx.warn` — bypasses `warn_dynamic`, no sink; architect Q5b Slice-3 adapter fix) | refused fragments dropped, folded entries lower, siblings kept | NO — refusal fragment only |
| O5 | `extract/expressions/object/spread.rs:104` | UnfoldableSpread (W) | non-object fold dropped, siblings kept | NO — keys unknown |
| O6 | `extract/expressions/object/spread.rs:117` | MutatedBinding (W) | whole spread dropped, names the write | NO — mutated base |
| O7 | `extract/expressions/object/spread.rs:130` | UnfoldableSpread (W) | whole spread dropped (dynamic callee), siblings kept | NO |
| O8 | `extract/expressions/object/spread.rs:141` | PartialObjectProp (W) | kept entries lowered, dropped dynamic arm named | NO — arm has no static value by definition |
| O9 | `extract/expressions/object/spread.rs:216` | DeadBranch (I) | dead arm skipped, live lowered; not a style loss | N/A — branch notice (compiler per doc seed + `ATM-DIAG-07`) |
| O10 | `extract/expressions/object/spread.rs:228` | MutatedBinding (W) | whole spread dropped, siblings kept | NO |
| O11 | `extract/expressions/object/spread.rs:238` | UnfoldableSpread (W) | whole spread dropped (unresolvable name), siblings kept | NO |
| O12 | `extract/expressions/object/spread.rs:262` | UnfoldableSpread (W) | nested import spread dropped per marker, survivors lower | NO |
| O13 | `extract/expressions/object/entries.rs:30` | UnfoldableObjectProp (W) | this entry dropped, siblings kept | NO — no static value |
| O14 | `extract/expressions/object/entries.rs:41` | PartialObjectProp (W) | nested lowered, dropped value arm named | NO |
| O15 | `extract/expressions/object/entries.rs:56` | PartialObjectProp (W) | kept leaves minted, dropped arm named | NO — warn is about the unknown arm |
| O16 | `extract/expressions/object/entries.rs:116` | UnfoldableObjectProp (W) | `key.sub` dropped (`continue`), sibling subs kept | NO — no single value |
| O17 | `extract/expressions/object/entries.rs:135` | PartialObjectProp (W) | kept sub leaves minted, dropped arm named | NO |
| O18 | `extract/expressions/object/entries.rs:165` | UnfoldableObjectProp (W) | condition entry dropped | NO |
| O19 | `extract/expressions/object/entries.rs:176` | PartialObjectProp (W) | nested scoped+lowered, dropped arm named | NO |
| O20 | `extract/expressions/object/entries.rs:188` | NonObjectCondition (W) | scalar condition entry dropped, siblings kept | NO — structural, no (prop,value) leaf |
| O21 | `extract/expressions/object/entries.rs:211` | UnfoldableObjectProp (W) | `css` entry dropped (JsxAttributes only) | NO |
| O22 | `extract/expressions/object/entries.rs:221` | PartialObjectProp (W) | kept side lowered/silent, dropped arm named | NO |
| O23 | `extract/expressions/object/entries.rs:247` | UnknownBreakpoint (W) | `r` sub dropped (`continue`), siblings kept | NO — nested styles never walked |
| O24 | `extract/expressions/object/entries.rs:264` | UnfoldableObjectProp (W) | `r` entry dropped | NO |
| O25 | `extract/expressions/object/entries.rs:296` | UnfoldableObjectProp (W) | `r.sub` dropped | NO |
| O26 | `extract/expressions/object/entries.rs:306` | PartialObjectProp (W) | nested lowered, dropped arm named | NO |
| O27 | `extract/expressions/object/entries.rs:318` | NonObjectCondition (W) | scalar `r` sub dropped | NO — structural |
| O28 | `extract/expressions/object/keys.rs:37` | UnknownBreakpoint (W) | `r` key dropped (`continue`), siblings kept | NO — value never walked |
| O29 | `extract/expressions/object/keys.rs:72` | PartialObjectProp (W) | key folded+lowered by caller, dropped arm named; never co-emits with UnfoldableKey | NO |
| O30 | `extract/expressions/object/attrs.rs:126` | UnfoldableSpread (W) | nested import spread dropped, surviving block lowered | NO |
| O31 | `extract/expressions/object/attrs.rs:136` | MutatedBinding (W) | whole `css` value/spread dropped, sibling keys kept | NO |
| O32 | `extract/expressions/object/attrs.rs:150` | NonObjectJsxStyle (W) | this bag `css`/`r` value dropped, siblings kept; silent values skip | NO — block shape unknown |
| O33 | `extract/expressions/object/attrs.rs:208` | NonObjectJsxStyle (W) | this merge-list spread dropped, sibling elements kept | NO |
| O34 | `extract/expressions/object/lower.rs:110` | UnknownProperty (W) | unknown spread keys skipped by lower loops, known kept; silent under JsxAttributes | NO — site ignores the value, no single leaf; no plan minted |
| O35 | `extract/expressions/object/condition.rs:68` | NonObjectCondition (W) | scalar condition value dropped, siblings kept | NO — structural |
| O36 | `extract/expressions/object/condition.rs:103` | DeadBranch (I) | dead arm skipped, live lowered | N/A — branch notice (compiler per doc seed + `ATM-DIAG-07`) |
| O37 | `extract/css/mod.rs:61` | NonObjectCssArg (W) | `css(...args)` spread arg dropped, sibling args kept | NO |
| O38 | `extract/css/mod.rs:135` | DeadBranch (I) | dead arg arm skipped, live lowered | N/A — branch notice (compiler per doc seed + `ATM-DIAG-07`) |
| O39 | `extract/css/mod.rs:194` | UnfoldableSpread (W) | nested import spread dropped per marker, surviving arg lowered | NO |
| O40 | `extract/css/mod.rs:205` | MutatedBinding (W) | this arg/element dropped, siblings kept; suppresses generic refuse | NO |
| O41 | `extract/css/mod.rs:227` | NonObjectCssArg (W) | this arg dropped, siblings kept (silent-gated by caller) | NO — kind only, no (prop,value) |
| O42 | `extract/css/mod.rs:293` | NonObjectCssArg (W) | this merge spread dropped, sibling elements kept | NO |
| O43 | `extract/jsx/mod.rs:120` | NonObjectJsxStyle (W) | element-valued style attr dropped; non-style names silent | NO — element never a style value |
| O44 | `extract/jsx/mod.rs:325` | MutatedBinding (W) | this style-block value/spread dropped, sibling attrs kept | NO |
| O45 | `extract/jsx/mod.rs:351` | NonObjectJsxStyle (W) | this `css`/`r`/condition value dropped, siblings kept (silent-gated) | NO |
| O46 | `extract/jsx/mod.rs:414` | NonObjectJsxStyle (W) | this merge spread dropped, siblings kept | NO |
| O47 | `extract/fold/call_lower.rs:119` | UnknownProperty (W) | this folded entry dropped, siblings kept; no plan call | NO — `FenceValue` multi-shape, no single runtime key |
| O48 | `extract/fold/call_lower.rs:143` | UnknownBreakpoint (W) | this folded `r` sub dropped (`continue`) | NO — entry never lowered |
| O49 | `extract/fold/call_lower.rs:166` | NonObjectCondition (W) | non-object folded condition dropped | NO — structural |
| O50 | `extract/mod.rs:377` | TaggedTemplateSite (W) | whole `` css`…` `` ignored, siblings kept; non-`css` tags silent | NO — template not parsed as styles |

### C3. Resolve passthroughs + advisories (5)

All unlocated (bare `Diagnostic::warning`, no `with_location` — only the two
fatal token-reference errors in this family attach location). Warn-and-paint:
the value still reaches atoms/plans, so none is a miss.

| id | site | code | behavior | exact key? |
|---|---|---|---|---|
| R3 | `resolve/conditions/mod.rs:58` | MissingContainerRoot (W) | advisory over already-emitted atoms; drops nothing | NO — aggregate (`has_cq` × globalCss scan), no per-declaration key |
| R8 | `resolve/tokens/mod.rs:79` | MalformedOpacity (W) | PASSTHROUGH — `:82` returns raw value → atom minted unchanged | n/a (paints) |
| R9 | `resolve/tokens/mod.rs:139` | UnknownTokenPath (W) | PASSTHROUGH — warns, returns raw via `unbraced_fallback` `:121` → atom minted ("pass through as raw CSS") | n/a (paints) |
| R10 | `resolve/tokens/mod.rs:158` | UnknownColor (W) | PASSTHROUGH — same `Some(Borrowed)` path as R9 | n/a (paints) |
| R11 | `resolve/tokens/interpolate.rs:67` | UnterminatedBrace (W) | PASSTHROUGH — `:70` pushes raw `rest[open..]`, atom minted with literal brace text | n/a (paints) |

### C4. Static CSS / global stylesheet / hosts / harvest (11, lead-read)

StaticCss drops remove plan *supply*; nothing queries them, so no absent-key
proof is possible. Global surfaces emit static CSS rules, never runtime plans.
All unlocated except H1 (file-only) and M1 (located).

| id | site | code | behavior | exact key? |
|---|---|---|---|---|
| S1 | `static_css.rs:31` | UnknownProperty (W, unlocated) | entry dropped (`continue` `:34`), no want/authored | N/A — plan-source drop, no runtime query exists for it |
| S2 | `static_css.rs:77` | StaticWildcard (W, unlocated) | wildcard unexpanded (`return` `:80`), no wants | N/A — plan-source drop |
| G1 | `stylesheet/global/walker.rs:55` | EmptyAtRule (W, unlocated) | top-level at-rule block refused (`return` `:58`), never printed braceless | N/A — static CSS surface, no runtime plans |
| G2 | `stylesheet/global/walker.rs:155` | UnsupportedGlobalValue (W, unlocated) | list/nested conditional value dropped (`return` `:158`) | N/A — static CSS surface |
| G3 | `stylesheet/global/walker.rs:175` | UnknownCondition (W, unlocated) | unknown conditional key dropped | N/A — static CSS surface (distinct from resolve R2) |
| G4 | `stylesheet/global/walker.rs:196` | EmptyAtRule (W, unlocated) | nested at-rule refused, same as G1 | N/A — static CSS surface |
| G5 | `stylesheet/global/walker.rs:227` | UnknownCondition (W, unlocated) | unknown `_` condition dropped (whole subtree) | N/A — static CSS surface |
| G6 | `stylesheet/global/value.rs:38` | UnknownProperty (W, unlocated) | declaration dropped (`return Vec::new()` `:41`) | N/A — static CSS surface |
| G7 | `stylesheet/global/value.rs:133` | InvalidCssValue (W, unlocated) | boolean on standard property dropped (`Vec::new()` `:136`) | N/A — static CSS surface |
| H1 | `hosts/diagnostics.rs:9` | TraceSkipped (W, file-only: `with_location(file, None, None)` `:11`) | one warning per skipped StyleTrace file; siblings kept | N/A — host fact, not a style lookup |
| M1 | `extract/harvest/mint/mod.rs:153` | HarvestSink (I, located: `with_location(sink.file, line, col)` `:159`; pushed `:76`) | one info per deduped sink, net-new minted count; info only, drops nothing | PARTIAL — carries prop/when/count, no value (compiler per doc seed + `ATM-DIAG-07`) |

## Drop (0)

No W/I emitter qualifies: every site carries a distinct position or a distinct
refusal class useful to compiler development. The two nearest candidates were
considered and kept as compiler: the four DeadBranch infos (D18, O9, O36, O38 —
doc seeds `ATM-I-DEAD-BRANCH` compiler-begin and `ATM-DIAG-07` requires them
visible under opt-in) and HarvestSink (M1 — same seed + station contract).

## Excluded (not rows)

Fatal `ATM-E-*` — preserved unchanged, out of ledger scope (all verified this
session): `extract/mod.rs:180` MissingHostGraph, `extract/recipes/mod.rs:26,36`
RecipeArgShape, `:45` RecipeSpread, `:121,151` + `recipes/spec.rs:26`
RecipeClassName, `lib.rs:216` ParseError, `lib.rs:310` DuplicateRecipe,
`resolve/tokens/mod.rs:114` + `resolve/tokens/interpolate.rs:96`
UnknownTokenReference (both located, both drop), `modules/atomic/native.rs:100`
InvalidBaseSystem (N-API boundary whole-compile refusal).

Retired, never emitted (kept for wire stability): TokenCategoryMismatch
(`codes.rs` table only; zero emit sites).

Relays/helpers, not emitters (not rows): `runtime/builder.rs:133`
(`resolve_with_unique_diagnostics` re-push after `(severity,message)` dedup
`is_duplicate` `:142-145`); `extract/expressions/walk/mod.rs:91,98`
warn/info helpers + `:105-125` `warn_dynamic` funnel; `object/mod.rs:83,90`
and `extract/mod.rs:158,168` warn/info helpers; `extract/recipes/mod.rs:76`
`located_error` constructor; `stylesheet` portable-sheet throwaway sink
(`assembly.rs:71`).

Atlas `AtlasDiagnosticCode` sites (`atlas/src/analyzer.rs`, `resolver.rs`) are
a different subsystem's codes, not `ATM-*` — out of scope.

## Notes for Slice 1–6

- One legacy code, two verdicts (doc's policy audit predicts this):
  UnknownProperty is userspace at resolve (R1) but compiler at extract
  (O2, O34, O47) and on static/global surfaces (S1, G6); UnknownCondition is
  userspace at resolve (R2) but compiler on the global surface (G3, G5);
  InvalidCssValue is userspace at resolve (R5, R7) but compiler on the global
  surface (G7); NonCanonicalNumeric drops at R4 and at R6 (S3 correction:
  R6 was misread as passthrough in S0 — both drop; S4: moved to
  userspace — O7 R5). Slice 3 adapters must
  carry the site, not just the code.
- R2 override rationale (lead, firsthand): the resolve-family worker suggested
  compiler on the theory that an unlowered `when` cannot form an exact key.
  Overruled: both key authorities use RAW `when` strings — compile
  (`AuthoredDeclaration::lookup_key`, `runtime/builder.rs:31-39`) and runtime
  (neo `collectEntries`, `runtime/css/css.ts`) — and plan minting is gated on
  resolve success (`build` `:182-183` pushes a plan only when `resolve_entry`
  returns declarations; `resolve_entry` `runtime/builder.rs:198`, want-rebuild
  `:212-220`, rebuilds the want with raw whens). A dropped unknown-condition
  want is therefore an absent exact key;
  witness-hunt confirms live-query reachability.
- Silent exact-key-knowable drops found during the resolve sweep (no emitter —
  informational, not rows; witness-hunt input): `resolve/unit.rs:161`
  `AtomValue::Null => None` (intentional hole-strip); `resolve/mod.rs:84-86`
  `is_runtime_owned` (`variant`/`colorMode`) → `Some(vec![])`, whole want
  silently dropped. Both knowable upstream; neither warns today.
- D10/MutatedBinding-via-`warn_dynamic` records no sink by `is_sink_code`
  design — intentional per architect Q5a; O4 spread `DynamicExpression` bypass
  is the Q5b Slice-3 adapter fix. Both confirmed firsthand.
- Completeness: `DiagnosticCode::` / `ATM-W-` / `ATM-I-` sweep across
  `packages/reference-rs` shows emitters only in `modules/atomic/src`,
  `modules/atomic/native.rs` (E only), goldens/specs/tests, and the
  out-of-scope Atlas codes. Family partition covered every non-test source
  hit: walk/literal/responsive + fold maps (D), object/css/jsx/call_lower (O),
  resolve (R), static/global/hosts/harvest (S/G/H/M).


