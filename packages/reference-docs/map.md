# Docs map: Panda's coverage onto Reference UI (2026-10-21)

Internal planning only. Page copy never names Panda. Builds on the gap pass in
[plan.md](plan.md); statuses checked against code on `public-release` @ `ab90ac9e5`.

Status key: **ours** = we have the concept at Panda's depth · **simpler** = we have
it in a smaller form · **not ours** = we don't have it; drop, never invent.
Page marks: ✓ exists · NEW · → moved/renamed · ✂ split.

## 1. Summary

- Scope: what users write (style props, `css()`, `recipe()`, conditions, container-first
  responsive, tokens/tones/rhythm, fonts, keyframes, `globalCss()`, primitives, config,
  CLI, sync, sharing via `extends`/`layers`, diagnostics, types), what lib ships, and MCP.
- Of 133 Panda pages, 74 have an equivalent (63 ours, 11 simpler): 63 land on existing
  pages, 11 on one of 9 new pages. 59 are not ours (other frameworks, patterns, plugins,
  studio, migrations, lint).
- Biggest gaps, all authoring surface: (1) which package each call is imported from
  (docs say `@reference-ui/system`, types page lists only `react` + `core`, `extendSystem`
  is core-only, `getRhythm` system-only); (2) no reference entry for `extendSystem()` /
  `baseSystem`; (3) "what sync can read" (bindings, `staticCss`, `jsxElements`, wrapper
  tracing) is one section of `css.mdx`; (4) install is one Bundlers page, but our axis is
  the bundler (React-only), so it splits into Vite and webpack; (5) lib's base styles for
  plain HTML elements are undocumented.
- Shape: one sidebar, six sections (Get started, Guides, MCP, System, Foundations,
  Components) with sub-categories, which need a new `group` frontmatter field.
  Architecture is a separate later track.

## 2. Proposed sidebar

Sub-categories need a `group` frontmatter field and `DocSidebar` support (open question 1).

### Get started
| Group | Page | Mark | Covers |
|---|---|---|---|
| — | Getting started (`getting-started/initialize`) | ✓ → section only (frozen) | Install, `ref init`, first sync, first style. |
| Bundlers | Vite | ✂ NEW from `guides/bundlers` | `ref sync && vite build`, watch mode, import the stylesheet. Tested (matrix `vite7`). |
| Bundlers | webpack | ✂ NEW from `guides/bundlers` | Same for webpack 5 (managed `webpack5`; no kept suite runs it: Q7). |
| — | Add to an existing app | ✓ → from Guides | Two stylesheets meeting; moving over. |
| — | Server-side rendering | ✓ → from Guides | Host-agnostic SSR, colour mode on the server. Name a host only once tested (Q8). |
| — | FAQ | NEW | Browser support, `@layer`, React versions, commit `.reference-ui/`? |

### Guides (A-to-B tasks)
| Group | Page | Mark | Covers |
|---|---|---|---|
| Styling | Choose a styling API | ✓ | Style props → `css()` → `recipe()` → `globalCss()` → tokens; which style wins. |
| Styling | Build a component | ✓ | Primitive + recipe → your own component. |
| Styling | Multi-part components | ✓ (rewrite on `recipe({ slots })`) | Your own, lib's, and a headless library's parts. |
| Styling | Responsive layouts | ✓ | Respond to a panel; switch a recipe variant. |
| Styling | Style HTML you don't control | NEW | Markdown/CMS output styled with `globalCss()` selectors and tokens. |
| Theming | Theming | ✓ (frozen) | Your colours, spacing, fonts, animations, dark mode, strict, base system. |
| Theming | Customization | ✓ | Restyle lib and primitives; branded copy with `extendSystem`. |
| Theming | Library components | ✓ (frozen) | Why lib has the components it has. |
| Sharing | Share a design system | ✓ | Publish a system; `extends` vs `layers`; monorepo. |
| Fixing | Troubleshooting | ✓ | Missing styles, sync errors, package components that don't paint. |

