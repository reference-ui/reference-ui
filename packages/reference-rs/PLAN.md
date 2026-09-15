# Reference RS — PLAN

The orchestration document. Every module has its own contract and its own plan;
this file is the only place that **sequences** them, says which of them are
authoritative, and defines how a delegated unit of work gets verified before it
is believed.

Read this first. Read the module plan second. If the two disagree, this file is
wrong and should be fixed — the module plans are closer to the code.

---

## 1. Document map

| Document | Owns | Status |
| :--- | :--- | :--- |
| **`PLAN.md`** (this) | Sequencing, delegation, verification protocol | Live |
| `modules/canon/SPEC.md` | CSS dialect: property facts, longhands, aliases | **Complete — 43/43** |
| `modules/atomic/SPEC.md` | Atomic compiler behaviour | 130 cases, **90 proven**, 40 open |
| `modules/atomic/chefs_kiss.md` | Atomic refactor + production cutover | Stages 0–3 leftovers landed (SHORT-07, GHOST-05); cutover still open |
| `modules/atomic/testing.md` | Atomic CSS validation + suite wiring | Steps 1–7 landed, 8 open |
| `modules/atomic/plan.md` | The overnight `BaseSystem` ingest run | **Historical.** Superseded; keep for provenance |
| `modules/atomic/PANDA.md` | Panda v2 crosswalk and refusals | Reference |
| `modules/base-system/SPEC.md` | The design-system artefact | 43 cases, **21 proven** |
| `modules/base-system/plan.md` | Building it, lib-derived and self-isolated | Ready for Phase 1 |
| `modules/typegen/SPEC.md` | `.d.ts` emission | 28 cases, **28 proven** |
| `TESTING.md` | Shared station harness | **Contract (§3) current.** Typegen goldens are PLAN Phase 4. |

`TESTING.md` §3 is the harness contract. Sequencing is this file.

---

## 2. Ground state, verified 2026-09-15

- **`canon` is done.** 43/43. It is the only finished crate. Do not reopen it;
  property facts belong there and nowhere else.
- **`atomic` compiles but does not yet mean what it says.** Of the **90** proven
  cases, roughly 32 are strong, 35 weak, 8 mismatched. `CascadeKey` sorts
  utilities by bucket, parsed query magnitude, pseudo rank, and
  `canon::property_cascade_rank`. Shared at-rule wrappers group (LAYER-07).
  Dual at-rules nest in author order (`ATM-GHOST-05`). SHORT-07 paren-depth closed.
  Stage 1 gauges landed 2026-09-15: ghost membership is css-tree class
  selectors inside `@layer utilities` (`classSelector` deleted), ORDER-05/06
  standing gauges, `scan_dir`/`collect_sources` sort by path. Injectivity
  (`ATM-GHOST-04`) is a standing gauge with `INJECTIVITY_QUARANTINE =
  ['ATM-LEAF-05']` (`md:p:4r` and `md:padding:4r` both name `md:p_4r`).
  `Want` may hold Bool/Null; `Atom.value` is `CssValue` (String | Token | Number).
  Leftover boolean wants warn and emit zero atoms (`ATM-VALID-02`).
  Selector escaping is an allowlist (`ATM-NAME-06/07`): leading digit/dash hex-escape
  (`.\32 xl\:p_6r`); runtime class strings stay unescaped.
  Authored `when` strings lower once into `When` on `Atom` (`ATM-COND-12`).
  `ATM-GHOST-04` station exists; standing injectivity still blocked on LEAF-05.
- **`atomic` now has a CSS grammar oracle.** `testing/css.ts` validates every
  station at 0.73 ms each. Quarantine is **8 findings across 7 stations**
  (COND-01 `.2xl` emptied with NAME-06). `pnpm agentrs v atomic` is **96** green.
  Dual at-rules nest in author order (`ATM-GHOST-05`). SHORT-07 paren-depth closed.
- **`base-system` is the token source atomic compiles against.** Dump vs index,
  generated `lib.json` (334 leaves + 3 fonts + **31 keyframes**), `Option` dark,
  category-scoped lookup, Arc clone. SPEC **21/43**. `compile()` stays indexed.
  `@keyframes` emit in `@layer global` on lib_fixture stations. `@font-face`
  still missing (FONT-02). `extends` / `layers` deferred. JS `BaseSystemInput`
  still types keyframes/recipes as `Record<string, string>`.
