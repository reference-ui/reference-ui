# Atomic claims probe (read-only)

Date: 2026-09-17. Repo: `/Users/ryn/Developer/reference-ui`. No files in the repo were modified.

---

## 1. Executive summary

Atomic (`packages/reference-rs/modules/atomic`) claims a full stylesheet compiler: extract StyleProps/`css()`/`recipe()`, resolve rhythm/tokens/shorthands/conditions, emit a package-nested six-layer sheet plus owner-qualified `NativeRuntimeArtifact` plans. Campaign packets F0–N6, G1, C1–C5, M0, Q1 are marked **done** in `PLAN.md` §5; **G2 is HALTED** (css-wedge); **K1–G4 and T4/T5 are not started**. SPEC lists **130** contract IDs, **124 `[x]`**, **6 `[ ]`**; **117** dedicated `tests/cases/ATM-*` folders (the rest are standing gauges). Proof is **Vitest-seam goldens + Cargo internals**. **No ATM station is a browser case.** Neo already has a handful of Playwright cases (`NEO-CSS-01/02`, `NEO-EDGE-01/02`, `NEO-RECIPE-01`, `NEO-PRIM-01`) that cover a thin slice, not the hard edges. Live CSS emitters use **`data-theme`** and portable **`data-layer`**. **`data-panda-theme` is gone from goldens (0 matches)** but still appears in stale SPEC/README prose. **Neo `docs/DOMAIN.md` names `data-color-mode`** — a plan-level mismatch vs Rust `data-theme`. The live N-API JS call Neo uses is **`compile({ baseSystem, rootDir, files })`**, not frozen `NativeCompileRequest` (`spec` + `jsxHosts` + `sourceRoot` + `declarationRoot`).

---

## 2. Claims table

Proof kinds: **Rust** = crate `#[test]`; **Vitest-seam** = `modules/atomic/tests/cases/ATM-*` (+ gauges); **Browser** = Neo Playwright. SPEC ticks mean a folder/gauge exists, **not** that the prose is fully asserted (SPEC §2: ~32 STRONG / 35 WEAK / 8 MISMATCHED as of 2026-09-15).

