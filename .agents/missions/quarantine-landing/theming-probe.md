# Theming Probe Log

Status: COMPLETE
Lead: theming probe (read-only; reference-system branch; no commits; no component source touched)
HQ hypothesis: each lib component exposes its own STABLE set of classNames; raw theming mechanisms (target + override via the style system) should still work.
Verdict: hypothesis is HALF-TRUE — the stable hook set is `data-*` attributes (+ element-level `.ref-*` classes), NOT per-component classNames. Target + override via the style system WORKS (proven). No component exposes its own classNames except via consumer passthrough.

Architecture (one paragraph): kernels render `@reference-ui/react` primitives (`Div`, `Button`, `Span`, …) with style props; they contain ZERO `css()`/`recipe()` calls and ZERO `reference-ui__*` literals. `ref sync` (Neo/styletrace/atomic) statically collects style call sites across the whole tree into gitignored `.reference-ui/react/{react.mjs,styles.css}`. Consumers theme by (a) style props / `css` prop passed straight through kernel `...props` spreads, (b) `css()`/`recipe()` + `className` passthrough, or (c) plain CSS targeting `data-*` hooks / `.ref-*` classes / theme vars.

## Inventory (per-component styling hooks)

Key: SRC = stable hook rendered by the kernel (pin-worthy). PASS = consumer-supplied passthrough only. GEN = generated `reference-ui__*` (compiled output only, never in source).

