# Fasthull 4b architect rulings — "plan verdicts" (D2 tiered)

Architect, read-only role, rotation 2. All cites lead-read firsthand in this
tree. Paths below are under `packages/reference-rs/modules/atomic/src/`
unless noted. Rulings first:

- **Tier (A): CONCUR** (placeholders + carried keys + render.rs-internal fact
  memo; `render_expected` memo EXCLUDED — callers out of boundary).
- **Tier (B): KILL-B** — the sound predicate is a ~200-line shadow-resolve
  over 6+ replicated private fns with uncensused coverage and permanent
  divergence risk; not provable to the verdict-identical standard day-0.
- **Insert-skip: RIDES (A)** — subset proof below + byte-identity tripwire.

(A)-only is a complete tiered landing, not GAPS.

## 1. EMPTINESS-GATE PROOF (tier B) → KILL-B

Gate: `build()` pushes a plan iff `!declarations.is_empty()`
(`runtime/builder.rs:143-153`), after dedupe by `decl.lookup_key`
(`builder.rs:138-141`). Shapes: scalar (`resolve_entry`, `:159-195`),
array (`resolve_array`, `:197-237`: null-skip `:206-208`,
`breakpoint_for_index` `:209-211` = scale `names[idx]`
(`base-system/src/breakpoints.rs:98-100`), per-elem convert+resolve),
object (`resolve_object`, `:239-284`: `$r`/`$token` branch `:163-167`,
null-skip `:248-250`, per-key convert+resolve, all-skip ⟺ empty).

### 1a. Every refusal/zero-atom path, and what the predicate must do

CONVERT (`runtime/values.rs:36-51`): scalars always `Some` (`:121-135`,
total). Zero paths: (C1) malformed-`$token` object → `None` SILENT
(`:55-63`); (C2) numeric `$r` failing `collapse_r_number`
(`resolve/lexical.rs:174-183`) → `None` + `NonCanonicalNumeric`
(`values.rs:74-77,87-119`). Non-numeric `$r` is always `Some` (`:80-81`).
No extract producer emits `$r` JSON (grep: `$r` appears only in
`values.rs`, `serializer.rs` test, `builder.rs:164`, goldens/tests) — so
(C2) has NO pass-1 twin: its diagnostic is plan-pass-UNIQUE. Any (B) shape
must fall back to full resolve on `$r`-shaped values.

RESOLVE (`resolve/mod.rs:127-163`), per want: (R1) unknown prop →
early-return zero + `UnknownProperty` (`:134-145`), BEFORE macro/shorthand
(`:149`) — so `!is_known_style_prop ⟹ zero atoms` is SOUND
(`canon/src/lib.rs:27-33`), but the ⟸ is false (many zero paths with known
props). (R2) any `when` lowering `Unknown` → zero + `UnknownCondition`
(`:146-148`, `:246-278`; `lower_when`, `conditions/mod.rs:31-48`;
`base` skips). (R3) runtime-owned (`variant`/`colorMode`, both
*known* props) → `Some(vec![])` SILENT (`mod.rs:208-210`) — the ONLY
empty expansion in `resolve/`: grep for `Some(vec![])`/`Some(Vec::new())`
returns only `:209`, and every shorthand `Some` is a ≥1 vec literal or
guarded accumulation (`pair.rs:20-23` 2-elem; `flex.rs:34` 1-elem;
`border.rs:66,75,89` + `:109-123` guarded ≥1; `dimensional.rs:28` +
`:37-53` 4/4/4/4-elem; macros: font ≥1 `font/family.rs:15`, weight 1,
size 2, container ≥1, gradient 3). (R4) unrealizable extension → zero +
warn (`:175-200`); ORDERING TRAP: `textGradient` is IN
`UNREALIZABLE_EXTENSIONS` (`canon/src/css/unrealizable.rs:11-33`) but
`lower_macro` claims it first (`mod.rs:224-226`) — a naive
`is_unrealizable` leg must exclude macro-claimed props. (R5) per-pair
`resolve_atom_value` all-refuse (`unit.rs:224-253`: `Null` SILENT `:232`;
`Bool` refuses `:234-249`; numbers/strings through the canonical fence
`:142-220`; `Token` always `Some` `:252`) then `tokens::resolve_token_value`
(`tokens/mod.rs:30-51`): `None` iff brace-`Missing`
(`interpolate.rs:29-51,90-119`: nonempty `{…}` naming no token) or
whole-braced unknown (`tokens/mod.rs:123-130`). Rhythm is total and silent
(`rhythm/mod.rs:81-92`). Warn-and-paint passthroughs (`UnknownTokenPath`,
`UnknownColor`, `MalformedOpacity`, `UnterminatedBrace`) emit atoms AND
warnings — skipping resolve drops the warning even when the verdict is
"nonempty".