- **The harness is 5/5 migrated.** `atomic`, `virtualrs`, `atlas`, `tasty`, and
  `styletrace` use `createStationSuite`. Styletrace: 14 stations, 23 Vitest tests,
  `output/components.json`. Four package cases promoted (`input/packages/` →
  `node_modules/`). `--update-goldens` includes `styletrace`. Shared
  `minimal_system()` parses nested Dump JSON through `from_json`.
- **CI now exists** (`.github/workflows/rust-test.yml`) and runs `cargo test
  --workspace` plus `pnpm exec vitest run` on `ubuntu-latest`.
- **Phase 0 landed 2026-09-15.** `virtualrs` 16/16 and `tasty` 81/81. The 48
  failures were stale goldens, not a printer regression. VirtualRS splices
  `import { … } from '…';\n` (`utils.rs` `render_rewritten_imports`); tasty
  emits compact JSON via `serde_json::to_string` (`to_js_literal`) plus
  semicolons. Not OXC codegen. Goldens were refreshed; printers were not
  changed. Re-verified: `pnpm agentrs v virtualrs` and `v tasty` both green.

---

## 3. Open decisions

Sequencing depends on these. Neither is an agent's call.

### 3.1 Unresolved token passthrough — adopted 2026-09-15

**Decision:** a raw fallback is acceptable *only when the raw value is itself
valid CSS*. When a token cannot be resolved, atomic emits the authored value
plus a warning if that value would parse as a declaration; otherwise it warns
and skips the declaration.

Taken literally, unrestricted raw passthrough emits invalid CSS: `blue.600`
prints as `blue .600`, and `borders.card` as `border: borders.card`, which is a
*parse* error. Those would become permanent quarantine residents and
`ATM-VALID-01` could never go fully green. Skipping the dead declaration keeps
the debuggability of a real CSS value that simply is not a token, and never
ships a class that silently does nothing.

Amend `ATM-TOKEN-02` and `ATM-SHORT-03` when Phase 2 implements this. Not a
Phase 0/1 change.

### 3.2 The fixture gap — landed 2026-09-15

Nine stations now ship a per-station `baseSystem.json`. That was **15 findings
across 9 stations**, not fifteen stations. Goldens shrank from ~410 lines to
12–18 (LEAF-08 is 62 because it has many props).

`n100`/`n200`/`n300`/`n900`/`primary` were genuinely missing from
`lib_fixture()`. **`full` and `md` were not** — they live at `radii.full` /
`radii.md`. Raw emission was a lookup miss: `lookup_entry` only prefixes
`colors.{path}` for color props (`resolve/tokens/mod.rs:94-102`), so authored
`borderRadius="md"` looks up `md` and stops. Station dumps declare those radii
under the **authored name** (`"md"`, `"full"`) with `category: "radii"`. Dual
keys (`radii.md` plus `md`) would emit `--radii-md` twice.

This is live `BAS-ASK-06` evidence for Phase 1 Step 3 (category-scoped lookup
inside the crate). Do not "fix" it by stuffing `n*` into `lib_fixture()`.

`ReferenceTokenConfig` is an **open schema** (`system/api/tokens.ts:11`). The
standing constraint on Phase 1 remains: never a closed category enum.

**Not a merge.** `Some(system)` replaces `lib_fixture()` entirely, so each dump
is a minimal complete system for that station (tokens plus any conditions /
breakpoints / `--spacing-root` the input actually uses). `_dark` has no atomic
preset wrap — omit it and COND-04/NAME-02 lose `[data-panda-theme=dark] &`.

---

## 4. Sequenced phases

Dependencies are real; the order is not taste. Each phase names the delegation
and the gate.

### Phase 0 — Green baseline *(landed 2026-09-15)*

Codegen was the contract; station goldens were stale. Printers were not
changed. The PLAN's "OXC / semicolon-only" diagnosis did not survive: VirtualRS
is a span splice, tasty is compact JSON emit, and both already matched their
Rust units. Remaining CI-green work is whatever else is still dirty on this
tree (atomic fixture-gap in flight), not these two modules.

**Filed, not done:** tasty `manifest.js` goldens are compact JSON and not in a
prettier ignore, so a repo format pass can un-compact them; `--update-goldens`
plus `normalizeText.trim()` strips trailing newlines on virtualrs text goldens;
`pnpm agentrs q` on tasty screams about `tests/.scratch/` (runtime emit, no
headers).

### Phase 1 — `base-system`, self-isolated *(the next real body of work)*

Build the artefact into the authoritative token source, derived first-principles
from `@reference-ui/lib`. Fragments stay out; JSON dumps come later. The goal
atomic cares about: **a valid base system with all correct tokens, soon.**