| Family | Claimed at | Proven by | Proof kind | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Conditions / interaction pseudos | `SPEC.md:381–410` (`ATM-COND-02`, `10`); `canon/SPEC.md:140–149` | ATM-COND-02 (`_hover` → `&:is(:hover, [data-hover])`); ATM-COND-10 (`_active/_focus/_focusVisible/_disabled/_checked`); ATM-ORDER-03 (pseudo emit order) | Vitest-seam | SPEC warns COND-02 used to pretend it proved the five; COND-10 is the real catalog. **Neo NEO-EDGE-01** exercises hover/focus/disabled via data attrs — thin browser slice. |
| Nested selectors & `&` | `SPEC.md:405–422` (`ATM-COND-09`, `14`) | ATM-COND-09 (group/peer + `'&[data-slot=inner]'`); ATM-COND-14 (nested `&`, comma lists, `&` inside attr values) | Vitest-seam | Composition bugs live in nesting/lists, not one flat `&`. **No dedicated Neo case.** |
| Attribute conditions | `SPEC.md:405–407`; COND-14 | ATM-COND-09, ATM-COND-14 | Vitest-seam | Same-element `[data-slot=…]`. N4 plan also lists attribute selectors in global CSS (`plan.md:237`). |
| Breakpoints / media | `SPEC.md:381–383`, `411–419`; `PLAN.md:171–178` | ATM-COND-01 (`sm/md/lg/xl/2xl` → `@container (min-width: Npx)`); ATM-COND-11 (`_osDark/_motionReduce/_print` as `@media`); ATM-COND-13 (range: `mdDown`/`mdOnly`/`smToLg`); ATM-ORDER-01 (magnitude sort, not lex) | Vitest-seam | Named breakpoints are **container queries**, not viewport `@media`. Canon: `sm` is **not** a language condition (`CAN-COND-04`). **Neo NEO-CSS-02** is responsive lowering, not query-in-browser. |
| Container queries | `SPEC.md:381–383`, `399–401`, `423–429` | ATM-COND-01; ATM-COND-07 (`r={{ 300: …, md: … }}`); ATM-COND-15 (container-type root or diagnostic); ATM-COND-16 (boolean `container` + named `@container card`); ATM-GHOST-05 (nested dual at-rules) | Vitest-seam | SPEC: without `container-type` ancestor, **every responsive utility silently never matches**. Named-container formatter historically unused (`resolve/r/query.rs`). **No Neo CQ case.** |
| Colour-mode islands | `PLAN.md:68–69, 196–199, 311–314`; `SPEC.md:387–404`; emit `system_layers/mod.rs:14,165–172` | ATM-COND-03, ATM-COND-08 (stations’ READMEs now say `[data-theme=…]`; **SPEC body still quotes `data-panda-theme`**); token islands in goldens `:root, [data-theme=light]` / `[data-theme=dark]` | Vitest-seam + Rust | **Live emit is `data-theme`.** SPEC/COND-03/08 prose is stale. `atomic/map.html:839` still shows `[data-color-mode='dark']` (docs only). **No Neo theme-island paint case** (PLAY-B-01 mentions theme flips as harness probe). |
| `!important` | `SPEC.md:303–308`, `538–540`; `PLAN.md:118` | ATM-LEAF-09 (`2r!` → `.mt_2r\!`); ATM-LEAF-10 (` !important`, case, quoted `!` exclusion); ATM-NAME-03 | Vitest-seam | ATM-ATOM-01 **mismatched**: identity includes importance but fixture has no `!`. **No Neo case.** |
| Shorthands / aliases | `SPEC.md:355–377`; `canon/SPEC.md:116–129`; `PLAN.md:N2` | ATM-SHORT-01–07 (borderBottom/outline no `currentColor`; 2–4 token expand; paren-depth); ATM-MERGE-02 (alias last-wins); ATM-ORDER-04 (shorthand before longhand); CAN-ALIAS-01–06 | Vitest-seam + canon unit | Conservative aliases: `mt/pt/p/m/px/mx/w/h/minW/maxW/bg/flexDir`. **Refused:** `c`, `rounded*`, `pos`, `shadow`, `ps/pe/ms/me`. **Neo NEO-EDGE-02** covers radii tokens, not shorthand cascade. |
| Macros: rhythm `r` | `SPEC.md:337–353`; `canon/SPEC.md:131–138` | ATM-RHYTHM-01–05 (`r/+r/1r/-r`, multipliers, fractions, multi-value, JSX negatives) | Vitest-seam | `r` collides with SVG radius in canon (`CAN-EXT-03`) but atomic treats it as rhythm. |
| Macros: `container` / `size` / `font` / `weight` | `SPEC.md:394–395` (`ATM-COND-05`); `PLAN.md:176–178`; `canon/SPEC.md:131–138` | ATM-COND-05 (`container` → type/name; `size` → w/h; `font`/`weight` from `font()` table; lib `font="sans"` letter-spacing); ATM-COND-16 boolean container | Vitest-seam | `variant`/`colorMode` are **not** CSS macros: ATM-COND-06 discards them. Canon `REFERENCE_ONLY_PROPS`: `colorMode, r, size, variant, weight` (`overlay/macros.ts:7–13`). |
| Arbitrary values | `SPEC.md:198–200`, `546–552` | ATM-VALID-03 (oklch / unresolved token: escape selector, raw value); ATM-NAME-04–07 (escape allowlist); ATM-COND-09 `&` / `@` | Vitest-seam | Panda escaped declaration values — we refuse that. |
| Token refs | `SPEC.md:431–462` | ATM-TOKEN-01–02, 04–05, 08–09, 11 (`var(--…)`, brace interpolation, aliases in `@layer tokens`, category breadth) | Vitest-seam | TOKEN-05: compiler does not invent tokens. |
| Opacity modifiers | `SPEC.md:439–450` | ATM-TOKEN-03 (`color-mix`); ATM-TOKEN-06 (slash in `rgb()`, empty segments warn) | Vitest-seam | Naive `/` split would destroy modern color functions. **No Neo case.** |
| Negative values | `SPEC.md:351–353`, `451–453` | ATM-RHYTHM-05 (`-1r`); ATM-TOKEN-07 (`-4` → `calc(-1 * var(--spacing-4))`) | Vitest-seam | Two paths: negative rhythm vs negative **token scale**. |
| Responsive arrays + `null` holes | `SPEC.md:291–293`; `PLAN.md:731` F0 fixture | ATM-LEAF-05 (index → breakpoint; `null` skip; nested ternaries under slot); ATM-MERGE-03 (`css([...])` is **merge list**, not responsive) | Vitest-seam | **Neo NEO-CSS-02** is the closest browser/runtime lowering proof. |
| Recipes: base / variants / compound / defaults / boolean / `.raw()` / identity | `SPEC.md:470–489`; `PLAN.md:392–406, 863–883`; N3 | ATM-RECIPE-01–06; ATM-SITE-03 extract | Vitest-seam | Identity `${system}__${className}`; non-object-literal `recipe(definition)` diagnostic; const bindings **out of this cutover** (`PLAN.md:400–402, 876–878`). `.raw()` from host config, not Rust. **Neo NEO-RECIPE-01** exists. |
| Slot recipes | `SPEC.md:129`; `base-system/SPEC.md:53, 160–161`; `atomic/src/recipes/README.md` | BAS-RECIPE-03 (no slot schema); ATM-SITE-04 (`sva` not a site) | Rust + Vitest refuse | **Unsupported as author API.** Multi-part = authored React. |
| Static CSS wildcards | `SPEC.md:491–501`; `PLAN.md:223–227, 277–281` | ATM-STATIC-01–03 (colors `*`, listed values, `_hover`, radii `*`, unknown prop warns) | Vitest-seam | Historical “colors only” closed by N4. Production spec always includes default table. **No Neo staticCss case.** |
| `@layer` order + package layers | `SPEC.md:503–528`; `PLAN.md:423–437` | ATM-LAYER-01–08; standing LAYER-01 gauge; ATM-LAYER-07 shared at-rule grouping | Vitest-seam | Six internals nested in `@layer <system>`: `reset, global, base, tokens, recipes, utilities`. Empty layers omitted. Reset chrome historically empty in fixture (LAYER-08 exists to prove dump reset). |
| Portable stylesheet + `data-layer` | `PLAN.md:241–256, 425–427`; `system_layers/mod.rs:165–168` | ATM-SEAM-01 (portable present); `cascade-order.test.ts:257` `[data-layer="color-mode"]`; `contracts/fixtures/compile-result.json` | Vitest-seam (not station goldens) | Station `output/styles.css` goldens are **application** form: **0 `data-layer` matches**. Portable is a separate string. |
| Keyframes | `SPEC.md:517–519`; N4 `plan.md:239` | ATM-LAYER-05 (`@keyframes` in `@layer global`) | Vitest-seam | SPEC: animation tokens used to point at undefined keyframes. |
| Global CSS lowering | `PLAN.md:165–170, 212–229`; N4 | ATM-LAYER-03 (globalCss + tokens); COND-10/11/13–16 as N4 consumers; `container: true` same as utility | Vitest-seam | Structured IR, not CSS strings. Non-macro booleans diagnostic. **No Neo globalCss paint case.** |
| Class naming + escaping | `SPEC.md:530–552`; NAME-06 digit/`--` hex escape | ATM-NAME-01–07; ATM-COND-01 (`.\32 xl\:…`) | Vitest-seam | Runtime class strings unescaped; selectors escaped. System segment on class names (`PLAN.md:359–360`). |
| Cascade slots / last-wins merge | `PLAN.md:347–371`; `SPEC.md:202–216`; N2 | ATM-MERGE-01–03; ATM-SEAM-01; `js/plans.ts` helpers | Vitest-seam | Lookup `(system, when, prop, value, important)`; slot opaque per owner; later declaration replaces slot regardless of `!`. Browser `css()` is Neo’s job. **NEO-CSS-01** paints from plans. |
| Diagnostics | `SPEC.md:554–573` | ATM-DIAG-01–03 green; **DIAG-04/05/06 `[ ]`** (locations, codes, UTF-16 columns) | Vitest-seam / unproven | Error diagnostics fail sync (`PLAN.md:440–441`). |
| Ghost / injectivity / validity | `SPEC.md:140–200` | Gauges GHOST-01, VALID-01/02; GHOST-02/03/05 folders; **GHOST-04 `[ ]`** (folder exists; injectivity still quarantined on `p`/`padding` = ATM-LEAF-05) | Vitest-seam | VALID-01 uses `css-tree` in harness, **not a browser**. |
| Extraction sites | `SPEC.md:227–275` | ATM-SITE-01–12, 14–16; **SITE-13 `[ ]`** fail-closed empty host set | Vitest-seam | Empty host set still “scan all tags” contradiction SITE-01 vs SITE-08. Styletrace PLAN N6 done; SITE-13 still open. |
| Units | `SPEC.md:218–225` | ATM-UNIT-01–02 | Vitest-seam | Unitless number → `px` on lengths. |
| Forbidden architecture | `SPEC.md:575–597` | ATM-FORBID-01–05 folders; FORBID-06/07 gauges/`portability.test.ts` | Vitest-seam | No hashed objects, no JS eval, one namer, no generated `css.js`. |
| Perf | `SPEC.md:604–606` | **ATM-PERF-01 `[ ]`** | none | Incremental-compile campaign; double parse noted. |
| Seam parity | `SPEC.md:601–603` | ATM-SEAM-01 | Vitest-seam | Rust compile vs N-API `compileSystem`. |

