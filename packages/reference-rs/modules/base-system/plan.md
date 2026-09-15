# base-system — plan

Build this crate into the authoritative design-system artefact, derived from what
`@reference-ui/lib` already defines. Self-isolated first: no fragment evaluator, no
`extends`, no `layers`. The goal atomic cares about is narrow and concrete —
**atomic should see a valid base system with all correct tokens, soon.**

Contract: [SPEC.md](./SPEC.md) — 43 cases, 21 proven. Sequencing:
[../../PLAN.md](../../PLAN.md) Phase 1. Quality: `pnpm agentrs q <path>`.
Verify: `pnpm agentrs c base_system && pnpm agentrs v atomic`.

---

## 1. The one thing to understand first

**There are two shapes, and the crate currently only has one.**

What lib authors, and what fragments emit, is a *nested* tree with mode slots:

```json
{ "colors": { "gray": { "800": { "value": "oklch(...)" } },
              "text": { "primary": { "light": "{colors.gray.900}", "dark": "{colors.gray.50}" } } } }
```

What `BaseSystem` deserializes today is the *already-indexed* form, because
`TokenDictionary` is `#[serde(flatten)] IndexMap<String, TokenEntry>`:

```json
{ "tokens": { "colors.gray.800": { "category": "colors", "cssVar": "--colors-gray-800",
                                   "light": "oklch(...)", "dark": "oklch(...)" } } }
```

These are not compatible. Handing the crate a nested dump does not produce
`colors.gray.800` — it fails `TokenEntry` deserialization, or with unknown-field
tolerance yields a partial map. So `BAS-DUMP-02` is not "wire up serde"; it needs
a distinct dump type plus a lowering pass.

Naming them apart is the whole design:

| Type | Role |
| :--- | :--- |
| `BaseSystemDump` | Authored, nested, `{ value \| light \| dark }` leaves, brace aliases intact. The wire format. |
| `BaseSystem` | Indexed, flat `category.path` keys, precomputed `cssVar`. The query engine atomic uses. |

`from_json` = deserialize `BaseSystemDump`, then lower to `BaseSystem`. Everything
below follows from that split.

**It is also the fix for a live footgun.** Every field on `BaseSystem` is
`#[serde(default)]` with no `deny_unknown_fields`, so `{}` deserializes into a
fully empty system — and so does core's *unrelated* TypeScript `BaseSystem`
(`{ name, fragment, jsxElements }`, `reference-core/src/types/public/BaseSystem.ts`).
Passing that binds `name`, leaves every dictionary empty, and because the field is
`Some`, **skips `lib_fixture()` entirely**. Compile then reports success with no
tokens, no conditions, and no breakpoints. A `BaseSystemDump` with
`deny_unknown_fields` rejects it by name. That is atomic's `ATM-TOKEN-10`.

---

## 2. What atomic actually needs

Measured, not assumed. Atomic reads these fields:

| Field | Used for |
| :--- | :--- |
| `tokens` | `var(--…)` lookup (`resolve/tokens/mod.rs:95,99`) and `@layer tokens` emit (`system_layers.rs`) |
| `fonts` | family / weight / css extras (`resolve/font/*`), `has_family` |
| `breakpoints` | array slots, `r={{ md }}`, named `sm` → `@container` |
| `conditions` | `get_condition` for `_hover` / `_dark` wraps |
| `global_css` | `@layer global` |
| `keyframes` | `@keyframes` inside `@layer global` (Step 4) |
| `static_css` | third want source |

It reads **none** of `name` or `recipes`, and after Step 4 it *does* read
`keyframes` for `@layer global` `@keyframes` emit. It calls **none** of
`is_token`, `token_category`, `token_css_var`, `token_light`, `token_dark` — it
reads `TokenEntry` fields directly because they are public. So half the query API
in `SPEC.md` §ASK is currently dead code, and the light/dark distinction is carried
by the convention `entry.dark != entry.light`.

Two consequences for this plan. Steps 1–3 below are the whole critical path for
atomic. And the `ASK` cases should be implemented as the *only* access path, with
`TokenEntry` fields made private, or they will stay dead.

---

## 3. Sequence

### Step 1 — `BaseSystemDump` + `from_json` *(unblocks everything)*

