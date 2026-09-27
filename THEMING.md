# Theming Reference UI

How to theme components: five approaches, from zero-CSS to no-compromises.
Each section is written as user documentation with copy-pasteable examples.
Status tags say what works today vs what's landing: **WORKS TODAY** means
verified on this tree; **IN FLIGHT** means crews are proving it now;
**PLANNED** means decided, not yet built.

## The model in one picture

```
Tokens (values)          — change colors/radii/spacing, touch no CSS
  └─ Variants (choices)  — pick line/pill, restyle one, author your own
       └─ Hooks (addresses) — stable per-part selectors for full control
            └─ css()/recipe() (authors) — the style system that targets them
```

Precedence is one line: **explicit overrides on stable hooks always win over
tokens.** House styles are written at zero specificity (`:where()`), so
anything you write beats them without `!important`.

---

## Approach 1 — Tokens: restyle without touching CSS

**WORKS TODAY.** Every component is built out of theme tokens exposed as CSS
variables. Change the values and all components follow. Nothing to target,
nothing to break, upgrades are safe by construction.

```css
/* your app stylesheet (or theme object — same variables underneath) */
:root {
  --colors-ui-button-background: #4f46e5;
  --colors-ui-field-border: #d4d4d8;
  --radii-md: 10px;
  --fonts-sans: "Inter", system-ui, sans-serif;
}
```

```tsx
// zero component changes — Tabs, Menu, NumberField all follow the tokens
<Tabs value={tab} onChange={setTab}>…</Tabs>
```

Token families today: `--colors-*`, `--radii-*`, `--fonts-*`,
`--spacing-root`. Components also read scoped variables with fallbacks
(e.g. `var(--colors-ui-focus-ring, …)`), so overriding the global token
retunes every consumer at once. Dark mode is token scoping, not component
logic — swap the variable values under a selector and the library follows.

Rules of thumb:

- Restyle a *value* (a color, a radius, a font)? Token. Never a selector.
- Tokens you don't set keep their defaults — override one variable or a
  hundred, the rest stands.

---

## Approach 2 — The `variant` prop: prepackaged choices

**WORKS TODAY** (prepackaged + override). **IN FLIGHT** (author-your-own —
Tabs crew proving it now).

Complex components ship prepackaged variants — headless-only would strand AI
and beginners. `variant` is a system-level prop: it reflects to
`data-variant` on the DOM, and house styles hang off it at zero specificity.

```tsx
<Tabs variant="pill" value={tab} onChange={setTab}>…</Tabs>
{/* renders … data-variant="pill", styled by the house sheet */}
```

### Restyling a built-in variant

Because house rules use `:where()`, your selector wins by writing it:

```css
/* beat the house pill style — no !important, no specificity war */
[data-reference-tabs-list][data-variant="pill"] {
  background: var(--colors-ui-surface);
  border-radius: var(--radii-lg);
}
```

or through the style system (see Approach 4):

```tsx
<Div css={{
  '[data-reference-tabs-list][data-variant="pill"]': {
    background: '$ui.surface',
  },
}} />
```

### Authoring your own variant

Variants are open-ended: any string is accepted, and unknown names resolve
to base + axis styles with no built-in paint — your styles supply the rest.
The authoring pattern (being proved on Tabs now):

```tsx
// MyTabs: your own typed variant on the shared kernel
import { Tabs, TabsList, Tab, TabPanel } from '@reference-ui/lib'

type MyTabsVariant = 'line' | 'pill' | 'sidebar' // yours to extend

function MyTabs({ variant = 'sidebar', ...props }) {
  return <Tabs variant={variant as string} {...props} />
}
```

```tsx
// …with a recipe for your variant (normal css()/recipe() authoring)
import { recipe } from '@reference-ui/react'

const myTabs = recipe({
  className: 'my-tabs',
  variants: { variant: { sidebar: { /* your paint */ } } },
})
```

Unknown variant names never break: the kernel renders, the hooks stay
stable, and only your styles paint. This is the system-level extensibility
story — `variant` is not a closed enum, it's an axis you extend.

---

## Approach 3 — Stable hooks: full customisation, no compromises

**WORKS TODAY** (data-attribute hooks). **PLANNED** (per-component classes).

When tokens can't express what you want, every component exposes a stable
set of styling hooks: one `data-reference-*` attribute per part, plus state
attributes. These are the theming addresses — documented, selectable from
plain CSS, `css()`, and `recipe()`, and pinned against drift.

```css
/* parts: data-reference-<component>[-<part>] */
[data-reference-slider-track] { height: 6px; }
[data-reference-slider-thumb] { width: 20px; height: 20px; }

/* state composes as attributes — no modifier-class invention */
[data-reference-tabs-tab][data-state="active"] { font-weight: 600; }
[data-reference-switch][data-state="checked"] { background: indigo; }
[data-reference-menu-content][data-side="bottom"] { margin-top: 4px; }
```

The vocabulary, per component (full inventory verified 2026-09-27):

- **Parts** — `data-reference-tabs-list`, `data-reference-slider-thumb`,
  `data-reference-splitter-handle`, `data-reference-toast-close`,
  `data-reference-tree`, … one per part, kebab-cased.