**Station inventory:** 130 SPEC IDs; 117 folders. IDs without folders are mostly **gauges**: GHOST-01, LAYER-01, ORDER-05/06, VALID-01/02, FORBID-06/07 — plus remaining `[ ]`: DIAG-04/05/06, GHOST-04 (folder exists, still open), PERF-01, SITE-13.

---

## 3. Seam

### Frozen contracts (`packages/reference-rs/contracts/types.ts`)

Verbatim:

```ts
export type GlobalDeclarationValue =
  | string
  | number
  | boolean
  | null
  | GlobalDeclarationValue[]
  | { [key: string]: GlobalStyleNode }

export type GlobalStyleNode = Record<string, GlobalDeclarationValue | Record<string, unknown>>

export interface EvaluatedSystemSpec {
  schemaVersion: 1
  profile: 'reference-ui'
  name: string
  tokens: Record<string, unknown>
  fonts: Record<string, unknown>
  breakpoints?: Record<string, string | { value: string }>
  conditions?: Record<string, string>
  globalCss: Array<{
    source: string
    rules: Record<string, GlobalStyleNode>
  }>
  keyframes: Record<string, unknown>
  recipes: Record<string, unknown>
  staticCss: Record<string, string[]>
  provenance: Array<{
    source: string
    kind: 'tokens' | 'fonts' | 'keyframes' | 'globalCss' | 'recipes' | 'fragment'
    keys?: string[]
  }>
}

export interface RuntimeDeclaration {
  slot: string
  className: string
}

export interface RuntimeStylePlan {
  system: string
  when: string[]
  prop: string
  value: unknown
  important: boolean
  declarations: RuntimeDeclaration[]
}

export interface RecipeRuntimeTable {
  qualifiedName: string
  className: string
  base: string
  variantKeys: string[]
  variantMap: Record<string, Record<string, string>>
  defaultVariants: Record<string, string>
  compoundVariants: Array<{
    selection?: Record<string, string>
    variant?: string
    disabled?: string
    css?: Record<string, unknown>
    className?: string
  }>
  combinations: Record<string, string>
}

export interface NativeRuntimeArtifact {
  schemaVersion: 1
  stylePlans: RuntimeStylePlan[]
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
}

export interface Diagnostic {
  message: string
  severity?: 'error' | 'warning' | 'info'
  code?: string
  source?: string
}

export interface CompileResult {
  stylesheet: string
  portableStylesheet: string
  runtime: NativeRuntimeArtifact
  diagnostics: Diagnostic[]
  wants?: unknown[]
  atomCount?: number
}

export interface NativeCompileRequest {
  schemaVersion: 1
  spec: EvaluatedSystemSpec
  jsxHosts: string[]
  sourceRoot: string
  declarationRoot: string
}
```