### 1b. The two claim directions, and why both are hard

A sound (B) predicate has three exits per decl: EMPTY-skip (no plan, no
resolve), NONEMPTY keys-only (plan, no resolve), UNKNOWN (full resolve).
Both claim exits must be sound on atoms AND diagnostics:

- Claim-empty-when-emit (drops plans → proof warnings grow, the W2b
  failure mode). Live members: `border`+`Bool(true)` macro → 2 atoms
  (`mod.rs:227-235`); multi-pair expansions with ≥1 surviving pair
  (dimensional/border partial; gradient CLIP/INK fixed strings always emit);
  per-element verdicts in arrays/objects (one bad `when`/value ≠ all-skip);
  `textGradient`-style ordering traps.
- Claim-nonempty-when-empty (extra plan → `render_rejects`/`render_causeless`
  wrongly drop/suppress lines, `proof/render.rs:78-132`). Live members:
  `size`/`Bool(false)` (both pairs refuse), all-fenced multi-tokens,
  per-pair brace-`Missing`, `Bool`/`Null`, fenced numbers, empty strings,
  whole-braced unknown tokens, runtime-owned, unrealizable, unknown whens.
- Diagnostics leg: skipping resolve is diagnostics-safe only if the skipped
  call emits nothing new. Pass-1 twins cover most messages (dedup is
  message-equality, `values.rs:140-144`; plan pass runs after pass-1,
  `assembly.rs:63-81`; plan session has `sink: None`, `builder.rs:70-78`,
  so it never emits facts), BUT twin-existence needs an exhaustive audit
  over ~10 extract push sites plus JSON round-trip spelling stability
  (pass-1 numbers are f64-`Display`, `literal.rs:37-44`; plan numbers are
  serde-`Display` via `ast_value.rs:237-245` — `1e21` spells differently;
  `inf`/`NaN` plan as `Null`!), and `$r`-fenced has NO twin at all.

The twin-free alternative (silence-gated Design S: skip resolve only when
the verdict is predicted AND resolve provably emits nothing) is specifiable
— scalar legs over `is_known_style_prop`, `lower_when` (called, not
replicated), `is_non_canonical_numeric`, replicated `canonical_number` /
`looks_like_token_path` / `malformed_opacity` / token-category routing /
`split_opacity`, dict-hit checks, `{`/`}` fallback, macro/border/flex/radius
fallback, dimensional per-token recursion — but that is a ~200-line
shadow-resolve replicating 6+ private fns (`unit.rs:29-44,184-186`,
`tokens/mod.rs:254-259,325-346,365-371` and `scale.rs`, still unread),
with coverage UNCENSUSED (dotted tokens and color bare values dominate real
loads; the gated set may save +10ms, not +40) and PERMANENT divergence risk
(every resolve semantic change must mirror; the 244-case sweep ≠ adversarial
loads). Specifiable is not proven. **KILL-B.** (A)-only is VERIFIED.

## 2. SUBSET PROOF (insert-skip rides (A))

Claim: every atom the plan pass inserts is already in the set, so DELETING
the `insert` calls (`builder.rs:191,232,279`) is a no-op. (The saving is
removing hash/eq/alloc per atom, not contains-checking.)

- Twins: every authored site pushes a pass-1 want with identical
  (prop, value, when, important): `entries.rs:66-91` (paired in one fn),
  `object/mod.rs:218-236` + `walk_expression` (doc-claimed leaf mirror,
  `ast_value.rs:259-265`), jsx string/bare/container (`jsx/mod.rs:83-90,134-146,193-205`),
  harvest (`harvest/mint/mod.rs:149-170`, paired), static
  (`static_css.rs:200-212`, paired), `call_lower.rs:70-86` (paired),
  responsive arrays/objects (same `breakpoint_for_index`, null/hole parity
  both sides, `responsive.rs:28-52` + `builder.rs:206-211`). `$r` /
  malformed-`$token` have no producer (§1a) — unreachable on real loads.
- Atom-equality: `CssValue`s are canonical (numeric stems via
  `render_decimal`, same f64 → same stem both spellings;
  fence verdicts are value-functions; strings/bools/tokens byte-identical;
  `inf`→`Null` goes plan-FEWER, the safe direction). Same inputs →
  deterministic same expansion/pairs/atoms. `important` mirrors at every
  paired site; the two doc-mirrored sites ride the tripwire.
- Empirical: C4 measured 32,281/32,281 rewants hit, 0 atom mismatches on the
  locked load; `site_plan_tests.rs:42-65` (`assert_plans_point_at_sheet`)
  asserts plan classes ⊆ css-map classes firsthand across 13 tests.