Sequence within the phase:

1. **Split dump from index.** *(landed 2026-09-15)* `BaseSystemDump` +
   `from_json` in `dump.rs` / `lower.rs`. Nine cases newly proven (1 → 10).
   `compile()` stayed indexed; twelve station dumps untouched. Filed: serde_json
   `Value` maps are BTreeMap without `preserve_order`, so Dump token order is
   not authored order — Step 2 must enable it before `lib_fixture()` goes
   through `from_json`.
2. **Generate the lib artefact** *(landed 2026-09-15)* from the real lib theme.
   Scanner, not an evaluator. 334 leaves match the oracle; indexed total is 337
   because lowering still inserts the three font-family tokens. `preserve_order`
   is crate-local. 61 lib_fixture station goldens grew `@layer tokens` by 14
   custom properties; 12 custom-dump stations stayed small.
3. **Fix the modelling issues** *(landed 2026-09-15)*: `Option` dark,
   category-scoped lookup, private `TokenEntry`, Arc clone. SPEC 10 → 14
   (ASK-01/02/06, DUMP-05). Unique-bare is a **crate query** (`is_token("n300")`),
   not a cross-category apply: `mt="blue.600"` stays raw and warns (ATM-TOKEN-02).
   Atomic lookup is full key, then the prop's category, then miss.
4. **Type keyframes and recipes** *(landed 2026-09-15)*: 31 names from six
   lib files, typed `KeyframeDefinition` / `RecipeDefinition`, atomic prints
   `@keyframes` in `@layer global` for the fixture only. Custom dumps stay
   small. FONT-02 `@font-face` still open. ATM-ATOM-04 grain check now inspects
   `@layer utilities` only — that is the atom claim; keyframe steps are not atoms.
5. **Defer** `extends` and `layers` (9 cases, greenfield) unless a consumer needs
   them. They are not on atomic's critical path.

**Plan:** [`modules/base-system/plan.md`](./modules/base-system/plan.md) — written,
with the five steps above expanded and the two shapes named.
**Delegate:** one `implementor` per numbered step, `cursor-grok-4.6-high`,
**sequentially** — steps 1 and 3 change the same types and must not run in
parallel.
**Gate:** `pnpm agentrs c base_system`, `pnpm agentrs v atomic`, `pnpm agentrs q`.
The real proof: **quarantine group 2 is gone** (landed with the per-station
dumps). Remaining group 3 is the passthrough policy (Phase 2). Do not race
`lib_fixture()` against those dumps.

### Phase 2 — atomic semantic correctness

`chefs_kiss.md` Stages 1–3. The oracle exists now, so this is where it pays off.

1. Remaining Stage 1 gauges *(landed 2026-09-15)*: ghost gauge is css-tree
   membership in `@layer utilities`; `classSelector` deleted (`ATM-FORBID-06`);
   ORDER-05/06 standing gauges; injectivity gauge with LEAF-05 quarantined
   (`ATM-GHOST-04` stays open).
2. `Move 2` *(landed 2026-09-15)*: `CssValue` on `Atom` (no Bool/Null);
   leftover boolean wants warn and skip. `ATM-VALID-02` ticked; ATOM-02 /
   SITE-09 `border: true` quarantine slots gone. `font`/`weight`/`size` macros
   still stringify Bool via `class_name_str` — noticed, not this move.
3. `Move 11` *(landed 2026-09-15)*: allowlist escaper; COND-01 `.\32 xl\:p_6r`;
   NAME-06/07 ticked; `.2xl\:` quarantine slot gone.
4. `Move 1` *(landed 2026-09-15)*: `When` on `Atom.conditions`; unknown `_`
   keys warn and drop. COND-12 ticked; GHOST-04 station exists, SPEC box open
   while LEAF-05 is quarantined. GHOST-02 keys unchanged. `extract_at_rule`
   still first-match (GHOST-05).
5. **Stage 2** *(landed 2026-09-15)*: `CascadeKey` in `stylesheet/cascade/`;
   `canon::property_cascade_rank` from existing longhands; shared at-rule
   grouping. ORDER-01–04, SHORT-06, LAYER-07 ticked. COND-01 prints 640→1536.
   Remaining Stage 3 leftovers landed: SHORT-07, GHOST-05. Phase 2 complete.

### Phase 3 — finish the harness *(landed 2026-09-15)*

1. Styletrace `createStationSuite`: 14 snake_case stations, `output/components.json`.
   Four package scenarios promoted, not duplicated as in-memory strings.
