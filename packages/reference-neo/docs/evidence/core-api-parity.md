# Core → Neo API parity matrix

Read-only probe of `packages/reference-core` (reference) vs `packages/reference-neo` (today). No repo files were modified. Sources: core `public.ts` / `entry/**` / `system/{api,base,runtime,primitives,types}` / `config` / host trees; Neo `src/**`; `packages/reference-neo/docs/{PLAN-host-build.md,DOMAIN.md,README.md}`.

---

## 1. Executive summary

Neo already owns the overnight host volume: trimmed `defineConfig` + surviving `ReferenceUIConfig` fields, the five fragment collectors plus evaluate-once runner emitting `EvaluatedSystemSpec`, serial `sync()` → Rust `compile()` → `.reference-ui/{system,styled,react}`, a native `css()` / `recipe()` over compiled plans (not Panda wrappers), and natively generated React primitives (tag set, split, `data-layer` / `data-color-mode` / `data-variant`). That is most of the *author-visible* loop for a single system.

The largest holes versus core’s author/runtime surface are: `getRhythm` and the rhythm/shorthand/`r`-named-breakpoint box-pattern stack (still Panda extensions); `css.raw`; public typed `SystemStyleObject` / `StyleProps` / recipe generics / strict-token unions; `box()` as a pattern function; Panda `cx` / `splitCssProps`; fragment-level recipe registration (`extendRecipes`); and the color-mode *compiler* (`resolveColorModeTokens` / `extendThemes` / `staticCss.themes`) which Neo only partially replaces via token `light`/`dark` leaves plus DOM stamping.

Config fields `strict` and `layers` are deferred; `mcp`, library/icon flags, and `skipTypescript` are dropped for v0. Host chassis (watch, Vite/Webpack plugins, packager/tsup, virtual mirror, MCP, Reference/Tasty browser, workers) is later-leg or never, per Neo README and PLAN-host.

Biggest plan risks: named `r` breakpoints vs numeric-only lowering; `!` important vs Panda `!important`; responsive *arrays*; typegen/`strict`; `css.raw` consumers; whether `getRhythm` is author API or an internal token helper.

---

## 2. Parity matrix

Legend: **copied** ≈ near-verbatim Neo-owned copy; **partial** ≈ exists but contract/backend differs; **missing** ≈ not in Neo `src/`; **dropped** = Neo docs say not now / never.

### 2.1 Config

