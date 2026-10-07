Status: DONE — all 4 crews complete, landed by captain

# HINTS-4 ARC-2 EXEC log

Four crews, sequential shared checkout, per
`.agents/missions/hints-0925/arc2-rule.md` specs. Each appends its
section: files, proof commands + results, re-bless diffs, open flags.

## Crew 1 — atomic kernel (2026-09-25, NO COMMITS)

Scope: policy/{extract,resolve,proof,hosts}.rs, resolve/* (incl. new
resolve/suggest.rs), runtime/values.rs, static_css.rs,
stylesheet/global/*, channels/render.rs note re-attach, lines.rs identity
check, resolve suggestion threading. Untouched per split: all extract/*
ctx.warn sites (Crew 2), satellites (Crew 3), Neo (Crew 4).

### Design calls (exec's discretion per rule)

- Suggestion threading: centralized in `ResolveSession::emit`, which
  precomputes via new `resolve/suggest.rs` (`suggestion_for_outcome`)
  where `session.system` is in reach. Rides `ResolveReport.suggestion`
  + `DiagnosticFact::ResolveOutcome.suggestion` (new field, both), so
  pushed lines and compiler re-renders share one ranking. Gated through
  `diagnostics::message::suggest_for_code` (never past the gate).
- Candidates: property = CANONICAL_PROPERTIES + ALIASES + REFERENCE_PROPS
  (canon only, reused by static_css/global direct pushes); condition =
  NAMED_CONDITIONS + system condition keys + breakpoint names; token path
  = system token keys; color = colors-category keys + scale-relative
  rests + canon NAMED_COLORS. Trailing `/opacity` stripped for ranking.
- No-suggestion fallback: fix line alone (name echo beats static).
- ContainerRoot advisory + reason-carrying proof lines: no engine help
  (ruled static-wins). Proof message rewrite preserves the pushed line's
  help (reason rides in the message, help stays accurate) — pinned by a
  new render.rs assertion.
- ExtractNote: new `help` field + `extract_note_with_help` sibling;
  `extract_note` signature unchanged so Crew 2's six call sites compile
  untouched. channels/render.rs re-attaches; lines.rs identity (code +
  location + message) ignores help — pinned by a new test.

### Files (20 modified + 1 new + 35 goldens)

- New: resolve/suggest.rs (261 lines).
- Help renders: diagnostics/policy/{extract,resolve,proof,hosts}.rs,
  diagnostics/policy/mod.rs (`Policy::attach_help` shared helper).
- Threading: diagnostics/{facts.rs,adapters/extract.rs,
  adapters/resolve.rs,channels/render.rs}, resolve/mod.rs (emit),
  resolve/conditions/mod.rs + runtime/values.rs (`suggestion: None`,
  non-suggestion codes), diagnostics/proof/rejects.rs (message-only,
  `suggestion: None`).
- Direct pushes: static_css.rs (UnknownProperty+suggest, StaticWildcard),
  stylesheet/global/value.rs (UnknownProperty+suggest, bool
  InvalidCssValue), stylesheet/global/walker.rs (warn_help: EmptyAtRule
  x2, UnsupportedGlobalValue, UnknownCondition x2 with theme suggest;
  old warn() removed).
- Tests touched: policy/* + adapters + channels/mod + proof/{lines,
  render} + resolve/tests (new end-to-end suggestion threading test) +
  static_css. resolve/tests.rs +403 lines etc. — soft-length warnings
  only (see q below); in-tree precedent (channels/mod, proof/render
  already over soft).

### Proof commands + results

- `pnpm agentrs c atomic` → ok: 686 + 1 + 1 + 7 + 5 passed, 0 failed
  (incl. new help/suggestion assertions).
- `pnpm agentrs b` → Native addon ready (19 pre-existing warnings; none
  in new code — verified via q --clippy file attribution).
- `pnpm agentrs v atomic` (pre-bless) → 35 failed / 267 passed, all 35
  in tests/cases.test.ts (station diagnostics goldens, as expected).
- `UPDATE_GOLDENS=1 pnpm agentrs v atomic` → 13 files / 302 passed.
- `pnpm agentrs v atomic` (post-bless, unflagged) → PASSED (302/302).
- `pnpm agentrs q` on all 22 touched files → 0 violations, 9 soft
  warnings (8 file-length-soft incl. 2 pre-existing overs; 1 five-arg
  `extract_note_with_help` ctor mirroring `extract_note` — Crew 2 may
  reshape when wiring warn_help).
- `pnpm agentrs q --clippy` on suggest.rs + policy/ → 0 violations, no
  warnings in new code.

### Re-bless diff review (ONLY added help keys)

35 files, all `tests/cases/*/output/diagnostics.json`, +269/−64
(deletions are `}` → `},` JSON punctuation per added help block).
Independent check (`/tmp/crew1-golden-check.js`, kept for re-run):
per-diagnostic JSON compare — counts identical, every non-help key
byte-identical, no help key changed or removed, help only added.
VERDICT: ONLY-ADDED-HELP (per-file +help counts e.g. ATM-EXT-01 10/10,
ATM-UNIT-02 4/4, ATM-TOKEN-12 1/4 — unhelped lines are Crew 2 note
codes, errors, or static-wins codes). Spot checks: `did you mean
`_hover`?` + `use a condition from the theme`; `did you mean `pink`?`
+ `use a color token or CSS color`; `drop 'translateX'; the dialect has
no served css form`; `write '0x10' as a plain decimal on 'top'`.

### Open flags for later crews

- Crew 2: `extract_note_with_help(location, sev, code, message, help)`
  is ready; wire `warn_help` on the 3 ctx types through it. Note
  re-attach + strip identity already handle `help: Some`.
- Crew 4: engine help rides the existing wire `help` field — no contract
  change; `pnpm agentrs b` (build:js equivalent) already done this crew.

## Crew 2 — atomic extract notes (2026-09-25, NO COMMITS)

Scope: all `ctx.warn` sites in extract/*, fold/token.rs reason help,
adapters/extract.rs `extract_note` help field, `warn_help` on the 3 ctx
types (no `warn_default` variant — LEAF-11 flag honored). Untouched per
split: policy/resolve/runtime/static_css (Crew 1), satellites (Crew 3),
Neo (Crew 4). Verified: worktree diff outside Crew 1's files + goldens
is exactly 18 extract/* files + 1 new file.

### Design calls (exec's discretion per rule)

- `warn_help(span, code, message, help: Vec<String>)` on ExtractContext
  (`extract/mod.rs`), ExpressionWalk (`walk/mod.rs`), ObjectWalk
  (`object/mod.rs`): pushed line via `Policy::attach_help`, fact via
  Crew 1's `extract_note_with_help(..., Some(help))`. No `warn_default`
  sibling (LEAF-11: message already carries the fix).
- Suggestions are Crew 2-local in new `extract/suggest.rs` (zero shared
  code with Crew 1's `resolve/suggest.rs`): `suggest_property` over
  canon `CANONICAL_PROPERTIES` + `ALIASES` + `REFERENCE_PROPS`,
  `suggest_breakpoint` over `ctx.breakpoints.names()`, both gated
  through `diagnostics::message::suggest_for_code`, `suggestion_lines`
  heading the fix with `did you mean` — same shapes, separate module.
- `handle_condition_value` and `lower_call_condition` take a new
  `key: &str` param (threaded through 7 call sites) instead of the
  rule's `when.last()`: the `r` path pushes a `@container (min-width:
  …)` query string onto `when`, so `when.last()` would echo internal
  syntax the author never wrote. Help names the authored key (`md`,
  `_hover`) on every path. Rule intent preserved, wording corrected.
- Spread DYNAMIC-EXPRESSION (`spread.rs:95-99`) has no prop in scope, so
  the rule's `for '{prop}'` phrase drops: `hoist the expression into a
  static literal or variant`.
- Static-wins sites keep bare `ctx.warn` (no help): UnfoldableKey x2,
  TaggedTemplateSite, generic UnfoldableSpread (walk fallback,
  non-object call result, dynamic call, responsive object), rootless
  spread-miss (`spread_base_name`/`member_root_name` empty).
- Import-residue markers carry `define '{local}' as a static style
  object or inline it` via a new `UnfoldableSpread::local()` accessor
  (`extract/resolver/values.rs`) — the name the marker names.
- `adapters/extract.rs` help field + `extract_note_with_help`:
  already landed by Crew 1, verified present, not re-touched.

### Files (18 modified + 1 new + 4 goldens)

- New: extract/suggest.rs (unit-tested: property/breakpoint near+far,
  two-line/one-line shapes).
- `warn_help` + imports: extract/mod.rs, expressions/walk/mod.rs,
  expressions/object/mod.rs (UnknownProperty suggest at the inline
  gate; `key.clone()` for the threaded condition key).
- Reason help: fold/token.rs (`TokenRefusal::help`, 5 reasons).
- Note sites → `warn_help`: walk/{leaf (mutated hoist), member x3,
  call (token refusal + call residue)}, responsive.rs (mutated, array
  spread, key residue), object/{keys (breakpoint suggest + residue),
  entries x15 (6 unfoldable key/sub, 6 partial residue, 2 non-object
  condition, 1 breakpoint suggest), lower (spread-key suggest),
  condition (scalar + key threading), attrs (mutated bag, css/r kind,
  merge spread, marker), spread (dynamic-expr, mutated x2,
  miss-by-name, call residue, marker)}, css/mod.rs (arg kind, spread
  arg x2, mutated arg, marker), jsx/mod.rs (element value, kind,
  mutated attr, merge spread), fold/call_lower.rs (unknown prop,
  unknown breakpoint, condition + key threading).
- Accessor: extract/resolver/values.rs (`local()`).
- Tests: 38 new (6 direct unit: 3 suggest + 1 token-reason + 2
  warn_help-plumbing; 32 compile e2e incl. multi-file cycle-marker,
  JSX bags, fence spreads, IIFE call residue) asserting exact help on
  pushed lines and compiler-channel re-renders.

### Proof commands + results

- `pnpm agentrs c atomic` → ok: 724 + 1 + 1 + 7 + 5 passed, 0 failed
  (38 new: 686 → 724 on the lib target).
- `pnpm agentrs b` → Native addon ready (19 pre-existing warnings).
- `pnpm agentrs v atomic` (pre-bless) → 6 failed / 296 passed, all 6 in
  tests/cases.test.ts golden stage (DIAG-05/07/14, SITE-20/49/83).
- `UPDATE_GOLDENS=1 pnpm agentrs v atomic` → PASSED.
- `pnpm agentrs v atomic` (post-bless, unflagged) → PASSED (302/302).
- `pnpm agentrs q modules/atomic/src/extract` → 0 violations, soft-only
  warnings (several files newly over the 365 soft line limit from test
  growth; hard limit is 1500; pre-existing overs at HEAD noted).
- `pnpm agentrs q --clippy` on suggest.rs → 0 warnings in new code.

### Re-bless diff review (ONLY added help keys)

39 files vs HEAD (Crew 1's 35 + 4 new: DIAG-05/07, SITE-49/83).
Independent check (`/tmp/crew2-golden-check.js`, kept for re-run):
per-diagnostic JSON compare over all 39 — counts identical, every
non-help key byte-identical, pre-existing help arrays byte-identical,
74 lines gained help, 0 failures. VERDICT: ONLY-ADDED-HELP. Spot
checks: `did you mean \`float\`?` + `remove 'fooBar' or check its
spelling`; `remove 'frobnicate' or check its spelling` (fix-only);
`did you mean \`md\`?` + `use a breakpoint from the theme`.