(`PortableBaseSystem` / chunks omitted here; full file is `contracts/types.ts`.)

`PLAN.md` §3.6 is the **production** Atomic request: `spec` + `jsxHosts` + `sourceRoot` + `declarationRoot`. Styletrace uses `declarationRoot`; layers never contribute hosts.

### Live N-API JS (`@reference-ui/rust/atomic`)

`package.json` exports: `./atomic` → `dist/atomic.{d.ts,mjs}`; `./typegen`; `./contracts`; `./styletrace`; `./system`.

`modules/atomic/js/index.ts`:

- `compileSync(request: CompileRequest): CompileResult`
- `compile(request)` → same (sync under Promise)
- JSON → native `compileSystem`

**Actual `CompileRequest`** (`modules/atomic/js/types.ts:37–41`):

```ts
export interface CompileRequest {
  rootDir?: string
  files?: VirtualSource[]
  baseSystem: EvaluatedSystemSpec
}
```

**Not** `NativeCompileRequest`. Optional virtual `files[]`; required `baseSystem`. `jsxHosts` / `declarationRoot` are **absent** from this TS wrapper.

Typegen: `emitDtsSync({ baseSystem, strict?: string[] }): string` (`modules/typegen/js/types.ts`).

Atomic `CompileResult` JS extra fields: optional `css`, `wants`, `recipes[]`, `atomCount` (test observability). `portableStylesheet` optional in JS types, required on frozen contract.