### MCP
| Page | Mark | Covers |
|---|---|---|
| Overview | ✓ | What the agent can ask; where answers come from. |
| Setup | ✓ | Sync, add the server, try it, HTTP. |
| Configuration | ✓ | Include/exclude, CLI flags, env, `useReferenceLibrary`/`useReferenceIcons`. |
| Tools | ✓ | Every tool and resource. |

### System (core APIs, reference)
| Group | Page | Mark | Covers |
|---|---|---|---|
| Overview | Introduction (`system`) | ✓ | What you write, what sync does, what you get. Fix the rendered Atlas TODO. |
| Overview | Imports and packages | NEW | Every package and entry point, what each exports, which are generated. |
| Overview | Sync | ✓ | What sync writes, watch mode, verify output. |
| Overview | CLI | ✓ | `ref init`, `sync`, `clean` and flags. |
| Overview | Config | ✓ | Every `ui.config.ts` key (move `jsxElements` out of "Output"). |
| Styling | Primitives | ✓ | One component per element; props; `colorMode`; `data-layer`; `variant`. |
| Styling | Style props | ✓ | Properties, shorthands, Reference props (`r`, `size`, `weight`), values, conditions. |
| Styling | Style prop reference | ✓ | Per-area shorthands, token categories, special values (add Interactivity, Lists, Tables rows). |
| Styling | css() | ✓ | `css()`, combining styles, selectors, at-rules. |
| Styling | Recipes | ✓ (+ Slots section when it lands) | `recipe()`, variants, compound, responsive, runtime values, helpers, types. |
| Styling | Conditions | ✓ | Named conditions, value-level conditions, `&` selectors and at-rules. |
| Styling | Responsive | ✓ | Container-first breakpoints, ranges, named containers, viewport. |
| Styling | Global CSS | ✓ | `globalCss()`, nesting, breakpoints, the reset. |
| Styling | What sync can read | NEW | Static vs runtime values, bindings, `staticCss`, `jsxElements`, wrapper tracing. |
| Theme | Tokens | ✓ | Define, reference, categories with value shapes, `description`, private, strict. |
| Theme | Tones and opacity | ✓ → retitle `tones` | Named tones and `/NN` opacity (with `%`, decimals). |
| Theme | Spacing | ✓ | `r` unit, spacing root, named spacing, `getRhythm()`. |
| Theme | Light and dark | ✓ | Dark values, setting/toggling/reading the mode. |
| Theme | Fonts | ✓ | `font()`, weights, files. |
| Theme | Animation | ✓ | `keyframes()`, animation tokens, reduced motion. |
| Theme | Base systems | NEW | `baseSystem`, `extendSystem()`, what travels through `extends`/`layers`. |
| Output | Cascade layers | ✓ | Layer order, one layer per system, your own CSS. |
| Output | Diagnostics | ✓ | Every code, severity, JSON output. |
| Output | Types | ✓ | Importable types (add `TokenConfig`, `GlobalCssRule`, `FontWeightName`). |

### Foundations (what `@reference-ui/lib` ships)
| Page | Mark | Covers |
|---|---|---|
| Introduction | ✓ | What lib ships; use and override its values. |
| Color | ✓ | Palette, lib's tones, semantic `design.*` tokens, light/dark. |
| Typography | ✓ | Families, weights, scale, inline text and code. |
| Radius | ✓ | Radius tokens. |
| Motion | ✓ | Animation presets and keyframes. |
| Element styles | NEW | Lib's base look for plain HTML: forms, tables, document, media, prose, focus-visible, selection. |
| Sizes | NEW | `controlHeight`, `controlSize`, `iconSizes`, `defaultIconSize`. |