2. Shared in-memory `BaseSystem` fixtures against nested Dump (`from_json`).
   `strict_system()` omitted — not a Dump field.
3. `TESTING.md` §6.3 reconciled (orchestrator).

**Gate:** `pnpm agentrs v styletrace` **23**, `c styletrace` **17**, `c shared` **5**.

### Phase 4 — `typegen`

**Slice 1 *(landed 2026-09-15)*:** `emit_dts(&BaseSystem)` prints category-relative
unions + `Tokens`. TYP-TOKEN-01–06, TYP-FORBID-01/02. Empty categories omitted
(not `never`). Golden `tests/goldens/tokens.d.ts`. Refresh:
`TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen` (`agentrs c` does not forward
`--update-goldens`). `pnpm agentrs c typegen` **10**. Lexicographic union order
(TOKEN-03 is `'full' | 'lg' | …`, not scale order). Unknown dump categories
(`animations`, `fonts` from `font()`) skipped. No `atomic` dep.

**Slice 2 *(landed 2026-09-15)*:** TYP-RECIPE-01 `ButtonVariantProps` (optional
axes, lex value unions). TYP-FONT-01 `FontRegistry` from dump weight **keys**
(`bold`, not `'700'`). SPEC draft `['400','700']` was wrong. Goldens
`recipes.d.ts` / `fonts.d.ts`; token golden unchanged. `c typegen` **14**.

**Slice 3 *(landed 2026-09-15)*:** TYP-RECIPE-02 `ButtonCompoundVariant` reuses
optional axis unions plus `css: { [property: string]: string }`. Unknown
`when` rows skipped (all-invalid dumps omit the type). Not a union of declared
compound *rows* — `{ size: 'sm'; tone: 'quiet' }` still typechecks. Split
`emit/{tokens,recipes,fonts,ts}.rs`. `c typegen` **17**.

**Slice 4 *(landed 2026-09-15)*:** TYP-FORBID-03–06. Multiple recipes share one
string (`recipes-two.d.ts`). No `atomic` dep. `canon` not added. Recipe name
`123` skipped; `*bad*` still PascalCases to `Bad`. `c typegen` **22**.

**Slice 5 *(landed 2026-09-15)*:** TYP-STYLE-02/03. `canon` dep. Color 50 keys
(`COLOR_PROPERTIES` + `bg`), spacing 28 (padding/margin aliases + canonicals).
`StyleConditionKey` = `NAMED_CONDITIONS` + `@sm`/`@md`/`@lg` (81 members).
StyleProps only when dump has tokens **and** breakpoints; token golden stays
token-only. Golden `styles.d.ts`. `c typegen` **25**.

**Slice 6 *(landed 2026-09-15)*:** TYP-STYLE-04 + FONT-02/03. StyleProps =
`FontProps & { … }`. Empty fonts print `FontRegistry {}` so StyleProps is not
`never`. Populated: dump keys (`'bold' | 'sans.bold'`). Dialect
`container?: StylePropValue<string | boolean>` and
`r?: StylePropValue<Record<string | number, StyleProps>>`. Goldens `styles.d.ts`
/ `styles-fonts.d.ts`. `c typegen` **29**.

**Slice 7 *(landed 2026-09-15)*:** TYP-STYLE-05. Recursive
`SystemStyleObject = StyleProps & { [K in StyleConditionKey]?: … } & { [K in
\`&${string}\`]?: … }`. `pnpm agentrs v typegen` **5** (`tsc --noEmit` vs
goldens). Nested `_hover._dark` and `'& > span'` typecheck; no TS2589.
`FontProps` is `[FontName] extends [never] ? Fallback : Scoped` (not
`Fallback & Scoped` — that widened `weight` to `string`). FONT-02 tsc:
`sans`+`bold` ok, `sans`+`light` is TS2322. `c typegen` still **29**.
`KNOWN_MODULES` includes `typegen`; not `GOLDEN_SUPPORTED_MODULES`.

**Slice 8 *(landed 2026-09-15)*:** TYP-STRICT-01–05. `emit_dts` stays
open-mode. `emit_dts_with(system, &EmitOptions { strict })` wraps
`BaseSystemStyleObject` (`StyleProps`) as
`StrictColorProps` / `StrictRadiiProps` / `StrictSpacingProps` in declaration
order, then intersects nested keys (wrapping the recursive alias is TS2456).
Canon `*Radius` keys (19, no `webkit*`, no Panda `rounded*`). Golden
`styles-strict.d.ts`. `c typegen` **35**. `v typegen` **14**.