### What Neo actually calls

`packages/reference-neo/src/sync/index.ts:46`:

```ts
const result = await compileNative({ baseSystem: spec, rootDir: cwd, files })
```

`packages/reference-neo/src/sync/native.ts`:

- Dynamic `import('@reference-ui/rust/atomic')`
- Local types: `{ baseSystem, rootDir?, files? }` → `{ stylesheet, portableStylesheet?, runtime, diagnostics }`
- Comment: rs dist types fail NodeNext, so the boundary is described structurally.

Consumed: `stylesheet`, `portableStylesheet`, `runtime` (`stylePlans`, `recipes`, `stylePropNames`), error diagnostics. Types imported from `@reference-ui/rust/contracts`.

**Neo never passes `jsxHosts` / `declarationRoot` / `schemaVersion` on a `NativeCompileRequest`.** `rg jsxHosts|declarationRoot|sourceRoot` under `packages/reference-neo` is empty.

### Limitations / TODOs from rs docs

| Item | Citation |
| :--- | :--- |
| G2 **HALTED** (css wedge, watch-ready hang) | `PLAN.md:708` |
| K1–K2, M1, G3–G4 **not started** | `PLAN.md:709–713` |
| Matrix T4/T5 packages missing | `PLAN.md:200–202, 711` |
| Core `compileSync({ rootDir })` historically used `lib_fixture()` / discarded runtime | `PLAN.md:134–143` (verified ground; C packets later marked done) |
| `atomic/plan.md:40` still says theme emits `data-panda-theme` | Stale vs N4 “zero panda” (`PLAN.md:698`) |
| `atomic/README.md` still describes `css` class map, not `runtime` | Stale ABI |
| SPEC remaining `[ ]` | DIAG-04/05/06, GHOST-04, PERF-01, SITE-13 (`SPEC.md:27`) |
| Const-bound `recipe(definition)` out of cutover | `PLAN.md:400–402, 876–878` |
| `EvaluatedSystemSpec.recipes` may be empty in production | `PLAN.md:211–215` |
| `variant`/`colorMode` discarded at lower | `PLAN.md:227–229` |
| Reset wrapping is Core’s, not Rust’s | `PLAN.md:431–435` |
| Atomic `plan.md` remaining queue after G1 | SITE-14+ listed; many now ticked in SPEC anyway |