### Components (groups follow `components.mdx`)
| Group | Pages (all ✓) |
|---|---|
| — | Overview |
| Foundation | ReferenceLibrary (frozen), Overlay, Popover, Tooltip, Toast, Portal |
| Form controls | Field, Switch, Slider, NumberField, DateField, Calendar, Combobox |
| Collections | Listbox, Menu, Menubar, Tabs, Tree |
| Disclosure and layout | Collapsible, Accordion, Splitter |
| Building blocks | Presence, FocusLock, RovingFocus, Slot, announce, useMeasure |
| Content | Icons, Reference |

### Architecture (later, owner-owned): see section 6.

## 3. Panda → Reference UI map

Every page under `vendor/docs/panda/website/content/docs/` (133). SPR = System/Style prop reference.

### get-started (35)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| why-panda | System/Introduction ✓ | ours | What it is and what you get. |
| thinking-in-panda | Guides/Choose a styling API ✓ | ours | |
| framework-guides | Get started/Bundlers group (Vite, webpack) | simpler | Our axis is bundler, not framework: React-only. |
| vite | Get started/Vite ✂ NEW | ours | Matrix `vite7`. |
| cli | System/CLI ✓ | ours | |
| faq | Get started/FAQ NEW | ours | |
| mcp-server | MCP section ✓ | ours | Four pages vs one. |
| nextjs | — (SSR guide host-agnostic) | not ours | Untested; add a note only once tested (Q8). |
| react-router | — | not ours | Untested React host. |
| remix | — | not ours | Untested React host. |
| gatsby | — | not ours | |
| redwood | — | not ours | |
| rsbuild | — | not ours | Untested bundler. |
| bun | — | not ours | Untested bundler. |
| postcss | — | not ours | Sync is the CLI; no PostCSS plugin. |
| storybook | — | not ours | |
| preact | — | not ours | React-only. |
| angular | — | not ours | React-only. |
| astro | — | not ours | React-only. |
| ember | — | not ours | React-only. |
| nuxt | — | not ours | React-only. |
| qwik | — | not ours | React-only. |
| solidjs | — | not ours | React-only. |
| svelte | — | not ours | React-only. |
| vue | — | not ours | React-only. |
| chakra-ui | — | not ours | Migration guide (Q10). |
| emotion | — | not ours | Migration guide (Q10). |
| styled-components | — | not ours | Migration guide (Q10). |
| stylex | — | not ours | Migration guide (Q10). |
| tailwind | — | not ours | Migration guide (Q10). |
| vanilla-extract | — | not ours | Migration guide (Q10). |
| linting | — | not ours | `strict` covers raw values (System/Config). |
| agent-skills | — | not ours | MCP is our agent story. |
| llms-txt | — | not ours | |
| upgrading-to-v2 | — | not ours | No prior major. |

### styling (21)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| overview | System/Introduction ✓ | ours | |
| writing-styles | System/css() ✓ + Style props ✓ | ours | |
| style-props | System/Style props ✓ | ours | Primitives carry them, not `styled.*`. |
| conditional-styles | System/Conditions ✓ | ours | |
| responsive-design | System/Responsive ✓ | ours | Container-first; viewport is the exception. |
| dynamic-styling | System/What sync can read NEW (+ css() §runtime) | ours | |
| extraction-rules | System/What sync can read NEW | ours | Bindings: `extract/bindings.rs`. |
| static | System/What sync can read NEW §staticCss + Config ✓ | ours | |
| merging-styles | System/css() §Combine ✓ + Guides/Choose §Which style wins ✓ | ours | CORE-MERGE-01. |
| global-styles | System/Global CSS ✓ | ours | |
| keyframes | System/Animation ✓ | ours | |
| cascade-layers | System/Cascade layers ✓ | ours | |
| style-isolation | System/Cascade layers ✓ + Primitives §data-layer ✓ | ours | Different mechanism: one layer per system. |
| color-opacity-modifier | System/Tones and opacity ✓ | ours | Expand `/NN` (audit 2). |
| virtual-color | — | not ours | Tones are a different concept; no colour placeholder. |
| first-that-works | — | not ours | Arrays are responsive values (CORE-PRIM-04). |
| patterns | — | not ours | Layout = primitives + style props. |
| position-try | — | not ours | Ruled 2026-10-21: Overlay owns positioning; the CSS props stay style props. |
| view-transition | — | not ours | Ruled 2026-10-21. |
| optimization | — | not ours | No optimize flags in config. |
| source-transforms | — (Architecture track) | not ours | No user-facing switch; how runtime works is architecture. |