Add the nested wire type and the lowering pass. Owner: `BAS-DUMP-02`,
`BAS-DUMP-03`, `BAS-DUMP-04`, `BAS-TOKEN-01`, `BAS-TOKEN-02`.

Lowering must do five things, all of which lib exercises today:

1. **Flatten** nested paths to `category.path`, preserving intermediate segments.
   Deepest real case is `colors.ui.list.definition.description.foreground` —
   five segments after `colors`, four under the `ui` group.
2. **Compute `cssVar`** with the existing `css_custom_property`
   (`tokens/mod.rs:98`): kebab the **category** only; path camelCase stays
   (`colors.myColor` → `--colors-myColor`, `colors.ui.kbd.shadowMix` →
   `--colors-ui-kbd-shadowMix`). Do not change this in Step 1.
3. **Resolve mode slots** per core's **seven**-case table
   (`resolveColorModeTokens.ts:14-21`): `value`; `light`; `dark`; `value+dark`;
   `value+light`; `light+dark`; `value+light+dark` (value ignored). Lib only
   exercises `{ value }`, `{ value, dark }` (6), and `{ light, dark }` (92).
   Keep today's `dark == light` sentinel; `Option` is Step 3.
4. **Keep brace aliases verbatim.** `'{colors.gray.800}'` stays a string; atomic
   strips braces and re-looks-up (`system_layers.rs:82-96`). Do not resolve here.
   Do detect cycles (`BAS-TOKEN-08`).
5. **Handle the `light` trap.** `colors.design.text.light` is a token *named*
   `light` whose value is itself `{ light, dark }`. Distinguish a mode slot from a
   nested group by whether the value is an object.

Reject on: unknown top-level keys, a leaf with neither `value` nor `light` nor
`dark`, and duplicate paths within one batch (`BAS-TOKEN-07`).

Keep the token dictionary **open** — arbitrary categories, no closed enum.
`ReferenceTokenConfig` (`system/api/tokens.ts:11`) is an open recursive type, so a
consumer may declare any category. `BAS-TOKEN-05`'s fifteen-category list is a
typegen concern, not a dictionary constraint.

### Step 2 — Generate the lib artefact, and detect drift *(landed 2026-09-15)*

`lib_fixture()` loads `src/lib_fixture/lib.json` through `from_json`. Generator
is `modules/base-system/generate/` (scanner, not an evaluator). 334 leaves,
337 indexed (plus three `font()` families). Drift: `pnpm --filter @reference-ui/rust base-system --check`.
Hand-copied `palette.rs` / `ui.rs` / `semantic.rs` deleted. `standard()` and
the 78 wraps are documented as host/Panda overlays.

Today `lib_fixture()` is hand-copied tables across `tokens/{palette,semantic,ui}.rs`,
`fonts.rs`, `conditions.rs`, `breakpoints.rs`, with **no generator, no checksum,
and no test comparing it to `packages/reference-lib`**.

The hand-copy is closer than expected — 329 tokens versus lib's 334, the gap being
the six `colors.reference.*` and two `fonts.reference.*` Reference-browser tokens.
So this is a consolidation, not a rebuild.

Lib's token *data* is plain object literals with `as const`, string values, no
computed keys and no cross-module spreads, so a generator can serialise it
**without a JS evaluator**. It must merge six `tokens()` call sites — `colors` is
split across `colors.ts`, `design.ts`, and `primitives/tokens.ts` — and treat
`font()` as its own shape.

Two things are **not** derivable this way and stay out of scope:

- **`globalCss` chrome.** Twenty calls across eighteen files, spreading
  `baseTypography`, `focusRingStyles`, `controlSize`, `fieldBase`, and calling
  `pressableActiveStyles()`. This genuinely needs the evaluator. The fixture keeps
  its single `:root { --spacing-root: 0.25rem }` entry until fragments land.
- **`fontWeights`.** Derived from `font().weights` by core's `buildFontTokens()`,
  not authored as tokens.

Then add the drift test. That is the deliverable that stops this recurring.

**Correct two false provenance claims while here.** `BreakpointScale::standard()`
comments that `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536` is "the lib table" —
**lib authors no breakpoints at all**. Same for `conditions.rs`: those 78 wraps are
Panda-preset shapes, not lib TypeScript. The values are fine; the comments claim an
upstream that does not exist, which is how the next person gets misled.