### Adjacent crates (one paragraph each)

**base-system** (`modules/base-system/SPEC.md`): ingest evaluated fragment JSON into an indexed query engine (tokens light/dark, fonts, keyframes, globals, conditions, recipes). Does not parse TSX or print utilities. 43 cases, 29 `[x]`; **EXTEND (5) and LAYER (4) unproven**; slot recipes refused (`BAS-RECIPE-03`). Profile `reference-ui` installs `_dark`/`_light` as `[data-theme=…]`.

**typegen** (`modules/typegen/SPEC.md`): print `.d.ts` from BaseSystem + canon (token unions, StyleProps, FontRegistry, recipe variant types). Does not emit class names or runtime. 28/28 named IDs ticked. `emitDtsSync({ baseSystem, strict? })`. Does not read Atomic output.

**styletrace** (`modules/styletrace/PLAN.md`): which JSX names carry StyleProps, from declarations/imports not PascalCase. N6 **done**. Production needs `sourceRoot` + staged `declarationRoot`. Empty host set → atomic still scans all tags; **ATM-SITE-13** is the fail-closed close.

**canon**: `@webref` platform + dialect overlay. Aliases, unique class prefixes, macros (`r`, `size`, `weight`, `colorMode`, `variant`; `container`/`font` also platform CSS). No viewport scale in the language. No `Box`/`Flex`.

---

## 4. Known gaps (unsupported / deferred / diagnostic-only)

Citations are load-bearing.

1. **Slot recipes / `sva`** — refused author API. `SPEC.md:129`; `base-system/SPEC.md:53, 160–161`; `atomic/src/recipes/README.md`; ATM-SITE-04.
2. **Non-object-literal `recipe(definition)`** — diagnostic, fail compile; **const bindings out of this cutover**. `PLAN.md:400–402, 876–878`; ATM-RECIPE-06.
3. **`layers` vs `extends`** — layers do not adopt fragments, types, or JSX hosts; only cssChunks + runtime. `PLAN.md:51, 178–183, 473–484`. Base-system **BAS-LAYER-*** and **BAS-EXTEND-*** still `[ ]` (`base-system/SPEC.md:31–32`).
4. **T4/T5 chain fixtures** — described in `matrix/CHAIN.md`, packages do not exist. `PLAN.md:200–202, 711` (M1 not started).
5. **G2 css wedge / HALTED** — campaign cannot claim matrix/Book native until diagnosed. `PLAN.md:708`; `docs/simulation-learnings.md`.
6. **Panda deletion K1–K2, G3–G4** — not started. `PLAN.md:709–713`.
7. **ATM-SITE-13** — empty styletrace graph must not scan every tag; diagnostic. Still `[ ]`. Styletrace PLAN + `SPEC.md:263–265`.
8. **ATM-DIAG-04/05/06** — line/column, stable codes, UTF-16. `[ ]` `SPEC.md:565–573`.
9. **ATM-GHOST-04** — namer injectivity; `p`/`padding` collapse quarantined (`LEAF-05`). Folder exists, SPEC still `[ ]`.
10. **ATM-PERF-01** — time/memory; double parse. `[ ]`.
11. **Vue/Svelte/Astro, tagged templates, `cva`/`sva`/`tw`** — not extract sites. `SPEC.md:125, 261–262, 237–238`.
12. **JS eval of dynamic leaves** — warn + skip; siblings kept. ATM-LEAF-07, FORBID-02.
13. **Unknown `_` conditions** — no utility, warn. ATM-COND-12.
14. **Non-macro booleans** (`display: true`) — diagnostic; only `container: true` legal. `PLAN.md:170, 306–308`.
15. **Hashed whole-object classes, generated `css.js`, second namer** — forbidden. ATM-FORBID-01/03/04.
16. **`data-panda-theme` preservation** — forbidden going forward. `atomic/plan.md:360`; N4 gate.
17. **Typegen does not invent live recipe ingredients from Atomic** — `PLAN.md:270–275`.
18. **SPEC prose vs goldens** — COND-03/08/LAYER-03 still document `data-panda-theme` while stations emit `data-theme` (`SPEC.md:387–404, 513`).
19. **`atomic/map.html`** still teaches `_dark` → `[data-color-mode='dark']` and `sm` → `@media` (`map.html:839–840`) — **wrong vs live compiler** (`data-theme` + `@container`).