**Slice 9 *(landed 2026-09-15)*:** TYP-RECIPE-03. Core owns
`RecipeCreatorFn` / `RecipeDefinition` / `RecipeRuntimeFn` / `RecipeSelection` /
`RecipeVariantProps` / `RecipeVariant` in `types/public/recipe.ts`. Zero
`@reference-ui/styled` imports. `customCvaFn` unchanged (still casts into
Panda `cva`). Style values use owned `SystemStyleObject`. SPEC was **27/28**
until slice 10.

**Slice 10 *(landed 2026-09-15)*:** TYP-STYLE-01. Core owns
`SystemStyleObject` from `csstype.Properties` mapped through `StylePropValue`,
plus canon aliases (`bg`, `p`/`mt`, `w`/`h`, `flexDir`). Generator wraps
`BaseSystemStyleObject` then intersects nested keys. Zero
`@reference-ui/styled` / `StyledSystemStyleObject`. Generated `.d.ts` still
imports `Properties` from Panda-vendored `styled/types/csstype` (npm `csstype`
is unresolvable in generated packages and collapsed SSO to `any`). Hermetic
`@matrix/typescript` pack failed (`@reference-ui/rust` tarball missing
declared outputs — dirty rust tree). Local `ref sync` + `tsc --noEmit` in
`matrix/typescript` passed. SPEC **28/28**. Phase 4 complete.

### Phase 5 — production cutover

`chefs_kiss.md` §4, and larger than Phases 1–4 combined. Panda still writes the
live `styles.css`; native compile runs behind `REF_SYSTEM_ENGINE=native` and
*appends* onto Panda's sheet, so two layer preambles ship together. The host
discards `CompileResult.css` and `.recipes` entirely.

State this plainly to anyone estimating: **ticking all 130 atomic cases does not
ship atomic.** Until the runtime consumes the emitted class map, `ATM-GHOST-01`
is unenforceable in production and `ATM-RECIPE-02` has no consumer.
`chefs_kiss.md` §4 still calls typegen a stub — it is **28/28**.

**Slice 1 *(landed 2026-09-15, research)*:** Append lives in
`packages/reference-core/src/system/panda/gen/codegen.ts`
`appendNativeCssIfEnabled`. Flag `REF_SYSTEM_ENGINE=native`. Host keeps
`stylesheet` (+ wants count in the log) and drops `css` / `recipes` /
`diagnostics`. Panda preamble is 5 layers; atomic is 6 (`LAYER_PREAMBLE`).
`compileSync({ rootDir })` omits `baseSystem` → `lib_fixture()`. Dual
`BaseSystem` empty `{}` still silently compiles — not this slice.

**Slice 2 *(landed 2026-09-15)*:** Stylesheet probe.
`REF_SYSTEM_ENGINE=native` skips Panda cssgen for `styled/styles.css` and
writes `compileSync({ rootDir }).stylesheet` there (replace, not append).
`pandaGenerate` still runs. `global.css` cssgen still runs. `postprocessCss`
skipped (Panda 5-layer contract). Compile failure fails the run. Unset flag
unchanged. Runtime `css()` still Panda — Book class names will not match
atomic selectors. `pnpm agent vitest core -t "codegen"` **25**.

---

## 5. Delegation and verification protocol

This section is the point of the document. Agents are good at this codebase and
bad at knowing when they are wrong.

### 5.1 Choosing the agent

| Need | Type | Model |
| :--- | :--- | :--- |
| Wide read, "what exists and where" | `explore` | `cursor-grok-4.6-high` |
| Scoped code change with a clear gate | `implementor` | `cursor-grok-4.6-high` |
| Multi-step research feeding a decision | `generalPurpose` | `cursor-grok-4.6-high` |
| Parallel attempts at one risky change | `best-of-n-runner` | `cursor-grok-4.6-high` |

Run research agents **in parallel** and implementors **sequentially** when they
touch shared types. Background research; foreground nothing you are blocked on.

### 5.2 Writing the prompt

Non-negotiable, because each of these has caught a real error:

1. **Give an oracle.** Include measured expectations — counts, file lists, timings
   — and say explicitly: *if your numbers differ, your implementation is wrong;
   investigate rather than adjusting the expectation.* The CSS validation work
   matched 2 syntax + 24 declarations exactly, which is the only reason its report
   was believable on arrival.
2. **State hard scope boundaries as prohibitions.** Name the directories it may
   not touch. Agents "helpfully" fix adjacent bugs and destroy the review.