### recipes (11)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| overview | System/Recipes ✓ | ours | |
| atomic-recipe | System/Recipes ✓ | ours | One `recipe()`; no cva/config split. |
| config-recipe | System/Recipes ✓ | simpler | No config-registered recipes; `recipe()` is the only form. |
| compound-variants | System/Recipes §Compound ✓ | ours | |
| responsive-variants | System/Recipes §Responsive ✓ | ours | Container breakpoints. |
| dynamic-variants | System/Recipes §Values picked at runtime ✓ | ours | Every variant value is generated. |
| slot-recipes | System/Recipes §Slots (when it lands) + Guides/Multi-part ✓ | ours | `recipe({ slots })` in progress. |
| jsx-tracking | System/What sync can read NEW | ours | `jsxElements` + StyleTrace wrapper detection. |
| styled-factory | — | not ours | No `styled()`; primitives + recipe. |
| recipe-context | — | not ours | No style-context helper. |
| slot-recipe-context | — | not ours | lib `Slot` is regions, not style context. |

### theming (18)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| tokens | System/Tokens ✓ | ours | Add token `description` (audit 9). |
| token-categories | System/Tokens §Categories ✓ | ours | Add value shape per category (plan.md). |
| theme | Foundations ✓ | ours | What lib ships. |
| customize-theme | Guides/Theming ✓ + System/Base systems NEW | ours | |
| minimal-setup | Guides/Theming §Your base system ✓ | simpler | |
| presets | Guides/Share ✓ + System/Base systems NEW | ours | `extends`/`layers` of a base system. |
| multiple-themes | Guides/Customization §branded copy ✓ | simpler | Brands at build time via `extendSystem`; runtime switch is light/dark only. |
| conditions | System/Conditions ✓ | simpler | Built-in set; arbitrary selectors inline; no custom named conditions. |
| fonts | System/Fonts ✓ | ours | |
| animation-styles | System/Animation §Name an animation ✓ | simpler | Animation tokens, no style bundles. |
| typography | Guides/Style HTML you don't control NEW | simpler | `globalCss()` selectors; no prose recipe. |
| text-styles | — | not ours | `textStyle` removed. |
| layer-styles | — | not ours | |
| utilities | — | not ours | No custom utilities. |
| patterns | — | not ours | |
| plugins | — | not ours | |
| json-spec | — | not ours | |
| studio | — | not ours | |