---

## 5. Attribute naming findings

Plan authority: **`data-theme` is the only light/dark DOM and stylesheet attribute** (`PLAN.md:68–69, 436`). Portable tokens use **`[data-layer="<system>"]`** (`PLAN.md:180, 254, 426`).

### Counts in `packages/reference-rs` (rg match totals)

| Needle | Files | Matches | Where |
| :--- | ---: | ---: | :--- |
| `data-theme` | 133 | 289 | Emitters, base-system conditions, **106 golden CSS files (219 matches)**, contracts fixture, PLAN |
| `data-panda-theme` | 11 | 37 | **Docs/SPEC/plan/READMEs/tests that mention the old name.** **0 matches under `tests/cases/*/output/`** |
| `data-color-mode` | 1 | 2 | **`modules/atomic/map.html` only** (interactive map, not compiler) |
| `data-layer` | 11 | 21 | Emitter, PLAN, `contracts/fixtures/compile-result.json` + `portable-base-system.json`, `cascade-order.test.ts`. **0 in station `output/` goldens** (application CSS) |

Rust emit constants (`system_layers/mod.rs`):

- Application: `:root, [data-theme=light]` and `[data-theme=dark]`
- Portable: `[data-layer="{name}"], [data-layer="{name}"][data-theme=light]` and `[data-layer="{name}"][data-theme=dark]`
- Conditions: `_dark` → `[data-theme=dark] &` (`base-system/src/conditions.rs:39`)

### Plan-level mismatch with Neo DOMAIN

`packages/reference-neo/docs/DOMAIN.md:42–44`:

> **data-layer / data-color-mode / data-variant** — the DOM attributes primitives stamp: system name, active color mode, variant.

Rust sheets and `_dark`/`_light` wraps will **not** match a primitive that stamps `data-color-mode`. Retired panda-isms in the same file include `data-panda-theme` but **do not mention `data-theme`**.

**Decision for the Neo plan:** either (a) Neo DOMAIN and primitives follow rs/`PLAN.md` and stamp **`data-theme`**, or (b) rs is retargeted to `data-color-mode` (contradicts campaign non-negotiable §0.6 and N4 “zero panda / data-theme”). **Do not leave both names.** `data-layer` is already shared vocabulary.

`data-hover` / `data-disabled` etc. are **interaction twins** on pseudo wraps (`&:is(:hover, [data-hover])`), not colour mode.

---

## 6. Claims with no browser proof (Neo case priority)

ATM stations prove **strings in goldens**, not computed styles. Neo cases that already exist are noted; everything else is a first-wave candidate.