| Component (shipped?) | Semantic classNames | data-* attrs (SRC) | CSS vars | part names | GEN in src? | className / style-prop forwarding |
|---|---|---|---|---|---|---|
| Accordion ✅ | none | `data-reference-accordion` (Accordion.tsx:392), `data-state` open/closed, `data-disabled` | none | none | no | `...props` spread (PASS); PrimitiveProps |
| Announcer ✅ | none | `data-reference-announcer-host`, `data-reference-overlay-ignore` (:272-273), `data-reference-announcer` polite/assertive (:280/:288) | none | none | no | NONE — raw divs + inline HOST_STYLE; target via CSS only |
| Button ❌ (story fixtures only, no .tsx impl, not exported) | — | — | — | — | — | — |
| Calendar ✅ | none | `data-reference-calendar` (:1257), `-header` (:272), `-heading` (:307), `-grid` (:774), `data-date`, `data-selected`, `data-disabled`, `data-focused`, `data-in-range`, `data-outside-month`, `data-today` (:846+) | none | none | no | `className={className}` passthrough (:277, :1260…) |
| Collapsible ✅ | none | `data-reference-disclosure-icon` (:188), `data-state` open/closed (:220/:382), `data-disabled`, `data-content-present`, `data-reference-accordion-item` (item reuse) | none | none | no | `...props` spread; PrimitiveProps |
| Combobox ✅ | none (root renders no DOM, provider + Overlay) | `data-reference-combobox-popover` (:780), `data-reference-field`, `data-selected`/`data-active` (:933-934), `data-disabled`, `data-only` | none | none | no | passthrough on sub-parts |
| DateField ✅ | none | `data-reference-date-input` (:267), `-trigger` (:339), `-picker` (:387), `data-reference-field` (:633), `data-invalid` (:266/:605) | none | none | no | passthrough |
| Field ✅ | none | `data-reference-field` (Field.tsx:40), `data-status` warning (:41); pinned AFTER spread, cannot be overridden | none | none | no | `{...restProps}` (:38) incl. className/css/style-props |
| FocusLock ✅ headless | none | none | none | none | no | behavioral only |
| Icon ❌ (book only, not exported) | — | — | — | — | — | — |
| Listbox ✅ | none | `data-reference-listbox` (:1152), `-empty`, `-header` (:1207/:1236), `-section` (:1195), `data-state` selected/unselected (:443), `data-selected`, `data-active`, `data-disabled`, `data-value`, `data-orientation`, `data-slot="check"` (:527)/`"description"` | none | `data-slot` check/description (internal) | no | passthrough (:505, :1168, :1200…) |
| Measure ❌ (story only, not exported) | — | — | — | — | — | — |
| Menu ✅ | none | `data-reference-menu-content` (:490/:1027), `data-state` selected (:1132), `data-disabled`, `data-side` | none | none | no | passthrough (:501, :895, :1038…) |
| NumberField ✅ | none | `data-reference-number-field` + `data-reference-field` (:907-908), `data-disabled` (:909), `data-pressed` (:523/:575/:641/:693) | none | none | no | passthrough |
| Overlay ✅ (Content/Trigger/Backdrop/Arrow/Handle) | none | `data-reference-overlay-content` + `data-state` open/closed (Content.tsx:154-155), `-trigger` (Trigger), `-backdrop` + state (Backdrop.tsx:39-40), `-arrow` (Arrow.tsx:26), `-handle` + `data-dragging` (Handle.tsx:84); `data-reference-overlay-ignore` (opt-out); root Overlay.tsx renders no DOM | none | none | no | PrimitiveProps + spread (e.g. Content `...props`); `OverlayContentProps = PrimitiveProps<'div'> & Geometry` |
| Popover ✅ | none | `data-reference-popover-arrow` (Popover.tsx:626) + inherited Overlay hooks | none | none | no | spread (4 sites); PrimitiveProps |
| Portal ✅ headless | none (`data-reference-portal-container` appears in fixtures only) | none | none | none | no | behavioral only |
| Presence ✅ headless | none | none | none | none | none | no | behavioral only |
| Primitives ❌ (story only) | — | — | — | — | — | — |
| Reference ✅ (browser UI) | none | (internal) | none | none | no | contains the SOLE `recipe()` call site in lib: `summaryChip` (components/shared/SummaryChip.tsx:5) → emits `reference-ui__summaryChip__base`, `..._v_tone_soft` etc. |
| ReferenceLibrary ✅ | none | (internal) | none | none | no | — |
| RovingFocus ✅ headless | none | none | none | none | no | behavioral only |
| Showcase ❌ (story only) | — | — | — | — | — | — |
| Slot ✅ headless (.ts registry) | none | none | none | none | no | renders no DOM |
| Slider ✅ | none | `data-reference-slider` (:1136), `-track` (:181), `-range` (:247), `-thumb` (:449), `data-orientation`, `data-disabled`, `data-dragging`, `data-active`, `data-focus-visible` | none | none | no | passthrough |
| Splitter ✅ | none | `data-reference-splitter` (:1397), `-panel` (:243), `-handle` + `-handle-line` (:530), `-thumb` + `-thumb-dot` (:301/:335), `data-state` active/hover/idle (:303), `data-orientation`, `data-disabled`, `data-resizing` (:1399), `data-collapsed`, `data-hover` | none | none | no | passthrough |
| Switch ✅ | none | `data-reference-switch` + `data-state` checked/unchecked + `data-disabled` (Switch.tsx:156-158); thumb `data-reference-switch-thumb` (:70-72) | none | none | no | `className={className}` (:73/:160) + full PrimitiveProps spread incl. `css` |
| Tabs ✅ | none | `data-reference-tabs-list` + `data-orientation` (Tabs.tsx:547-549), `data-state` active/inactive (:663/:791), `data-value` (:666/:792), `data-disabled`, `data-variant` | reads `var(--colors-ui-table-border)` (:566-567) | none | `className={className}` (:564/:726/:796) + `...props` (:570/:728/:798); `TabsListProps = PrimitiveProps<'div'>` |
| Toast ✅ | none (consumer strings via `ToastClassNames`: toast/title/description/icon/loader/closeButton/actionButton/cancelButton — toastContext.ts:21-30; merged at ToastChrome.tsx:49) | `data-reference-toast-root` (+`data-unstyled`, ToastChrome.tsx:28-29), `-title`, `-description`, `-action`, `-cancel`, `-close`, `-icon`, `-loader`, `-type-icon`, `-host`, `-position`, `-bridge`, `-id`, `-generation`, + `data-state/expanded/front/paused/swiping/swipe-out/exiting/dismissible/invert/theme/rich-colors/type/mobile/reduced-motion/react-aria-top-layer` (ToastSystem.tsx) | SETS `--reference-toast-{index,count,offset,scale,swipe-x,swipe-y,enter,origin}` (:631-639), reads `var(--reference-toast-focus, …)` (:629) | classNames map (only one in lib) | no | passthrough + context merge |
| Tooltip ✅ | none | `data-reference-tooltip-trigger`, `data-reference-tooltip-arrow` (Tooltip.tsx:443) + Overlay hooks | none | none | no | spread; PrimitiveProps |
| Tree ✅ | none | `data-reference-tree`, `data-state` selected/unselected (:303), `data-selected`, `data-disabled`, `data-level` (:307), `data-active`, `data-expanded`, `data-text-value`, `data-slot="row"` (:330) | reads `var(--colors-ui-focus-ring, …)` (:321) | `data-slot` row (internal) | no | passthrough (:325, :403, :459) |
| disclosureChrome.ts (shared const, NOT per-component) | none | targets `&[data-state="open"]` (:49), `&[data-content-present]` (:57) via `css` prop object | reads `var(--ui-button-muted-background, …)` | none | no | top-level const spread by identifier = harvested (collection-law precedent) |
| Global (all components) | `.ref-<element>` ×83 (element-level, e.g. `.ref-div` `.ref-button` `.ref-input`, auto-applied by primitives; see styles.css global layer) — STABLE but not component-scoped | — | `--colors-*`, `--radii-*`, `--fonts-*`, `--spacing-root` | — | `reference-ui__*` atoms/recipes in compiled CSS ONLY (content-hashed names, no source literals) | — |