### Step 3 — Fix the modelling while the types are open

Cheap now, expensive later. Owner: `BAS-ASK-01`, `BAS-ASK-02`, `BAS-ASK-06`,
`BAS-DUMP-05`.

- **`Option<String>` for dark**, not `dark == light` as the "no dark variant"
  sentinel. Today a token whose dark value legitimately equals its light value is
  indistinguishable from one with none (`system_layers.rs:62,78`).
- **Bare-name, category-scoped lookup inside the crate.** `BAS-ASK-01` specifies
  `is_token("n300")`; the implementation only accepts full `category.path`, so the
  fallback ended up in atomic where it **allocates per want**:
  `system.token(&format!("colors.{path}"))` (`resolve/tokens/mod.rs:99`). Same bug
  in `get_condition`, which does `format!("_{key}")` on the miss path
  (`lib.rs:93-97`). Both violate `BAS-ASK-06` and tripwire 8.
- **Private `TokenEntry` fields**, forcing the `ASK` query API to be the real
  access path rather than dead code.
- **`FxHashMap` for the hot maps** as `BAS-ASK-06` requires; `IndexMap` only where
  insertion order is a contract (the token layer emit order).
- **`Arc` for O(1) clone** if `BAS-DUMP-05` is to be honest. Today `Clone` deep-
  copies every map and the only test proves `Send + Sync`.

### Step 4 — Type keyframes and recipes *(landed 2026-09-15)*

Typed `KeyframeDefinition` (name → ordered steps) and `RecipeDefinition`
(base / variants / defaultVariants / compoundVariants). Generator scans the six
`keyframes()` files into `lib.json`. Atomic prints `@keyframes` inside `@layer
global` when the dump has them; custom stations without keyframes stay empty.
Recipes stay empty on the lib fixture (not scraped from components). FONT-02
`@font-face` is still out: `FontDefinition` ignores `fontFace`.

Both were `IndexMap<String, String>` placeholders. `BAS-MOTION-01` needs frame
steps; `BAS-RECIPE-01/02` need base, variants, `defaultVariants`, and compounds.
Their emptiness is why `@keyframes` and `@font-face` never emit, while the fixture
ships `--animations-fadeIn-normal: fadeIn 0.5s ease-out` — a dangling reference to
an animation no sheet defines. Lib has 31 keyframe names across 6 files.

### Step 5 — Defer

`extends` (5 cases) and `layers` (4 cases) have no fields and no consumer. Leave
them. Fragment evaluation stays in TypeScript.

---

## 4. Verification

Per step: `pnpm agentrs c base_system`, then `pnpm agentrs v atomic` (the
consumer), then `pnpm agentrs q` on every touched file.

The real gate is downstream: atomic's CSS quarantine group 2 (undeclared
tokens) is already gone via per-station dumps. Step 2 must not reintroduce
raw `n300` on those stations. Stations still on `lib_fixture()` will churn
`@layer tokens` if the generated dump adds or reorders tokens — that is
expected; custom-dump stations must not change.

SPEC proof map is 21/43 after Step 4. `lib_fixture_has_lib_tokens_fonts_and_host_conditions`
is still a real fixture test.

---

## 5. Do not

- Do not evaluate author JavaScript, bundle, or parse TSX here (tripwire 1).
- Do not do file I/O in the crate (tripwire 6). The generator is a build-time tool
  that *writes* Rust or JSON; the crate itself stays in-memory.
- Do not close the token category set into an enum. The authored schema is open.
- Do not resolve brace aliases during lowering — atomic owns that, along with
  `/opacity` `color-mix`.
- Do not reuse `shared/src/testing/base_system.rs` as the dump format. Those JSON
  helpers are a **third**, Panda-ish nested shape not wired to `lib_fixture()`.
  Either align them to `BaseSystemDump` or delete them; leaving three shapes is how
  this went wrong once.
- Do not print CSS, class names, or `.d.ts` from this crate (tripwires 2, 3).
- Do not let `extract()`'s standalone path keep silently using the fixture scale
  while `compile()` uses the request's (`extract/mod.rs:297-300`). Fix or remove.