| API | Signature (one line) | Behaviour notes | Core | Neo | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `defineConfig` | `(cfg: ReferenceUIConfig) => ReferenceUIConfig` | Identity helper; same call shape so `ui.config` files can stay. | `src/config/types.ts` (re-export `src/config/index.ts`, `src/public.ts`) | `src/config/types.ts` (re-export `src/author/index.ts`) | copied |
| `ReferenceUIConfig.name` | `name: string` (required) | CSS `@layer` + `data-layer`; reject empty / `"` / newlines. | `config/types.ts`, `config/validate.ts` | `config/types.ts`, `config/validate.ts` | copied |
| `ReferenceUIConfig.include` | `include: string[]` | Core: glob for virtual mirror + Panda scan. Neo: fragment scan + atomic scan; **no codegen copy**. | types + validate | types + validate | copied (meaning changed; PLAN Q3) |
| `ReferenceUIConfig.extends` | `extends?: BaseSystem[]` | Upstream fragments merge first; require fragment/css/jsxElements. | types + validate | types + validate | copied |
| `ReferenceUIConfig.jsxElements` | `jsxElements?: string[]` | Explicit hosts for styletrace / Panda jsx. | types + validate | types + validate | copied |
| `ReferenceUIConfig.normalizeCss` | `normalizeCss?: boolean` default true | Reset layer. Typed in Neo; **validator does not special-case it** (same as core: unknown/extra fields pass through). | types | types | copied (type only; unvalidated) |
| `ReferenceUIConfig.debug` | `debug?: boolean` default false | Debug logging. Typed; not specially validated. | types | types | copied (type only) |
| `BaseSystem` | `{ name, fragment, css?, jsxElements? }` | Portable artefact. | `types/public/BaseSystem.ts` | `config/types.ts` | copied |
| `loadUserConfig` / bundle / evaluate | `loadUserConfig(cwd) → ReferenceUIConfig` | esbuild bundle → CJS `new Function` → validate. | `config/load.ts`, `bundle.ts`, `evaluate.ts` | same under `src/config/` | copied |
| `setConfig` / `getConfig` / `getCwd` / `getOutDir` / `clearConfig` | store accessors | Core snapshots for workers. Neo in-memory only. | `config/store.ts` | `config/store.ts` | partial (worker snapshot dropped) |
| `getOutDir()` / `DEFAULT_OUT_DIR` | always `'.reference-ui'` | **Not a `ui.config` field.** `clean` comments mention `config.outDir`; store ignores it. PLAN Q2: configured-outdir “survives via copied `getOutDirPath`” but still constant. | `constants.ts`, `config/store.ts`, `lib/paths/out-dir.ts` | `constants.ts`, `config/store.ts`, `lib/paths/out-dir.ts` | copied (no author `outdir` field) |
| `strict` | `strict?: ('colors'\|'radii'\|'spacing')[]` | Typegen-time token restriction. Core validates categories. | types + validate (21 tests include this) | not on Neo type; validate **ignores** unknown field | deliberately dropped (defer) — PLAN-host-build.md Q3 |
| `layers` | `layers?: BaseSystem[]` | Upstream component CSS in isolated cascade; warn if no `css`. | types + validate | ignored as unknown | deliberately dropped (defer) — PLAN Q3 |
| `mcp` | `mcp?: { include?, exclude? }` | Atlas selectors only. | types + validate | ignored | deliberately dropped — PLAN Q3, README “MCP not opening chapter” |
| `useReferenceLibrary` / `use_reference_library` | `boolean?` default true | MCP library index. | types + validate (normalize snake) | ignored | deliberately dropped — PLAN Q3 |
| `useReferenceIcons` / `use_reference_icons` | `boolean?` default true | MCP icons. | types + validate | ignored | deliberately dropped — PLAN Q3 |
| `skipTypescript` | `boolean?` default false | Skip tsup dts in packager. On type; packager reads it. | types + packager | n/a | deliberately dropped — PLAN Q3 (“no tsup in Neo”) |
| `outdir` as config field | — | Does not exist on `ReferenceUIConfig`. | n/a | n/a | missing as author field (constant only) |
| Config package export | `@reference-ui/core` / `./config` | Public CLI package. | `package.json` exports, `public.ts` | `@reference-ui/neo` author barrel; **no** `./config` export in `package.json` (only `./runtime`) | partial |
| `getSyncSession` | `getSyncSession(opts) → SyncSession` | Watch generated dir for ready edges. | `session/public.ts`, `public.ts` | MISSING | later leg (watch/bundler) |
| `referenceVite` / `referenceWebpack` | plugin factories | See Host. | `public.ts` | MISSING | later leg |

Unknown-field behaviour: both validators **do not reject** extra keys. Neo’s test `ignores unknown fields as core does today` explicitly keeps `strict`/`mcp`/`layers` on the returned object even though they are not typed.

---

### 2.2 Fragments (author collectors + runner)