Headline negatives (verified by grep over shipped sources, tests/stories/books/e2e excluded): zero `css()` calls, ONE `recipe()` call (SummaryChip), zero `cva()`/`cx()`, zero `data-part`/`part=`/`slot=` props, zero `reference-ui__*` literals, zero semantic string-literal classNames in any kernel.

## Stability

VERDICT: deterministic ✅ (with one scoping caveat).

1. Empirical (this session, 2026-09-27): `ref sync` run 3× on untouched tree → `styles.css` md5 `3d9922042f555edfc9a1f0b94c4a24e6` all three runs; `react.mjs` `6fd24ed890dde1a366996b38d7490326` all runs. After probe-insertion sync + probe deletion + re-sync, hashes returned to the identical values and probe markers were gone (0 matches). ~3.4s/sync.
2. Code path: scan inputs byte-sorted (`packages/reference-neo/src/collect/lib/scan/helpers.ts:64`); native request names sorted (`src/native/request.ts:11`); bundle sorted (`src/config/bundle.ts:33`); Rust sources sorted (`packages/reference-rs/modules/atomic/src/sources.rs:53` + `:191` by file name); tables sorted (`atomic/src/runtime/tables/mod.rs:147`); emitters use `BTreeMap`/`BTreeSet` (`reference-rs/modules/typegen/src/emit/*.rs`); no `Math.random`/`Date.now` in the emit path (grep).
3. Naming: atom classNames are pure functions of (prop, value, conditions) — `reference-ui__<prefix>_<sanitized>`; recipe classes are pure functions of (className, variant, value) — `<stem>__base`, `<stem>_<axis>_<value>`, `<stem>_c_…`. No counters, no hashes of unseen state. Runtime `css()`/`recipe()` in `react.mjs` reproduced compiled selectors byte-identical across two node processes (see Override).
4. Caveat: output is deterministic PER TREE STATE, but the collector scans the WHOLE tree — sibling edits shift unrelated output (documented flip-flop under concurrent load in `docs/bugs/TABS_RECIPE_COLLECTION.md`, now CLOSED/fixed for the true Panel gap; the cross-state churn property remains by design). Daemon-served CSS can also lag file CSS under churn (timing, not nondeterminism).

## Override

VERDICT: works today ✅ — proven with throwaway probes (created untracked, verified, deleted; tree restored byte-identical, `git status` clean of probe).