### Open flags for later crews

- Crew 4: Crew 2 helps ride the same wire `help` field; station
  goldens re-blessed again this crew (`pnpm agentrs b` re-run).
- Note: `r`-path NonObjectCondition help names the authored sub key
  (`md`), not the pushed `@container` query — deliberate deviation
  from the rule's `when.last()` note, see design calls.

## Crew 3 — satellites (2026-09-25, NO COMMITS)

Scope: atlas + tasty + styletrace + typegen `diagnostics/mod.rs`
constructors with the ruled help lines + wire-byte test updates.
Untouched per split: atomic (Crew 1/2), Neo (Crew 4). Verified: crew
diff is exactly 4 diagnostics files + 8 goldens (no atomic/Neo paths).

### Design calls (exec's discretion per rule)

- Single-seam change only: `.with_help(vec![format!(...)])` chained in
  each constructor; call-site context is exactly the constructor params
  (verified at each caller: atlas analyzer/resolver, tasty
  pipeline/merge/index/manifest, typegen collect.rs).
- Return shape: terminal `.with_help()` returns the `Result` directly
  (no `Ok(...?)` wrapper — that trips `needless_question_mark`).
- Static-wins honored with locked `help: None`: tasty PARSE-ERROR and
  styletrace SKIPPED-FILE carry no engine help; doc comment + test
  assertions pin the flag. Styletrace message stays byte-identical
  (no parse-vs-read classification).