- Order-neutrality: `AtomSet` is `FxHashSet` (`atom/set.rs:12-14`); inserting
  a present atom returns false without table mutation (std contract), so
  skipping no-op inserts cannot change iteration order. Belt-and-braces:
  the sheet sorts (`stylesheet/emitter/mod.rs:68`, `cascade/mod.rs:116`),
  `CssRuntime.classes` is a `BTreeMap` (`runtime/mod.rs:28-31`), `atom_count`
  is `len()`, and `check_container_root` runs pre-plans (`assembly.rs:64`).

**Insert-skip RIDES (A).** Implementer's tripwire: css byte-identity every
scale + churn, 244-sweep ZERO deltas, cargo diagnostics asserts unchanged,
GHOST css goldens green. Any delta kills the sub-move, keeps (A).

## 3. TIER (A): CONCUR

Resolve runs, the emptiness gate runs, verdicts and diagnostics are exact by
construction. Three sub-moves:

(a) PLACEHOLDER DECLARATIONS (skip `derive_slot` + `class_name_with_system`
per atom): unread-proof VERIFIED firsthand — slim serde drops `style_plans`
on `!proof` (`native.rs:126-164`, `SlimCompileResult` has no plans field);
`OwnedLookupKey::from(plan)` takes only the five-tuple, declarations ignored
(`proof/plans.rs:13-24`); the sole in-compile plan reader is `render_session`
(`assembly.rs:117-122`; `assembly.rs:128` moves plans into the result;
`partition_channels`, `lib.rs:272-292`, touches diagnostics only); no
`.declarations` reader exists outside builder/tests/goldens (grep).
Proof channel restores FULL plans: `wants_proof()` ⟺ `logs` contains
`'proof'` (`types.rs:58-62`, threaded `lib.rs:119`); `Harness precedent:
`compileCase` defaults `logs: ['proof']` (`tests/helpers.ts:119-128`),
`gates.rs:36` sends proof. `PlanBuilder::new` callers include harness files
(`runtime/tests.rs` ×7, `emitter/tests.rs:131` which asserts plan classes in
the sheet, `goldens/composed:242`) — keep `::new` signature, DEFAULT-FULL
(`build()` unchanged); assembly opts into diet on `!proof` via a new
ctor/method (e.g. `diet()` + `build_diet`/`build_with_keys`) used ONLY at
`assembly.rs:79-81`. Placeholder value: empty strings (zero alloc).

(b) CARRIED CANONICAL KEYS: `build()` already serializes `decl.lookup_key`
per decl for dedupe (`builder.rs:138`) through the one authority
(`serializer.rs:62-72`); `emitted_keys` re-serializes the same five-tuple
(`proof/plans.rs:26-31` via `facts.rs:29-42`). WITHOUT touching
`runtime/plan.rs`: add `build_with_keys` sidecar in `builder.rs` returning
`(plans, Vec<String>)` (deduped keys in plan order) + `render_session_with_keys`
in `proof/render.rs` taking the carried set instead of `emitted_keys(plans)`.
Pin `dedupe-key == emitted-key` with a unit test (incl. object-value key
sorting + `when`/`important` riding, `facts.rs:314-331` style).

(c) FACT-KEY MEMO: each `ExactLookupExpected` key re-serializes in
`collect_exact` (`render.rs:69-72`) AND `render_causeless` (`render.rs:124`).
In-file memo shape (no signature ripple): `Proof::collect` stores
`exacts: Vec<(&OwnedLookupKey, String)>` — serialize once, reuse in
`render_causeless`/`is_explained`. EXCLUDED from (A): `render_expected`
(`policy/analysis.rs:13-26`) memo — its callers (`Policy`, `channels/render.rs:36`)
are out of boundary; a memo param ripples outward. State the save without it.

## 4. BOUNDARY + GUARDRAILS

- Boundary CONFIRMED: (A)+insert-skip+memo-as-ruled fits `runtime/builder.rs`
  (diet build + sidecar) + `assembly.rs` (diet opt-in + key passing) +
  `diagnostics/proof/{plans,render}.rs` (pin test + `with_keys` entry + memo)
  + `diagnostics/facts.rs`/`diagnostics/policy/analysis.rs` (no change
  expected — ceiling, not floor). No `plan.rs`, `unit.rs`, `resolve/*`,
  `token/*`, bridge, TS, emitter, or load edits.
- RSS-unregressed-by-design: strictly less materialization (empty-string
  placeholders, zero re-serialization, no second key set); proof path
  byte-identical to today.
- Bundle-exact: no emitter touch; diagnostics verdict-identical by
  construction (resolve + gate run; keys are the same strings).
- 244-sweep tripwire (lead-built temp `tests/w4b-sweep.test.ts`, deleted at
  close; PRE `/tmp/w4b-sweep-pre.json`: 244 cases, 0 errors): implementer
  runs post + `cmp` ZERO deltas; cargo diagnostics asserts unchanged;
  bench css/data/baseSystem bytes `cmp`-clean all scales + churn.