3. **Pass the gotchas you already paid for.** `import * as csstree` has no default
   export; `pnpm exec vitest`, not bare `vitest`, in Actions.
4. **Point at the spec, and forbid redesign.** "Implement `testing.md` §5 steps
   1–6. Do not redesign it."
5. **Demand a blunt report on the spec itself.** Ask what did not survive contact
   with the code. This produced seven real corrections to `testing.md`, six of
   which were genuine spec errors.
6. **Give the house rules.** `pnpm agentrs` only, never raw `cargo`/`vitest`
   locally; `pnpm agentrs q` after generating; file/complexity limits; no
   `#[allow(clippy::…)]`.

### 5.3 Verifying the result — never accept the report

Run all five. A passing self-report is evidence, not proof.

1. **Re-run the claimed commands yourself.** Do not trust "80 passed".
2. **Diff the scope.** `git status --porcelain <forbidden-paths>` must be empty.
   Confirm no `src/` change when the task was harness-only, and no golden churn
   that was not authorised.
3. **Break it on purpose.** The one test that matters. Insert a defect the new
   gate should catch, confirm it fails *with a useful message*, revert. A gate
   nobody has watched fail is not known to work. Adding a bogus quarantine entry
   is how the self-cleaning meta-test was actually confirmed.
4. **Read the code, not the summary.** Especially the loosest part — allowlists
   matched by substring, and any escape hatch.
5. **Re-check its diagnosis of pre-existing failures.** An agent that touched
   shared code and blames "unrelated dirty tree" may be right, and may be
   covering. Prove it independently: check whether it touched the failing
   module's wiring, and whether the failure's *nature* matches its story.

### 5.4 When an agent flags the spec was wrong

Fix the document immediately, in the same session. A stale plan is worse than no
plan, because the next agent implements it confidently. `testing.md` was corrected
in seven places the hour it was implemented; that is the standard.

---

## 6. Known documentation debt

### 6.1 Atomic READMEs describe an unbuilt sorter

`stylesheet/README.md`, `stylesheet/layers/README.md`, and
`resolve/shorthands/README.md` all document a five-part cascade sort key.
`rg property_priority src/` returns nothing. A reviewer reads these, believes
ordering is handled, and ships the inversion. `chefs_kiss.md` Move 10 lists these
and six more; do it before Stage 2, not after.

### 6.2 `atomic/plan.md` is historical

Its morning checklist is done. It is provenance for the overnight run, not
instructions. Anything still live from it has been lifted into `chefs_kiss.md`
§4 or this file.

### 6.3 `TESTING.md`

Reconciled 2026-09-15. §3 is the harness contract (signatures match `testing/*.ts`,
including `css.ts`). §6 is a pointer here. Remaining work in that document's
old §4.6 is typegen `.d.ts` — Phase 4 complete (**28/28**). Filed leftovers:
core `fonts.ts` still `Fallback & Scoped` (widens `weight`); `colors.ts` /
`radii.ts` / `conditions.ts` still import styled; generated SSO still resolves
csstype via `styled/types/csstype`; `chefs_kiss.md` §4 still calls typegen a
stub.

Filed from the styletrace migration, not fixed:

- Uniqueness/sorted standing gauges run after `spec.verify`. Exact `toEqual` on
  the name list fails first; the gauges only fire if a spec is weaker.
- `node_builtin` / `react_reexport` still exist as TS helpers and Rust string
  fixtures (`fixtures.test.ts` / `tracing.rs`).
- `shared` now depends on `base_system` so fixtures can call `from_json`.
- `WalkContext.source` is still unread (`styletrace` dead_code warning).

---

## 7. Do not

- Do not reopen `canon`. It is complete, and property facts belong there.
- Do not run raw `cargo` / `vitest` / `playwright` locally — clamped Darwin QoS.
  `pnpm agentrs` exists for this. CI is the exception and uses plain commands.
- Do not refresh a golden to make a test pass without deciding whether the new
  output is *correct*. Four atomic defects are in goldens because that decision
  was skipped once.
- Do not empty a quarantine slot by editing the list. Fix the defect; the
  meta-test will tell you the slot is stale.
- Do not add `#[allow(clippy::…)]`, and do not dodge the analyser with tuple
  parameters. Introduce a context struct.
- Do not build `extends` / `layers` in `base-system` until a consumer needs them.
- Do not start `pnpm dev:lib`; the developer runs it.
- Do not let an implementor agent "also fix" something it noticed. File it here.