- Typegen suggestion codes: help is the fix action only, asserted NOT
  to repeat the `did you mean` message line.
- AbsentStrictCategory follows the rule literally: `declare {name}
  tokens or drop '{name}' from strict` (bare category word, backticked
  name).

### Files (4 modified + 8 goldens)

- Help renders: atlas (4 ctors), tasty (4 ctors, parse_error exempt),
  typegen (9 ctors), styletrace (doc-only, no help).
- Tests: new `every_warning_pins_its_exact_wire_bytes` in atlas (4
  rows) + tasty (5 rows, parse_error help-less); typegen wire test
  re-pinned (9 rows) + per-row help asserts + no-repeat asserts;
  styletrace wire test unchanged + `help.is_none()` asserts.

### Proof commands + results

- `pnpm agentrs c atlas|tasty|styletrace|typegen` → ok: 24 + 82 +
  58 + 65 passed, 0 failed (incl. new pinning tests, run by name).
- `pnpm agentrs q` on all 4 files → 0 violations, 0 warnings.
- `pnpm agentrs q --clippy` on all 4 files → 0 warnings in crew
  files (5 `needless_question_mark` found + fixed during exec;
  remaining workspace warnings are pre-existing, incl. atomic's 19).
- `pnpm agentrs b` → Native addon ready (19 pre-existing warnings).
- `pnpm agentrs v` pre-bless → atlas 3 failed / 58 passed, tasty 5
  failed (all golden stage, as expected); styletrace 31/31 + typegen
  48/48 PASSED unflagged (no goldens pin satellite help there).
- `UPDATE_GOLDENS=1 pnpm agentrs v atlas|tasty` → PASSED.
- Post-bless unflagged → atlas 61/61, tasty 83/83, styletrace
  31/31, typegen 48/48 PASSED.

### Re-bless diff review (ONLY added help keys)

8 files (3 atlas diagnostics.json + 5 tasty manifest.js).
Independent check (`/tmp/crew3-golden-check.mjs`, kept for re-run):
per-diagnostic JSON compare — counts identical, every non-help key
byte-identical, 13 warnings gained help, 0 failures. VERDICT:
ONLY-ADDED-HELP. (TST-ERR-01 parse-error golden untouched —
static-wins confirmed end to end.)

### Open flags for later crews

- Crew 4: satellite helps ride the existing wire `help` field — no
  contract change; `pnpm agentrs b` re-run this crew.

## Crew 4 — neo render (2026-09-25, NO COMMITS)

Scope: `formatVerboseWarningLine` tail rule in format.ts,
output.test.ts additions, diag case-spec sweep, agentneo q + tsc.
Untouched per split: reference-rs (Crews 1–3), lib, core. Verified:
neo diff is exactly 2 files (format.ts + output.test.ts); RS contact
was build-only (`agentrs b`, `build:js`), no RS source touched.

### Design calls (exec's discretion per rule)

- New `verboseTail(entry)` helper: non-blank engine `help` joined
  with `'; '` wins, else `warningHintFor(code)`, else no tail.
  Exactly one tail, never both; static table RETAINED as fallback
  (all existing static-tail pins pass untouched).
- Defensive trim-filter on help lines: transport already rejects
  blanks, so a blank here reads as absent and falls back to static
  rather than printing an empty tail — pinned by a test.
- Codeless legacy items with help render the engine tail (rule:
  engine wins even when `code` is undefined); codeless without help
  still prints bare (existing pin untouched).
- `diagnosticKey` already includes `help` JSON — no change, per rule.
- `json.ts` surfaces `help` verbatim via `toCanonicalRecord`
  (transport.ts:99-101); existing json.test.ts help pins pass.

### Files (2 modified)

- `packages/reference-neo/src/diagnostics/format.ts`: `verboseTail`
  + rewired `formatVerboseWarningLine`; header/function comments
  updated to the tail rule.
- `packages/reference-neo/src/cli/output.test.ts`: 5 new cases —
  engine-help-first, join-with-`;`, never-both (contains engine,
  excludes static, exactly one `—`), codeless-with-help renders,
  blank-help falls back to static.

### Proof commands + results

- `pnpm agentrs b` → Native addon ready (existing darwin-x64 binary
  reused; Crews 1–3 build still current).
- `pnpm --filter @reference-ui/rust run verify:native` → Verified 1
  native binary: darwin-x64 (fresh).
- `pnpm --filter @reference-ui/rust run build:js` → ESM build
  success (12 bundles incl. diagnostics.mjs).
- Engine-help probe (DIAG-01 world via compileWorld) →
  `ATM-W-UNKNOWN-PROPERTY` carries
  `help: ["remove 'notAStyleProp' or check its spelling"]` — tests
  see Crews 1–3 help lines, existing wire field, no contract change.
- `pnpm --dir packages/reference-neo exec vitest run src/diagnostics
  src/cli/output.test.ts` → 8 files / 141 passed, 0 failed (136
  baseline + 5 new).
- `pnpm agentneo q` → 0 errors, 26 warnings (all pre-existing, none
  in crew files); scoped `q` on the 2 touched files → 0 errors, 2
  soft warns (output.test.ts file/function length; warn line is
  non-failing per gate).
- `pnpm --dir packages/reference-neo exec tsc --noEmit` → clean,
  exit 0.
- End-to-end render probe (real compile → dedupe → verbose line):
  `ATM-W-UNKNOWN-PROPERTY: Unknown property in staticCss:
  "notAStyleProp" — remove 'notAStyleProp' or check its spelling`.

### Diag sweep (no pinned tails, nothing to update)

- `grep -rn " — "` over `tests/cases/diag` (*.ts + *.json): only
  `repro.spec.ts:1` header comments; 0 hits in case.json.
- No spec references `formatVerboseWarningLine` / `warningHintFor` /
  tail text; all 66 repro specs assert code presence + severity +
  non-blank message only (spot-verified: `assert.ok/equal` ×187,
  plus 1 file-name `assert.match`, 3 error-path `assert.rejects`,
  1 `assert.throws` — none tail-related).
- Re-verify: `pnpm agentneo run NEO-DIAG-01` PASS (atomic suggest
  path), `NEO-DIAG-50` PASS (satellite tasty path), `NEO-DIAG-31`
  PASS (static-wins UnfoldableKey path).

### Open flags for later crews

- None. ARC-2 exec complete: engine help minted (Crews 1–3),
  rendered (Crew 4), static fallback retained throughout.