Probe: `packages/reference-lib/src/theme-probe-fixture/probe-fixture.tsx` (DELETED after) + `node /tmp/theme-runtime-probe.mjs` (DELETED after). Marker `#c0ffee`.

1. Shape A — consumer `css` prop with nested hook selector (inline JSX literal):
   `<Div css={{ outlineColor: '#c0ffee', '&[data-reference-switch][data-state="checked"]': { outlineWidth: '3px', outlineColor: '#c0ffee' } }} />`
   → collected: `.reference-ui__outline-c_\#c0ffee` AND `.reference-ui__\[\&\[data-reference-switch\]\[data-state\=\"checked\"\]\]\:outline-c_\#c0ffee[data-reference-switch][data-state="checked"] { outline-color: #c0ffee; }`. A consumer can target a real kernel hook and override through the style system — the exact HQ mechanism.
2. Shape B — static top-level `css({ color: '#c0ffee' })` → collected as `.reference-ui__c_\#c0ffee`.
3. Shape C — static `recipe({ className: 'probeThemeRecipe', … })` → collected as `.reference-ui__probeThemeRecipe__base` + `.reference-ui__probeThemeRecipe_t_loud`.
4. Runtime check: `css()` → `reference-ui__c_#c0ffee`, `recipe()(…)` → `reference-ui__probeThemeRecipe__base reference-ui__probeThemeRecipe_t_loud`, byte-identical across two separate node processes and matching the compiled selectors.
5. Pre-existing production evidence (no probe needed): styles.css already ships `.ref-button[data-reference-switch][data-state="checked"]`, `[data-reference-switch-thumb][data-state="checked"]`, and disclosureChrome's `&[data-state="open"]` utilities — kernels + shared consts already theme through these hooks.
6. Mechanism notes: every shipped interactive kernel forwards style props (`PrimitiveProps` + `...props`/rest spread placed before managed attrs), so `css`/`bg`/`_hover`/etc. ride straight onto the primitive; `className` is pure passthrough everywhere (Toast additionally merges `ToastClassNames` context). Collection law applies: inline JSX literals + top-level consts spread by identifier are harvested; function-call-produced styles are NOT (per `docs/bugs/TABS_RECIPE_COLLECTION.md`).

## Gap list for HQ vision

HQ's vision as understood: each component exposes its own STABLE set of classNames; consumers target + override via css()/recipe().

1. [VISION GAP — naming] No component exposes its own classNames. The stable per-component identity is `data-reference-*` attributes, and the stable classes are element-level `.ref-*` (shared across all components using that element). If the vision literally needs `tabs-list`-style classes, that is a NAMING ADD, not a mechanism fix. Recommendation: bless `data-reference-*` as the stable hook vocabulary (it already is stable, deterministic, and selectable from css()/recipe()/plain CSS) OR mint per-component classes — a product decision, recorded here not implemented.
2. [OK] Override mechanism: no gap — target + override via css()/recipe()/css-prop works (proven above), including `&[data-*]` nested selectors.
3. [OK] Determinism: no gap per tree state (proven above); whole-tree scan churn is by design, not a bug.
4. [SMALL GAP — documentation] The stable hook set is nowhere documented as a contract: no per-component "styling hooks" doc, no guarantee that `data-reference-*` names are semver-pinned, no theme-authoring guide showing the `css={{ '&[data-*]': … }}` pattern. A consumer must read kernel source today.
5. [SMALL GAP — Announcer] renders raw divs with no prop forwarding; only targetable via external CSS. Intentional (SR-only) but inconsistent with every other kernel.
6. [SMALL GAP — parts API] Only Toast offers per-part classNames (`ToastClassNames`); Listbox/Tree `data-slot` values are internal conventions. If HQ wants uniform part overrides, Toast's map is the pattern to clone — but that is new API, not probe work.
7. [NON-GAP noted] Button/Icon/Measure/Primitives/Showcase have no shipped implementation (fixtures only, not exported from lib index) — nothing to theme; no action.
8. [WATCH] Collection law restricts dynamic styles: function-call-produced style objects are not harvested. Theme authors must use static literals/consts or `staticCss`. Worth one line in the theme guide (gap 4).