### reference (35)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| config | System/Config ✓ | ours | |
| config-functions | System/Imports and packages NEW | ours | `defineConfig`, `tokens`, `font`, `keyframes`, `globalCss`, `recipe`, `extendSystem`. |
| cli | System/CLI ✓ | ours | |
| css | System/css() ✓ + Recipes ✓ | simpler | No `cx`, `sva`, `positionTry()`, `viewTransition()`. |
| jsx | System/Primitives ✓ | simpler | Primitives instead of styled factory and patterns. |
| styled-system | System/Sync §What sync writes ✓ + Imports and packages NEW | ours | Generated `@reference-ui/react`, `system`, `styled`, `types`. |
| types | System/Types ✓ | ours | |
| diagnostics | System/Diagnostics ✓ | ours | |
| debugging | Guides/Troubleshooting ✓ | ours | `ref sync --verbose/--json`, `logs`. |
| recipes | — (Recipes §Helpers ✓) | not ours | No generated per-recipe modules. |
| patterns | — | not ours | |
| tokens | — | not ours | No JS `token()`; `getRhythm()` lives in Spacing. |
| plugins | — | not ours | |
| deprecations | — | not ours | |
| background | SPR §Colour and background ✓ | ours | |
| border | SPR §Border and radius ✓ | ours | |
| outline | SPR §Border and radius ✓ | ours | |
| display | SPR §Layout and display ✓ | ours | |
| layout | SPR §Layout, §Position ✓ | ours | |
| flex-and-grid | SPR §Flex and grid ✓ | ours | |
| sizing | SPR §Sizing ✓ | ours | |
| spacing | SPR §Spacing ✓ + System/Spacing ✓ | ours | |
| typography | SPR §Typography ✓ | ours | |
| effects | SPR §Effects and shadows ✓ | ours | |
| transforms | SPR §Transforms ✓ | ours | |
| transitions | SPR §Transitions and animation ✓ | ours | |
| svg | SPR §SVG ✓ | ours | |
| interactivity | SPR (add Interactivity row) | ours | cursor, accentColor, caretColor, scroll props are plain CSS. |
| list | SPR (add Lists row) | ours | `listStyle*`. |
| tables | SPR (add Tables row) | ours | `borderSpacing`, `captionSide`. |
| gradients | SPR §Colour and background ✓ | simpler | `textGradient` extension only; `gradientFrom/To/Via` removed. |
| masks | SPR (plain `mask*` props) | simpler | No mask helpers. |
| focus-ring | — (Foundations/Element styles: `setupFocusVisible`) | not ours | No focus-ring props. |
| divide | — | not ours | No divide props; `&` selectors do it. |
| helpers | — | not ours | `srOnly`, `debug` removed. |

### design-systems (13)
| Panda page | Our page | Status | Note |
|---|---|---|---|
| overview | Guides/Share ✓ | ours | |
| build-a-design-system | Guides/Share ✓ | ours | `ref sync` writes `baseSystem.mjs`; no separate build command. |
| consume-with-panda | Guides/Share §extends or layers ✓ | ours | |
| publishing | Guides/Share ✓ | ours | `prepack: ref sync && build`. |
| monorepo-workflow | Guides/Share §In a monorepo ✓ | ours | |
| troubleshooting | Guides/Troubleshooting ✓ | ours | `ATM-W-EXTERNAL-UNBACKED`. |
| wrap-headless-libraries | Guides/Multi-part components ✓ | ours | `data-slot` + `globalCss()`; slots when they land. |
| consume-without-panda | — | not ours | The app always syncs (Q11). |
| storybook | — | not ours | |
| linting | — | not ours | |
| deprecations | — | not ours | |
| isolated-declarations | — | not ours | |
| analyze | — | not ours | |

### Blog (8, for anything not in docs)
| Post | Our home | Note |
|---|---|---|
| introducing-panda-css | System/Introduction ✓ | |
| panda-css-v2 | spread | Publishable systems → Share; typed config helpers → Imports; MCP → MCP; view transitions, ordered fallbacks, ESLint, `@property` → not ours; engine speed → Architecture. |
| zero-runtime-all-the-way-down | Architecture track | Its "keep styles static" advice → What sync can read. |
| building-a-multi-brand-design-system | Guides/Customization §branded copy ✓ | simpler: build-time brands. |
| styling-ark-ui-with-panda-css | Guides/Multi-part §headless ✓ | |
| styling-base-ui-with-panda-css | Guides/Multi-part §headless ✓ | |
| typography-preset | Guides/Style HTML you don't control NEW | |
| see-your-design-system | — | not ours (studio, usage analysis). |

## 4. Reference-only topics