| API | Signature | Behaviour notes | Core | Neo | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tokens` | `(tokensConfig: ReferenceTokenConfig) => void` | Nested categories; leaves `{ value, light, dark, description }`; `_private` subtrees scoped to owning package. | `system/api/tokens.ts`; `@reference-ui/system` via `entry/system.ts` | `fragments/api/tokens.ts`; `author/index.ts` | copied |
| `createTokensCollector` | `() => collector` | Sync/eval harness. | `system/api/tokens.ts` | `fragments/api/tokens.ts` | copied |
| `font` | `(name: string, options: FontOptions) => void` | `@font-face` + weights + optional `css` map. | `system/api/font.ts` | `fragments/api/font.ts` | copied |
| `keyframes` | `(keyframesConfig: KeyframesConfig) => void` | Named animations → step maps. Core type = Panda `Config['theme']['keyframes']`. Neo local `Record<string, Record<string, Record<string, string \| number>>>`. | `system/api/keyframes.ts` | `fragments/api/keyframes.ts` | copied (types de-Panda’d) |
| `globalCss` | `(css: GlobalCssConfig) => void` | Selector → style maps (token refs allowed in values). Core type = Panda `Config['globalCss']`. Neo `Record<string, GlobalCssRule>`. | `system/api/globalCss.ts` | `fragments/api/globalCss.ts` | copied (types de-Panda’d; Neo adds `GlobalCssRule`) |
| `extendPattern` | `(extension: BoxPatternExtension) => void` | Extra box-pattern props + `transform`. **Not re-exported from core `entry/system.ts`.** | `system/api/patterns.ts` | `fragments/api/patterns.ts` + **author barrel** | copied (Neo more public than core system entry) |
| `createBoxPatternCollector` | `() => collector` | Internal. | patterns.ts | patterns.ts | copied |
| `recipe()` fragment-level | none as collector | Core extracts runtime `recipe`/`cva` via virtual + `extendRecipes` into Panda theme. No `recipe()` fragment collector in `system/api`. | `panda/config/extensions/api/extendRecipes.ts` | MISSING as fragment API; runtime `recipe()` exists | missing (extract/register path) / runtime partial |
| `getRhythm` | `getRhythm(n)` / `getRhythm(num, denom) → string` | `calc(n * var(--spacing-root))`; public on `@reference-ui/system`. | `system/panda/config/extensions/rhythm/get-rhythm.ts`; `entry/system.ts` | MISSING | missing |
| Color-mode / themes | no author `themes()` | Color modes from token `light`/`dark` via `resolveColorModeTokens` + `extendThemes` + `staticCss.themes`. | `extendThemes.ts`, `resolveColorModeTokens.ts` | token leaves copied; **no** extendThemes/staticCss.themes compiler | partial |
| `staticCss` | internal Panda static generation | Color/spacing/radius `*` static CSS; theme names. | `system/panda/config/static-css.ts` | MISSING (Rust/atomic instead) | deliberately dropped as Panda config — README / PLAN-host drop Panda coerce |
| Breakpoints | `tokens({ breakpoints: { sm: { value: '640px' } } })` | `extractBreakpointTable` → `createRExtension` for **named** `r` keys (px only). | `extractBreakpointTable.ts`, `extensions/r/` | tokens accept the tree; **no** extractBreakpointTable / named `r` | partial (data can exist; wiring missing) |
| Conditions | nested `_hover`, `&…` in style objects | Public types strip viewport keys (`sm`, `md`, …) from `StyleConditionKey`. | `types/public/conditions.ts` | Neo runtime nests object keys into plan `when[]` (e.g. `_hover`) | partial (runtime yes; typed condition catalog missing) |
| Fragment runner | `prepareFragments` / `evaluatePreparedFragments` | Scan include → bundle IIFE → collectors → merge. Core writes panda.config; Neo emits `EvaluatedSystemSpec`. | `system/base/fragments/`, `system/base/create.ts` | `fragments/base/`, `fragments/lib/` | copied (output retargeted) |
| Internal pattern files | container/size auto-injected | Core `resolveInternalPatternFiles` into fragment run. | `base/fragments/index.ts` | Neo runner: box collector only, **no** panda internal pattern files | partial / dropped Panda internals |

---

### 2.3 Runtime

| API | Signature | Behaviour notes | Core | Neo | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `css` | `(...styles: Array<CssStyles \| CssStyles[]>) => string` | Multi-arg merge; skips `null`/`undefined`/`false`. Core: lower `r` then Panda generated `css()`. Neo: lower `r` then lookup compiled style plans; last-wins slots; misses → no class. | `system/runtime/css/customCssFn.ts`; `entry/react.ts` as `css` | `runtime/css/css.ts`; `runtime/index.ts` | partial (parity of sugar, different backend) |
| `css.raw` | same args → `SystemStyleObject` | Core wraps `styledCss.raw` after lowering. | `customCssFn.ts` + `types/public/css.ts` | **not attached** to Neo `css` | missing |
| Responsive arrays | `StylePropValue` includes `Array<T \| null>` | Core types allow Panda responsive arrays. Neo `collectEntries` treats non-plain-objects as atomic values (arrays are not nested `when`). | `types/public/style-prop.ts` | `runtime/css/css.ts` | missing / unproven |
| Conditions / nested selectors | nested objects | Core preserves e.g. `'&[data-component=card]:hover'` (public.test). Neo walks nested keys into `when`. | `system/runtime/public.test.ts` | `css.ts` + tests for `_hover` | partial |
| `!important` | value suffix | Neo: string values ending in `!` set `important: true` on the plan query. Core delegates to Panda (typical `!` utility suffix, not implemented in `customCssFn`). | Panda generated runtime | `css.ts` `splitImportant` | partial (Neo-owned; not a copy of core TS) |
| `r` ranges | `{ r: { 320: {…}, 640: {…} } }` | `lowerResponsiveStyles`: numeric/`Npx` keys → `@container (min-width: Npx)`. Named keys without px fail closed (keep original `r`). Named-container `r` is box-pattern, not this util. | `system/runtime/css/lowerResponsiveStyles.ts` | `runtime/css/lowerResponsiveStyles.ts` | copied |
| `cva` / `recipe` | Core: `cva(config: RecipeDefinition) → RecipeRuntimeFn` aliased `recipe` on react entry. Neo: `recipe(config: RecipeConfig) → RecipeRuntimeFn` | Variants, compound, defaults, `.raw()`, `variantKeys`, `variantMap`, `splitVariantProps`. Boolean variants: core `StringToBoolean<'true'\|'false'>`. Neo: `String(value)` on selection; axes from authored `variants`. Neo **requires `className`**. Core types do not require it (Panda recipe name). | `system/runtime/recipe/customCvaFn.ts`; `entry/react.ts` (`cva as recipe`) | `runtime/recipe/recipe.ts` | partial |
| `recipe().raw` | `(props?) => SystemStyleObject` | Merge base + selected variants + matching compounds (no class lookup). | via Panda `cva` | implemented in Neo | copied-ish (behaviour reimplemented) |
| `box()` | `box(props) → className` | Panda generated pattern; primitives `index.tsx` call `@reference-ui/styled/patterns/box`. Not a core TS export. PLAN-host-build Step 6: **never emit Box/Flex/Grid**. | generated styled + generated primitives | MISSING as function; primitives use `css(styleProps)` | deliberately dropped as pattern components — PLAN Step 6 map rule; function still missing |
| `cx` | typically `(...classNames) => string` | Not in core `src/` (Panda/styled helper). Core primitives use `joinClassName`. | `system/primitives/utils.ts` `joinClassName` | `primitives/runtime/factory.ts` `joinClassName` | copied (`joinClassName`); `cx` missing (Panda) |
| `splitCssProps` / `splitProps` | Panda `splitCssProps` from `@reference-ui/styled/jsx` | Core `splitPrimitiveProps` uses it + `weight` box pattern hoist. | `system/primitives/shared/split-props.ts` | `createPropSplitter(stylePropNames)` — compiled name set, no Panda | partial (Neo-owned replacement) |
| Color-mode helpers | `useColorMode()`, `readDocumentColorMode()`, `resolveColorModeAttr()`, contexts | Core reads `data-panda-theme`. Neo `DATA_COLOR_MODE_ATTR = 'data-color-mode'`. | `primitives/shared/color-mode.ts` | `primitives/runtime/context.ts` | copied + renamed |
| `data-layer` stamping | `shouldEmitLayerScope` / `resolveLayerScopeAttr` | First primitive stamps `data-layer={name}`; restamp on explicit colorMode / missing inherit. | `primitives/shared/layers.ts` | folded into `context.ts` | copied |
| `LayerScopeContext` | `React.Context<boolean>` | `Symbol.for('@reference-ui/LayerScopeContext')` | layers.ts | context.ts | copied |
| `ColorModeContext` / `DocumentContext` | contexts | Shared via `globalThis` symbols. | color-mode.ts | context.ts | copied |
| `registerRuntimeData` / `registerRecipeData` | Neo-only | Bind compiled artifact/tables. Core has no equivalent (Panda modules). | n/a | `runtime/css/css.ts`, `runtime/recipe/recipe.ts` | Neo-only (needed) |

---

### 2.4 Primitives

| API | Signature / notes | Core | Neo | Status |
| :--- | :--- | :--- | :--- | :--- |
| Tag set `TAGS` | HTML tags; `toJsxName`; **no Box/Flex/Grid** | `system/primitives/tags.ts` | `primitives/tags.ts` | copied |
| Generated React entry | `Div`, `Button`, … + contexts | Liquid → `primitives/index.tsx` (pack-time `DATA_LAYER` replace); `forwardRef` | `generateReactEntrySource` string builder; React 19 **ref-as-prop**; layer name baked in | partial (native gen per PLAN; no Liquid — dropped) |
| StyleProps | Core: `Omit<SystemStyleObject, 'font'\|'weight'\|'container'\|'r'> & ReferenceProps` | `types/public/style-props.ts` | Generated `{ [K in StylePropName]?: unknown }` from compiled names | partial |
| DOM passthrough | native props minus style keys | `types/public/primitives.ts` `PrimitiveProps` | factory spreads `elementProps` | copied behaviour |
| `css` prop | `css?: SystemStyleObject` | PrimitiveCssProps | split `css` → `cssProp`, merged in `css(styleProps, cssProp)` | copied |
| `as` polymorphism | **explicitly none** (“without polymorphic `as`”) | `primitives.ts` comment | none | copied (never had `as`) |
| `variant` | `data-variant` attr, not a style key | props.ts `VariantProps` | context `variantAttr` | copied |
| `colorMode` | metadata; stamps color-mode attr + restamps layer | ColorModeProps | same | copied (attr renamed) |
| `useColorMode` | hook | color-mode.ts | context.ts; generated react re-exports | copied |
| Typegen unions | packager + `types/generators` + strict wrappers | `types/public/*`, `types/generators/strict.ts` | generate emits `StylePropName` union only; **no** token-literal unions / strict | missing (PLAN Q3 defer `strict`; typegen is Rust below the cut) |
| Marker class | `ref-${tag}` | generated primitive source | factory `joinClassName(\`ref-${tag}\`, …)` | copied |

---

### 2.5 Host (enumerate; later vs never)

Stance: Neo README — watch, Vite, MCP, Book, baroque packager are not v0; pieces that only coerce Panda or orchestrate workers **do not come across**. PLAN-host: drop Piscina, virtual-rs, Liquid.

| Area | What it does (headers + exports) | Core paths | Neo | Later vs never |
| :--- | :--- | :--- | :--- | :--- |
| **sync** | CLI hub: bootstrap, workers, virtual, panda, packager, watch. `syncCommand`, `runSync`. | `src/sync/` (`command.ts`, `run.ts`, `index.ts`) | `src/sync/index.ts` `sync(cwd)` serial fragments→compile→publish | **later** for watch/`--build`; **never** worker orchestra / Panda init |
| **clean** | `cleanCommand(cwd)` rm `.reference-ui` + `@reference-ui` symlinks | `src/clean/` | sync `rmSync`s outdir first; no standalone CLI `clean` | **later** as CLI verb; behaviour partly inlined |
| **watch** | `@parcel/watcher` → `watch:change`; include globs | `src/watch/` (`init`, `watcher`, `roots`) | MISSING | **later** (“watcher is a loop around the same function” — README) |
| **vite** | `referenceVite(options?): Plugin` — exclude generated pkgs, batch HMR on session ready | `src/vite/plugin.ts`, `types.ts` | MISSING | **later** |
| **webpack** | `referenceWebpack(options?): Plugin` — aliases, ignore generated writes, invalidate | `src/webpack/plugin.ts` | MISSING | **later** (README: not webpack5 in harness) |
| **packager** | Bundle runtime entries, write `react/system/styled` packages, dts (tsup), postprocess layer name, install/symlinks | `src/packager/` | `sync/publish.ts` + `sync/react.ts` minimal write + symlinks; no tsup | **later** (packager product decision — README); dts/tsup **deferred** PLAN Q4 |
| **virtual** | Copy `include` → `.reference-ui/virtual` with Panda-shaped transforms (cva-imports, css-imports, neutralize, MDX, responsive) | `src/virtual/` | MISSING; PLAN Q2 drops `virtual/` folder | **never** (Panda coercion / virtual-rs) |
| **MCP** | CLI `ref mcp` delegates `@reference-ui/mcp`; `core/tokens` MCP flatten; `mcp` config | `src/index.ts`, `src/tokens/`, config.mcp | MISSING | **later** (PLAN: not tonight; README not opening chapter) |
| **reference / browser-component** | Tasty API, `Reference` browser renderer, copy into virtual for Panda scan | `src/reference/` (`api.ts`, `browser/`, `bridge/`); `entry/types.ts` | MISSING | **later** (PLAN: tasty not tonight) |
| **session** | Sync session manifest + `getSyncSession` for bundler plugins | `src/session/` | MISSING | **later** (with watch/vite) |
| **CLI `ref`** | `sync` default, `build`, `clean`, `mcp` | `src/index.ts` | no Neo CLI bin | **later** |
| **thread-pool / events** | Piscina + BroadcastChannel | `src/lib/thread-pool`, `events.ts` | never | **never** |
| **panda gen / stylesheet postprocess** | `panda.config.ts`, codegen, demote panda layers, portable sheet | `src/system/panda/**`, `system/stylesheet/**` | Rust compile + publish CSS | **never** as Panda; **later** any leftover CSS rewrite if sheets still emit panda attrs |
| **microbundle** | esbuild wrapper for config/fragments | `src/lib/microbundle` | `src/lib/microbundle` | copied (needed) |
| **paths** | out-dir, tmp, ref-config, virtual-dir, global registry | `src/lib/paths` | out-dir, tmp, ref-config only | partial; virtual-dir/registry **dropped** PLAN Step 0 |

---

## 3. Core unit-test inventory

Counts via `rg -c '^\s*(it|test)\('` on `*.test.ts(x)`. “Copied to Neo?” = colocated Neo file covering the same area (not necessarily identical cases).

| Area | Core files (count) | Σ | Copied to Neo? |
| :--- | :--- | ---: | :--- |
| Config | `config/bundle.test.ts` (2), `evaluate.test.ts` (3), `validate.test.ts` (21) | 26 | **yes** — neo 3 / 3 / 12 (trimmed: no mcp/strict/layers/library cases) |
| Fragment collectors | `system/api/tokens.test.ts` (5), `keyframes.test.ts` (5), `font.test.ts` (3), `patterns.test.ts` (3) | 16 | **yes** — same counts; **no** core `globalCss.test.ts` and Neo also has none |
| Fragment runner / base | `system/base/create.test.ts` (10), `system/base/fragments/index.test.ts` (5) | 15 | **partial** — neo `fragments/base/{index,evaluate,merge}.test.ts` (4+4+7); create.ts panda/font-types tests not brought |
| lib/fragments infra | `lib/fragments/tests/fragments.unit.test.ts` (19), `e2e.test.ts` (9) | 28 | **no** (neo has `fragments/lib` without those test files) |
| Runtime css/cva | `system/runtime/public.test.ts` (4), `recipe/customCvaFn.test.ts` (4) | 8 | **no** (rewritten): neo `css.test.ts` (7), `lowerResponsiveStyles.test.ts` (4), `plans.test.ts` (8), `recipe.test.ts` (11) |
| lowerResponsiveStyles | *no colocated core test file* (covered inside public.test / customCvaFn.test) | 0 dedicated | **yes** as neo dedicated file (4) |
| Rhythm / r / shorthands (Panda) | `rhythm/helpers.test.ts` (16), `utilities.test.ts` (9), `border.test.ts` (4), `r/createRExtension.test.ts` (8), `shorthands.test.ts` (38), `size/styles.test.ts` (2) | 77 | **no** |
| Token color-mode / breakpoints / extend* | `resolveColorModeTokens.test.ts` (11), `extractBreakpointTable.test.ts` (7), `extendThemes.test.ts` (1), `extendRecipes.test.ts` (1), `extendPatterns.test.ts` (2), `extendGlobalCss.test.ts` (1), `extendFontFaces.test.ts` (1), `font.test.ts` under extensions/api (7), `bundle.test.ts` (4) | 35 | **no** (compiler still Panda/Rust) |
| Primitives | `primitives/generate/generate.test.ts` (4), `shared/color-mode.test.ts` (8), `context.test.ts` (6), `layers.test.ts` (7), `split-props.test.ts` (3) | 28 | **partial** — neo generate (8), context (5), factory (5), split (3), tags (3); color-mode/layers folded; panda-theme assertion **must not** copy |
| Types | `types/public/recipe.test.ts` (2), `types/generators/fonts.test.ts` (3), `strict.test.ts` (7) | 12 | **no** |
| Paths | `lib/paths/out-dir.test.ts` (2), `ref-config.test.ts` (4), `tmp-dir.test.ts` (2), `core-package-dir.test.ts` (6), `core-dist.test.ts` (1), `global-registry.test.ts` (4) | 19 | **partial** — neo `out-dir.test.ts` (2) only |
| Microbundle | `build-options.test.ts` (6), `microbundle.test.ts` (4), `alias.test.ts` (1), `react-stub.test.ts` (1) | 12 | **partial** — neo 6+4+1, no react-stub |
| Sync (core workers) | `sync/events.test.ts` (19), `complete.test.ts` (4), `failure-boundary.test.ts` (2) | 25 | **no**; neo `sync/sync.test.ts` (7) is new |
| Watch | `watch/roots.test.ts` (11), `watcher.test.ts` (8), `worker.test.ts` (5), `gitignore.test.ts` (4) | 28 | **no** |
| Vite / webpack | `vite/plugin.test.ts` (7), `hot-update-policy.test.ts` (7), `webpack/plugin.test.ts` (2) | 16 | **no** |
| Packager | `run.test.ts` (7), `install.test.ts` (10), `layout.test.ts` (8), `bundler/index.test.ts` (3), `postprocess.test.ts` (5), `worker.test.ts` (3), `init.test.ts` (2), `ts/install/packages.test.ts` (4) | 42 | **no** |
| Virtual | 8 files, 32 tests (`detect` 8, `copy` 4, `staging` 2, snapshots 3+1, `run` 6, `collection` 1, transforms 2+2+3+1+2, `worker` 3) | 32 | **no** (never) |
| Session | `session/{files,init,public,state,watch}.test.ts` 19+15+13+14+2 | 63 | **no** |
| Stylesheet / panda gen | many (postprocess 8+11, transforms 5+6+11, codegen 10, gen index 4, create 3, …) | ~80+ | **no** (Panda) |
| Clean | `clean/command.test.ts` (1) | 1 | **no** |
| Reference/Tasty | `reference/run.test.ts` (2), `unionTypeLabel.test.ts` (4) | 6 | **no** |
| Misc lib (event-bus, fs, log, profiler, thread-pool, symlink, run) | see rg list | ~80 | **no** (never for pool/bus) |

**Bring-across shortlist for the plan:** already in Neo (keep green): config + collector tests. Still worth copying if behaviour must match: `lib/fragments` unit/e2e (28), `get-rhythm` via `rhythm/helpers.test.ts` (16) *if* `getRhythm` is public, `resolveColorModeTokens.test.ts` (11) and `extractBreakpointTable.test.ts` (7) as *spec oracles* for Rust/Neo merge, `color-mode.test.ts` (8) after renaming the attr assertion, `split-props.test.ts` (3) already reimplemented. Do **not** copy panda/virtual/packager/watch tests into Neo’s inner loop.

---

## 4. Panda-isms to rename at the boundary

| Found in core | Kind | Neo name (if decided) |
| :--- | :--- | :--- |
| `data-panda-theme` / `DATA_COLOR_MODE_ATTR = 'data-panda-theme'` | DOM attr, comments, stylesheet selectors, tests | **`data-color-mode`** — `DOMAIN.md` Current; `primitives/runtime/context.ts` |
| Comments “Register … with Panda CSS”, “merged into panda.config” | comments on tokens/keyframes/font/globalCss/extendPattern | Neo copies already say “system spec” / “sync time” |
| `import type { Config } from '@pandacss/dev'` on keyframes/globalCss | types | Neo local `KeyframesConfig` / `GlobalCssConfig` |
| `panda.config.ts`, `outdir: 'styled'`, generated Panda config | artifacts / comments | **do not generate** — PLAN Q2 drops `panda.config.ts` |
| `codegen` folder / virtual copy of `include` | pipeline | Neo `include` = scan roots only — PLAN Q3 |
| `cva` as public name (Panda); react entry aliases `recipe` | identifier | Prefer **`recipe`**; keep `cva` as undocumented alias? **undecided** |
| `@reference-ui/styled/css`, `styled/css/cva`, `styled/jsx` `splitCssProps`, `styled/patterns/box` | generated Panda runtime | Neo `css`/`recipe` over **Rust plans**; primitives `createPropSplitter` |
| `demotePandaGlobalCssLayer`, `[data-panda-theme=…]` in stylesheet tests | CSS postprocess | If sheets still emit panda attrs, rewrite at publish; target `data-color-mode` (`docs/FEATURES/DATA_THEME.md` also discusses `data-theme` — **DOMAIN wins: `data-color-mode`**) |
| `extendThemes` / Panda `themes` / `staticCss.themes` | config API | no panda themes object; token `light`/`dark` + compiler |
| `virtual/`, `virtual-rs`, Piscina, Liquid `primitives.liquid` | machinery | **never** — README + PLAN-host + DOMAIN Retired `panda-isms` |
| Collector comment example `name: 'panda-config'` | `lib/fragments/collector.ts` | Neo collector copy should stay panda-free |
| MCP token surface mentioned in `tokens()` JSDoc | comment | Neo JSDoc already dropped “MCP” |

---

## 5. Open questions (max 10)

1. **Is `getRhythm` part of the public `@reference-ui/system` contract Neo must ship**, or only an implementation detail of rhythm tokens that Rust/atomic can bake?

2. **Named `r` breakpoints** (`tokens({ breakpoints })` + `createRExtension`) vs **numeric-only** `lowerResponsiveStyles` — does Neo/Rust need the named table before primitives/`r` on elements is complete?

3. **`css.raw`**: any lib/author call sites that must keep working, or can Neo omit until typed `SystemStyleObject` exists?

4. **Responsive arrays** (`color: ['red', 'blue']`) — required author sugar, or viewport arrays were already filtered from public types and can stay unsupported?

5. **`cva` alias**: export `cva` as `recipe` forever, or drop `cva` at the Neo boundary?

6. **`box()` function** (not Box component): do authors/call sites need a pattern helper, or is `css()` + primitives enough given Step 6’s no-Box/Flex/Grid rule?

7. **Color-mode compiler parity**: must Neo reproduce `resolveColorModeTokens` truth table in TS before the spec crosses the cut, or does Rust already own it from `EvaluatedSystemSpec` token leaves?

8. **Public types**: when do authored `SystemStyleObject` / condition keys / token unions land (typegen below the cut vs Neo `.d.ts` stubs)? What is the interim contract for lib?

9. **`strict` / `layers` / author `outdir`**: Q3 defers the first two; `outdir` is not actually a config field today — should Neo add a real `outdir` override or keep the constant?

10. **`extendPattern` public from `@reference-ui/neo`**: core hides it from `entry/system.ts`; Neo author barrel exports it. Intentional expansion, or should it stay internal until box-pattern runtime exists?

---

*Probe complete. Paths are repo-relative under `packages/reference-core` and `packages/reference-neo` unless noted.*