**P0 — CSS that is false if the browser disagrees (campaign “css wedge” risk)**

1. **Colour-mode islands** — stamp `data-color-mode` on an ancestor *(was `data-theme`; D1 override + RS-7 retarget 2026-09-17)*; assert light/dark token + `_dark` utilities paint. Closes DOMAIN vs Rust. (Not NEO-EDGE-01.)
2. **Named breakpoints as `@container`** — `container: true` / `container-type` on ancestor; `sm`/`md` array slots; **without** container-type, utilities must **not** apply (ATM-COND-15).
3. **Nested `&` + comma lists** (ATM-COND-14) — `:last-child .divider` composition; attribute `&` literal.
4. **Shorthand vs longhand cascade** (ATM-SHORT-01/06, ORDER-04) — `borderBottom` without `currentColor` clobber; `padding` then `paddingTop`.
5. **`!important` spellings** (LEAF-09/10) — including quoted `content: '"hello!"'`.
6. **Opacity `color-mix` vs `rgb(… / …)`** (TOKEN-03/06).
7. **Last-wins merge by slot** (MERGE-01/02) — two `css()` args / alias `bg` vs `background`; stylesheet still contains both atoms.

**P1 — dialect the author actually writes**

8. Rhythm `r` / negatives / fractions (RHYTHM-01–05) in computed `margin`/`padding`.
9. `font` / `weight` / `size` / boolean `container` macros (COND-05/16) — multi-declaration expansion vs one class bag.
10. Responsive arrays with **`null` holes** (LEAF-05) — extend NEO-CSS-02.
11. Range conditions `mdDown` / `mdOnly` (COND-13).
12. `@media` presets `_osDark` / `_motionReduce` / `_print` (COND-11).
13. Group/peer `_groupHover` / `_peerFocus` (COND-09).
14. StaticCss wildcard so runtime `css({ color: variable })` finds a class (STATIC-03).
15. GlobalCss + keyframes + `@font-face` (LAYER-03/05/06) actually load/animate.
16. Package `@layer` nesting vs composed portable `[data-layer]` (LAYER-01, portable fixture) — two systems, `font: "sans"` independence (`PLAN.md:176–178`, T5 intent).

**P2 — recipes / runtime identity**

17. Defaults + boolean variants + compounds + `.raw()` (RECIPE-04–06) — deepen NEO-RECIPE-01.
18. Duplicate `(system, className)` fail; two packages both `button`.
19. Recipe utilities override `@layer recipes` via utilities layer (RECIPE-03).

**Already thin browser coverage (do not treat as done)**

- NEO-CSS-01 — `css()` paints from plans  
- NEO-CSS-02 — responsive lowering  
- NEO-EDGE-01 — hover/focus/disabled  
- NEO-EDGE-02 — radii tokens  
- NEO-RECIPE-01 — variant classes  
- NEO-PRIM-01 — primitive entry  
- NEO-SYNC-01 — handshake  

**Do not spend first-wave Neo cases on:** extract-site refusals (SITE-04/12), serde Want (WANT-*), FORBID architecture, DIAG location/UTF-16, PERF-01, injectivity quarantine — those stay rs stations unless they leak into painted CSS.

---

## Sources (skim)

- `packages/reference-rs/PLAN.md` §0–§5 (status table ~687–713)  
- `packages/reference-rs/modules/atomic/{SPEC.md,plan.md,README.md,map.html}`  
- `packages/reference-rs/modules/{base-system,typegen,styletrace,canon}/SPEC|PLAN|README`  
- `packages/reference-rs/modules/map.html` (ecosystem map; not re-quoted)  
- `packages/reference-rs/contracts/types.ts` + `contracts/fixtures/**`  
- `packages/reference-rs/modules/atomic/js/{index,types}.ts`  
- `packages/reference-neo/src/sync/{index,native}.ts`  
- `packages/reference-neo/docs/DOMAIN.md`  