- **State** — `data-state` (open/closed, active/inactive, checked/unchecked,
  selected/unselected), `data-disabled`, `data-selected`, `data-orientation`,
  `data-side`, `data-value`, `data-level`, `data-expanded`, `data-dragging`,
  … set by the kernel, always current.
- **Variant** — `data-variant` (see Approach 2).
- **Opt-outs** — `data-reference-overlay-ignore`, `data-reference-announcer-*`.

Element-level `.ref-*` classes (`.ref-button`, `.ref-div`, …) are also stable
but shared across every component using that element — scope them with a
`data-reference-*` hook when you mean one component, not all of them.

### The `ref-*` class plan

The long-term direction is per-component classes — `.ref-tabs-trigger`,
`.ref-slider-thumb` — as the primary hook vocabulary, with data attributes
kept for state. `ref-` plus the component name is a collision-proof
namespace, and classes are grep-able in every tool. This is a naming add on
top of the proven mechanism, not a mechanism change: everything below works
identically against either vocabulary.

```css
/* the planned shape (not yet minted — target data-reference-* today) */
.ref-tabs-trigger[data-state="active"] { font-weight: 600; }
```

---

## Approach 4 — `css()` / `recipe()` and style props: theme through the system

**WORKS TODAY** (verified end-to-end 2026-09-27, including `&[data-*]`
nested selectors, determinism across runs, and byte-identical output across
processes).

Every shipped interactive kernel forwards style props (`PrimitiveProps` +
`...props` spread), so `css`, `bg`, `_hover`, and friends ride straight onto
the underlying primitive. `className` is pure passthrough everywhere.

```tsx
// style props straight through the kernel onto the primitive
<TabsList bg="$ui.surface" borderRadius="lg" />

// the css prop with a nested hook selector — the power pattern
<Div css={{
  outlineColor: '#c0ffee',
  '&[data-reference-switch][data-state="checked"]': {
    outlineWidth: '3px',
    outlineColor: '#c0ffee',
  },
}} />

// static css() and recipe() — collected at build, deterministic output
import { css, recipe } from '@reference-ui/react'

const loud = css({ color: '#c0ffee' })
const chip = recipe({
  className: 'chip',
  variants: { tone: { soft: { opacity: 0.8 } } },
})
```

One law to know — **the collection law**: the build harvests inline JSX
style literals and top-level consts spread by identifier. Style objects
produced by function calls are NOT collected. Theme authors write static
literals/consts (or `staticCss`) and the output is deterministic per tree
state — same tree, byte-identical CSS, every run.

Mechanism notes: kernels contain zero `css()`/`recipe()` calls and zero
generated-class literals — `ref sync` collects every call site into the
generated stylesheet. House variant rules live in the recipes layer or
below; your utilities compile into layers above, so overrides win by layer
order as well as specificity.

---

## Approach 5 — `className` passthrough and per-part maps

**WORKS TODAY.** `className` passes through untouched on every kernel, so
external stylesheets, Tailwind, or CSS modules all work with no integration:

```tsx
<TabsList className="my-tabs-list" />
```

```css
.my-tabs-list { gap: 4px; }
.my-tabs-list [data-state="active"] { color: indigo; }
```

Toast goes one further with a per-part classNames map (the pattern other
components may clone later):

```tsx
// ToastClassNames: toast/title/description/icon/loader/closeButton/…
<Toaster toastOptions={{ classNames: { toast: 'my-toast' } }} />
```

---

## Precedence, stated once

1. Your overrides on stable hooks (`css()`, `recipe()`, `className`, plain
   CSS) — always win.
2. House variant styles (`:where([data-variant])`, zero specificity).
3. Token values (the defaults everything is built from).

If a token change "doesn't work", an override is shadowing it — that's the
model working, not breaking. Debuggability: hooks are in the DOM, variables
are in devtools, generated classes are pure functions of (prop, value,
conditions) with no hashes of unseen state.

---

## Status appendix

| Approach | Status | Evidence |
|---|---|---|
| Tokens | WORKS TODAY | `--colors/radii/fonts/spacing` live; kernels read with fallbacks |
| Prepackaged variants | WORKS TODAY | `variant` → `data-variant`, `:where()` house styles |
| Custom variants (MyTabs) | IN FLIGHT | Tabs system-variant crew proving it now |
| Data-attribute hooks | WORKS TODAY | full per-component inventory verified 2026-09-27 |
| `ref-*` part classes | PLANNED | naming add over the proven mechanism |
| `css()`/`recipe()` override | WORKS TODAY | throwaway probes proven, tree restored byte-identical |
| Deterministic output | WORKS TODAY | 3× `ref sync`, identical hashes; byte-identical across processes |
| `className` passthrough | WORKS TODAY | universal; Toast map is the per-part pattern |

Known edges: Announcer renders raw divs with no prop forwarding (SR-only,
target via external CSS); the build scans the whole tree, so sibling edits
can shift unrelated output (deterministic per tree state, churn by design);
function-call-produced styles are not collected (the collection law).