| Topic | Home | Source |
|---|---|---|
| Tones (named, theme-owned transparency) | System/Tones and opacity ✓; lib's set in Foundations/Color ✓ | `reference-lib/src/core/theme/tones.ts` |
| Rhythm `r` unit, spacing root, `getRhythm()` | System/Spacing ✓ | `reference-core/src/system-surface.d.ts` |
| Container-first responsive, named containers `'name/md'` | System/Responsive ✓ (expand named containers, audit 8) | `reference-core/tests/cases/resp/` |
| Primitives (one typed component per HTML element) | System/Primitives ✓ | `reference-core/src/primitives/generate/generate.ts` |
| Reference props `r`, `size`, `weight`, `colorMode`, `variant` | System/Style props §Reference props ✓, Primitives ✓ | `canon/src/dialect.rs` `REFERENCE_PROPS` |
| Per-subtree colour mode (`colorMode` prop) | System/Light and dark ✓ | primitives generate |
| `data-layer` scoping, one cascade layer per system | System/Primitives ✓, Cascade layers ✓, Base systems NEW | `reference-core/src/system/` |
| `extends` vs `layers` composition | Guides/Share ✓, System/Base systems NEW | `matrix/tests/chain/*` |
| `extendSystem()` branded copies | System/Base systems NEW, Guides/Customization ✓ | `reference-core/src/system/base/extend.ts` |
| StyleTrace: style props traced through your own wrappers and package components | System/What sync can read NEW §Your components; Troubleshooting ✓ | `reference-rs/modules/styletrace/README.md` |
| `strict` token-only categories | System/Config ✓, Tokens §Restrict ✓ | `reference-core/src/config/types.ts` |
| `normalizeCss` reset | System/Global CSS §The reset ✓ | config types |
| Diagnostic codes (ATM-*) | System/Diagnostics ✓ | `reference-rs/modules/atomic/src/diagnostics/codes.rs` |
| Lib element styles (forms, tables, prose, focus-visible) | Foundations/Element styles NEW | `reference-lib/src/core/theme/primitives/` |
| Lib sizing exports | Foundations/Sizes NEW | `reference-lib/src/core/theme/primitives/index.ts` |
| Reference API browser component | Components/Reference ✓ | `reference-lib/src/components/Reference/` |
| Icons (Material Symbols) | Components/Icons ✓; `useReferenceIcons` in MCP/Configuration ✓ | `packages/reference-icons` |
| Slot (named regions for compound components) | Components/Slot ✓ | `reference-lib/src/components/Slot/` |
| MCP server | MCP section ✓ | `packages/reference-mcp` |
| `recipe({ slots })` (in progress) | System/Recipes §Slots, Guides/Multi-part ✓ | lands with the feature |

## 5. New pages to write

| P | Page | Scope | Start from |
|---|---|---|---|
| P1 | System/Imports and packages | Each package (`@reference-ui/react`, `system`, `core`, `lib`, `icons`, generated `styled`, `types`), what it exports, which call comes from where. Needs D1/D2 first. | `reference-core/src/index.ts`, `src/system-surface.d.ts`, `src/packager/`, `src/entry/` |
| P1 | System/Base systems | `baseSystem`, `extendSystem()` signature, chained calls, its error cases, what travels through `extends`/`layers` (recipes don't, CORE-SYNC-10). | `reference-core/src/system/base/extend.ts`, `types.ts` |
| P1 | System/What sync can read | Static vs runtime values, which `css()`/`recipe()` bindings are read, `staticCss`, `jsxElements`, wrapper tracing; "keep styles static". | `reference-rs/modules/atomic/src/extract/bindings.rs`, `modules/styletrace/README.md`, `tests/cases/static/` |
| P1 | Get started/Vite (✂) | Setup, watch, build, stylesheet import. | `guides/bundlers.mdx`, `pipeline/src/testing/matrix/managed/bundlers/vite7/` |
| P2 | Get started/webpack (✂) | Same for webpack 5 (blocked on Q7). | `guides/bundlers.mdx`, `managed/bundlers/webpack5/` |
| P2 | Get started/FAQ | Browser support and `@layer`, React versions, gitignore `.reference-ui/`, React-only. | plan.md rulings; `managed/react/` |
| P2 | Guides/Style HTML you don't control | Prose from Markdown/CMS with `globalCss()` selectors and tokens (plan G5). | `reference-core/tests/cases/global/` |
| P2 | Foundations/Element styles | Lib's look for native elements: forms, tables, document, media, typography, focus-visible, selection. | `reference-lib/src/core/theme/primitives/` |
| P3 | Foundations/Sizes | `controlHeight`, `controlSize`, `iconSizes`, `defaultIconSize`. | `reference-lib/src/core/theme/primitives/index.ts` |

Edits to existing pages (from the authoring-surface audit; not new pages):

| Page | Edit |
|---|---|
| system/types | Import table adds `@reference-ui/system`; add `TokenConfig`, `GlobalCssRule`, `FontWeightName`. |
| system/tones | Retitle "Tones and opacity"; full `/NN` rules (`/NN%`, decimals). |
| system/style-props | `!` and trailing `!` important; `!` inside responsive objects is stripped at runtime. |
| system/conditions | `&` selectors get a proper section (today one sentence per page). |
| system/tokens | Leading `-` negates any category, not only spacing; token `description`; value shapes. |
| system/responsive | Named containers `'name/md'` beyond two sentences. |
| system/primitives | `variant` prop beyond one row (typed `unknown`, D3). |
| system/config | Move `jsxElements` out of "Output" (to "Sources" beside `include`). |
| system/style-prop-reference | Add Interactivity, Lists, Tables rows. |
| system/recipes | Slots section when `recipe({ slots })` lands. |
| plan.md items | `css.mdx` bindings, `share.mdx` recipes don't travel, `sync.mdx` `.reference-ui/` contents, `system.mdx` Atlas TODO. |

## 6. Architecture track (owner-owned, list only)

- How sync works end to end: collect → compile (atomic) → package → link.
- Module graph / Atlas: how sync finds your files and components.
- StyleTrace internals: wrapper analysis, host detection, ownership by provenance.
- Typegen and Tasty: how the `.d.ts` surface is produced.
- Canon: the CSS dialect, aliases, extensions, webref truth.
- The runtime: what ships to the browser, class resolution, "zero runtime" claims.
- Cascade layer generation and composition across systems.
- Watch mode and incremental sync; performance and bundle size (`pnpm bench:core`).
- MCP's data sources (what sync writes that the server reads).
- Rust / N-API boundary.

## 7. Open questions for the owner

1. **Sub-categories**: add a `group` frontmatter field and sidebar support in `collections/docs.ts` + `app/DocSidebar.tsx`?
2. **Frozen pages moving**: may `getting-started/initialize` change only its `section` to "Get started", and existing-app/SSR move there from Guides?
3. **D1 import entry points**: fragment calls are documented from `@reference-ui/system`, `extendSystem` exists only on core, `getRhythm` only on system. One home, or document the split as is?
4. **D2 fragment typing**: emitted `system.d.mts` types `tokens`/`font`/`keyframes`/`globalCss` as `Record<string, unknown>`, while docs show `FontOptions` etc. Type them before documenting?
5. **D3 primitive props**: `colorMode` and `variant` are typed `unknown` (`primitives/generate/generate.ts:199`); docs say `'light' | 'dark'`. Narrow the types?
6. **Context exports**: `ColorModeContext`, `DocumentContext`, `LayerScopeContext` ship from the generated primitives. Public (document) or internal (stop exporting)?
7. **webpack**: no kept suite runs `webpack5` since `db0e03664`. Restore one, or drop the webpack page?
8. **SSR hosts**: test one React host (Next.js or React Router) so the SSR guide can name it, or keep it host-agnostic?
9. **Browser support floor** for the FAQ.
10. **Migration guides** (Tailwind, Emotion, styled-components...): none until you want them?
11. **Consuming without sync**: can an app use a published system without running `ref sync`? Today the app always syncs.
12. **Recipe slots**: confirm `recipe({ slots })` lands before the Recipes and Multi-part pages document it.
