# DATA_THEME.md — Scrub `data-panda-theme` from the public color-mode contract

Research note only. No implementation in this file. The goal is a production-grade rename of the physical light/dark DOM attribute from Panda’s `data-panda-theme` to Reference UI’s `data-theme`, without a dual-attribute forever-period and without leaking the compiler into consumer-facing code, docs, tests, or shipped CSS.

---

## 1. Why this is a polish problem

Consumers of Reference UI should never have to know Panda exists. Light/dark is a product concept:

```
<Div colorMode="dark">…</Div>
```

Today the physical reflection of that prop is `data-panda-theme="dark"`. That string shows up in primitives, Book, Playwright hosts, portal tests, overlay specs, matrix fixtures, and architecture docs. It is implementation vocabulary sitting on the public DOM contract.

Panda is a compiler. `data-layer` is ours. `data-variant` is ours. Color mode should be ours too.

The public JSX API (`colorMode`) is already correct. The leak is the **DOM attribute name** and every place that hardcodes it instead of going through one constant.

---

## 2. Target contract

After the scrub:

| Surface | Name | Notes |
| :--- | :--- | :--- |
| JSX | `colorMode="light" \| "dark"` | Unchanged. Preferred consumer API. |
| Physical DOM | `data-theme="light" \| "dark"` | The only color-mode attribute we emit or read. |
| CSS | `[data-theme=light]`, `[data-theme=dark]` | Including the portable-layer rewrite `:not([data-theme])`. |
| Document fallback | `data-theme` on `<html>` then `<body>` | Same read order as today, new attribute. |
| Panda | `data-panda-theme` | Allowed **only** as an input dialect inside the CSS postprocess translator. Never in shipped CSS, DOM, tests, or docs. |

Apps should not need to stamp anything. A root primitive with `colorMode` is enough. The document attribute is the escape hatch for non-React hosts, iframes, and tests that set theme without a primitive root.

`data-color-mode` stays dead. It was already retired as an alias. Do not revive it.

---

## 3. What Panda actually does (this is the constraint)

We use Panda `config.themes` via `extendThemes()` / `resolveColorModeTokens()`. Token leaves with `light` / `dark` slots become Panda theme variants named `light` and `dark`, enabled in `staticCss.themes`.

Current `main` depends on Panda **1.11.1**. We are also migrating the compiler to Panda **v2** on branch `panda-v2` (not `panda_v2_quarantine`). The v2 compiler source we track is `vendor/panda`. Neither tree adds a knob for this.

Panda 1.11.1 and the v2 types in `vendor/panda/packages/types/src/config.ts` both define:

```ts
export interface ThemeVariant extends Pick<Theme, 'tokens' | 'semanticTokens'> {}
```

There is **no `selector` field**. The attribute is not configurable.

In v1 `@pandacss/core`:

```js
getThemeSelector = (name) => {
  return `[data-panda-theme=${name}]`
}
```

`setupThemes()` always compiles each theme name into a condition `_themeLight` / `_themeDark` whose selector is that function plus ` &`. Token CSS therefore emits:

```css
[data-panda-theme=dark] { --colors-…: … }
[data-panda-theme=light] { --colors-…: … }
```

Panda’s runtime helper `injectTheme(el, theme)` also does `el.dataset.pandaTheme = theme.name`. We do not call `getTheme` / `injectTheme` anywhere. Ignore that path; do not start using it.

`defineThemeContract` still types `Omit<ThemeVariant, 'selector'>`. That is a leftover. `ThemeVariant` has no `selector` in v1 or v2. It does not change `config.themes` emission.

**There is no clean upstream knob in v1 or v2.** Waiting for a Panda config option is not a plan. Owning the name on our side of the compiler boundary is.

### 3.1 Panda v2 does not solve this — it hardens the same name

Checked against:

- Branch **`panda-v2`** (`0e2a6354 feat(core): migrate the system to Panda CSS v2`). Color-mode still uses `DATA_COLOR_MODE_ATTR = 'data-panda-theme'`. The portable stylesheet still hardcodes `:not([data-panda-theme])`. The v2 commit did not touch this contract.
- **`vendor/panda`**, the Rust compiler we will actually run. Theme selectors are hardcoded in `crates/pandacss_config/src/lib.rs`:

```rust
pub fn theme_condition(&self, condition: &str) -> Option<String> {
    let key = self.theme_for_condition(condition)?;
    Some(format!(
        "&:where([data-panda-theme={key}], [data-panda-theme={key}] *)"
    ))
}

pub fn theme_root_selector(&self, theme: &str) -> Option<String> {
    self.themes
        .contains_key(theme)
        .then(|| format!("[data-panda-theme={theme}]"))
}
```

`ThemeVariant` in the Rust config is still `{ tokens, semantic_tokens }` only. Validation now **warns** if a theme name is not `[A-Za-z0-9_-]+`, because that string is typed into `data-panda-theme`, a `_theme*` condition, and the generated `ThemeName` type (`crates/pandacss_config/src/validate.rs`). That is the opposite of a rename API.

v2 also made named-theme CSS **richer**, not simpler. Theme variables declare on `[data-panda-theme=…]` and then combine with `_dark` / `_light` at every boundary:

```css
[data-panda-theme=gothic] { … }
.dark [data-panda-theme=gothic],
[data-panda-theme=gothic].dark,
[data-panda-theme=gothic] .dark { … }
```

(`vendor/panda/.changeset/theme-vars-inherit.md`, tests in `crates/pandacss_stylesheet/tests/themes.rs`.)

That is why the translator must be a **selector-parser attribute rename**, not a one-line regex aimed at v1’s flat `[data-panda-theme=dark] { }`. After v2, the same attribute appears as an ancestor, on the element, and as a descendant in combinator lists.

Panda’s own model splits two concepts we currently collapse:

| Panda feature | Intended meaning | Selector |
| :--- | :--- | :--- |
| `config.themes` (`gothic`, `matcha`, `primary`) | Named / brand theme | **hardcoded** `[data-panda-theme=…]` |
| `_dark` / `_light` (preset-base) | Color mode | **`.dark &` / `.light &`** (not `data-theme`) |

We map `colorMode` onto `config.themes` named `light` and `dark`. That is why the compiler’s brand-theme attribute leaked into our light/dark DOM. It is the right **mechanism** for island token swaps (a whole token tree per mode, nearest physical stamp wins). It is the wrong **name**.

Do **not** “fix” this by remodeling color mode as Panda `_dark` conditions. Preset-base `_dark` is a class (`.dark &`), not an island attribute. Nested `colorMode="light"` inside a dark ancestor would stop working the way `PORTAL_COLOR_MODE.md` requires. That would be a second architecture project, not this polish.

**Implication for sequencing:** the scrub is independent of the v2 merge. Do it in a form that survives `panda-v2` (translate at postprocess; never assume a v2 selector option). Landing it on current 1.11.1 and carrying the translator onto `panda-v2` is fine. Waiting for v2 in the hope they expose `data-theme` is not — they did not, and `vendor/panda` still will not.

Exclude `vendor/panda` from scrub greps. That tree is allowed to say `data-panda-theme`. Our shipped CSS and our source must not.

---

## 4. Why we currently match Panda’s name

This was a deliberate earlier decision, not an accident.

`PORTAL_COLOR_MODE.md` currently says the only physical attribute is `data-panda-theme`, that Panda `extendThemes` emits `[data-panda-theme]`, and that `data-theme` / `data-color-mode` are **forbidden aliases**. `readDocumentColorMode()` already ignores `data-theme`. `color-mode.test.ts` asserts that.

We matched the compiler so CSS selectors and DOM stamps could never drift. That was the right engineering instinct with the wrong public name. The fix is not “stop matching the compiler”. The fix is **translate at the compiler boundary**, then keep a single name everywhere downstream.

---

## 5. The clean architecture (do this, not a sweep)

Color mode already has a single writer:

```
colorMode prop
  → ColorModeContext / readDocumentColorMode
  → resolveColorModeAttr()
  → DATA_COLOR_MODE_ATTR
  → spread onto the primitive host
```

And a single CSS seam after Panda cssgen:

```
runPandaCss / runPandaCodegen
  → postprocessCss()
    → createLocalPostprocessedStylesheets()
      → createPortableStylesheetFromContent()
```

Two source-of-truth changes, then mechanical follow-through.

### 5.1 Own the DOM name in one constant

`packages/reference-core/src/system/primitives/shared/constants.ts`

```ts
export const DATA_COLOR_MODE_ATTR = 'data-theme'
```

Primitives, `resolveColorModeAttr`, and `readDocumentColorMode` already go through this. `context.test.ts` already asserts via the constant, so those tests flip for free.

Keep a **private** compiler leftover next to it, used only by CSS translation:

```ts
/** Panda `config.themes` emission. Never stamp, read, or ship this. */
export const PANDA_THEME_ATTR = 'data-panda-theme'
```

That leftover is the only remaining `panda-theme` identifier in runtime source, and it should not be re-exported from `@reference-ui/react`.

### 5.2 Translate Panda CSS at the postprocess front door

This is the important part. `createLocalPostprocessedStylesheets()` currently:

1. Demotes Panda’s global layer.
2. Drops unresolved private token declarations.
3. Builds **downstream** CSS through `createPortableStylesheetFromContent()` (layer-scoped, selector-rewritten).
4. Writes **user-space** `styles.css` from the still-Panda-shaped `localCss`.

If we only change the portable transform, **user-space `styles.css` still ships `[data-panda-theme]`**. Both outputs must leave the postprocess as `data-theme`.

Do the rename **once**, on the CSS string, immediately after Panda artifacts are normalized and **before** the portable transform and before writing user-space CSS:

```
raw Panda CSS
  → demote / drop-private
  → rewritePandaThemeAttribute()   // data-panda-theme → data-theme
  → portable transform + user-space write
```

Implementation shape (not a global `css.replace` in forty files):

- One function, e.g. `rewritePandaThemeAttribute(css: string): string`.
- Use the existing PostCSS + `postcss-selector-parser` stack already in `system/stylesheet`.
- Rename attribute nodes named `data-panda-theme` to `data-theme`.
- That covers v1’s `[data-panda-theme=dark]`, `:is(...)`, `:not([data-panda-theme])`, and v2’s nested combinator lists (`.dark [data-panda-theme=dark]`, `[data-panda-theme=dark].dark`, `:where([data-panda-theme=dark], [data-panda-theme=dark] *)`) without touching comments or strings by accident.

Then point `createPortableStylesheetFromContent`’s unthemed descendant clause at `DATA_COLOR_MODE_ATTR`:

```ts
const unthemedLayerSelector = `${layerSelector}:not([${DATA_COLOR_MODE_ATTR}])`
```

Today that `:not([data-panda-theme])` is hardcoded in the transform. After translation, input selectors are already `[data-theme=…]`; the `:not()` must use the same attribute or nested islands break.

Portable transform tests should keep a **Panda-shaped input fixture** (because that is what Panda emits) and an assertion that **output contains zero `data-panda-theme`**. That locks the dialect boundary.

### 5.3 Why this is not janky

| Approach | Verdict |
| :--- | :--- |
| Translate once at postprocess, one DOM constant | Clean. Compiler dialect in, product contract out. |
| Dual-stamp `data-panda-theme` and `data-theme` | Jank. Two physical contracts, forever tests, portal bugs. |
| `closest('[data-panda-theme], [data-theme]')` | Already forbidden in `PORTAL_COLOR_MODE.md`. Do not add it. |
| Repo-wide string replace with no CSS seam | Brittle. Misses generated CSS, future Panda output, user-space vs downstream split. |
| Custom Panda `conditions.dark` | Does not affect `config.themes` emission. The hardcoded `getThemeSelector` still wins. |
| Wait for Panda `ThemeVariant.selector` | Not in 1.11.1 or 2.0 beta types. Not a dependency we should block polish on. |

Panda may keep saying `data-panda-theme` internally. That is fine. Our boundary erases it.

---

## 6. Toast already uses `data-theme` — this is a real collision

`Toast` is the one existing product use of `data-theme`, and it is **not** the color-mode contract.

`ToastSystem` renders a primitive `Div` with `data-theme={theme}` where `ToastTheme = 'light' | 'dark' | 'system'`. Chrome CSS is scoped as:

```css
[data-reference-toast-host][data-theme="dark"] { … }
[data-reference-toast-host][data-theme="system"] { … }
```

Primitive spread order is `colorModeAttr` then `elementProps`. Toast’s `data-theme={theme}` is an element prop, so it **wins** over the color-mode stamp on that same node.

Today that is harmless because color mode lives on `data-panda-theme`. After the rename it is not:

- `theme="system"` would clobber `data-theme="dark"` on the host.
- Token selectors `[data-theme=dark]` would not match the host.
- Nested toast children still inherit `ColorModeContext` and would stamp `data-theme` themselves, so most inner tokens would still resolve.
- The host itself would be in a third, non-token mode.

Same-PR requirement: move Toast chrome off `data-theme`. Suggested name: `data-toast-theme` (or any host-specific attribute). Keep the CSS scoped under `[data-reference-toast-host]`. Values can stay `light | dark | system`.

Do not try to overload `data-theme` with `system`. Color mode is `light | dark` only. Absence is not light. `system` is a Toast chrome preference, not a token theme.

---

## 7. Inventory (everything that currently says `data-panda-theme`)

A later implementation should treat this as the grep list. After the work, the only remaining hits should be this research file, the private `PANDA_THEME_ATTR` constant, the translator + its input fixtures, and changelog notes.

### 7.1 Source of truth (change these first)

| File | Role |
| :--- | :--- |
| `packages/reference-core/src/system/primitives/shared/constants.ts` | `DATA_COLOR_MODE_ATTR` |
| `packages/reference-core/src/system/primitives/shared/color-mode.ts` | Comments + document reader |
| `packages/reference-core/src/system/primitives/shared/color-mode.test.ts` | Asserts the string `'data-panda-theme'`; currently **rejects** `data-theme` |
| `packages/reference-core/src/system/stylesheet/transform/createPortableStylesheetFromContent.ts` | Hardcoded `:not([data-panda-theme])` |
| `packages/reference-core/src/system/stylesheet/postprocess/helpers.ts` | Front door for the translator (today does not rename) |

Primitives themselves (`generate.ts` / `primitives.liquid`) do not hardcode the attribute. They spread `colorModeAttr`. Leave them alone.

### 7.2 CSS tests that speak Panda dialect

| File | Role |
| :--- | :--- |
| `packages/reference-core/src/system/stylesheet/transform/createPortableStylesheetFromContent.test.ts` | Fixtures and expected selectors |
| `packages/reference-core/src/system/stylesheet/README.md` | Documents preserving `[data-panda-theme=dark]` |

Keep **input** fixtures in Panda dialect if the translator sits in front of the portable transform. Expected **output** must be `data-theme`.

### 7.3 Hosts that stamp the document (writers)

| File | Role |
| :--- | :--- |
| `packages/reference-lib/book/decorator/BookDecorator.tsx` | `document.documentElement.setAttribute('data-panda-theme', theme)` plus `colorMode={theme}` |
| `packages/reference-lib/playwright/main.tsx` | CT host stamps `'dark'` on `<html>` |

These should stamp `data-theme`. Prefer using `DATA_COLOR_MODE_ATTR` if it is reachable without expanding the public API; otherwise the literal `'data-theme'` is acceptable at app-host edges.

### 7.4 Tests that treat the attribute as the contract

These hardcode the string instead of the constant. They are why the leak is visible “just around”.

| Area | Files |
| :--- | :--- |
| Portal unit | `packages/reference-lib/src/components/Portal/Portal.test.tsx` |
| Overlay matrix | `matrix/overlays/tests/e2e/overlay.spec.ts` (`getAttribute('data-panda-theme')`) |
| Portal matrix | `matrix/lib/tests/e2e/portal.spec.ts` (`PT-THEME-01` … `PT-THEME-04`) |
| Color-mode matrix | `matrix/color-mode/src/index.tsx` (raw `data-panda-theme={…}` islands), `matrix/color-mode/tests/e2e/system-contract.spec.ts` |
| System matrix | `matrix/system/src/index.tsx`, `matrix/system/tests/e2e/system-contract.spec.ts` (also asserts generated CSS contains `data-panda-theme=dark`) |

The matrix color-mode package is the important non-React case: it puts `data-panda-theme` on plain `<div>` hosts to prove token CSS follows the **physical** attribute, not only `colorMode`. Those hosts must move to `data-theme` in lockstep with the CSS rewrite or the suite goes red for the right reason.

`context.test.ts` is already constant-based. Do not add new hardcoded attribute strings there.

### 7.5 Docs that currently canonize the Panda name

These currently **forbid** `data-theme`. They have to invert.

- [`PORTAL_COLOR_MODE.md`](./PORTAL_COLOR_MODE.md) — living protocol. Replace every physical mention. Keep the laws (one attribute, no closest(), no invented default).
- [`OVERLAY_THEME.md`](../archive/OVERLAY_THEME.md) — forensic history; update selectors in the explanation or add a one-line “attribute renamed, see DATA_THEME.md”.
- [`VARIANTS.md`](./VARIANTS.md) — the symmetry table `colorMode → data-panda-theme` becomes `colorMode → data-theme`.
- [`BOOK.md`](../BOOK.md) — decorator theme boundary.
- `packages/reference-lib/src/components/Portal/Portal.md`, `Portal/NEXT.md`
- `packages/reference-lib/src/components/Overlay/Overlay.md`, `Overlay/SPEC.md` (`OV-THEME-01`)
- `packages/reference-lib/OVERLAYS.md`
- `packages/reference-core/src/system/stylesheet/README.md`
- `matrix/TEST_COVERAGE.md`, `matrix/TEST_MIGRATION.md`

MCP does not currently teach `data-panda-theme`. `colorMode` in `packages/reference-mcp/src/pipeline/primitives.ts` stays as-is. Do not add the compiler name to agent instructions.

---

## 8. Consumer-facing API (what should be true after)

Preferred:

```tsx
<Div colorMode="dark">{children}</Div>
```

Document fallback for tests / non-React roots:

```ts
document.documentElement.setAttribute('data-theme', 'dark')
document.documentElement.style.colorScheme = 'dark'
```

Never:

```ts
document.documentElement.setAttribute('data-panda-theme', 'dark')
```

Do not export a public `ColorModeProvider`. Law 3 still holds: primitives provide context. Book/docs/apps put `colorMode` on a root primitive.

`DATA_COLOR_MODE_ATTR` can remain a core internal constant. It does not need to become a documented public export. If hosts need it, they can import from the same shared module tests already use — but consumers should be taught `colorMode`, not the attribute.

---

## 9. Suggested implementation sequence

One change set, not a multi-release alias window, unless something outside this repo is already stamping `data-panda-theme` in production. At `0.0.43` a hard cutover is the clean polish. Dual-read for one release only if we know of external writers.

The scrub does not have to wait for `panda-v2`. It does have to be v2-safe: selector-parser rename at postprocess, fixtures that still accept Panda-shaped input after the compiler CSS gets nested. If this lands on current 1.11.1 first, cherry-pick or re-apply onto `panda-v2` rather than inventing a second strategy there.

1. **Translator + constant** in `reference-core`. Portable transform reads `DATA_COLOR_MODE_ATTR`. User-space and downstream CSS both leave postprocess without `data-panda-theme`. Include a v2-shaped combinator fixture so the rename still holds after the compiler migration.
2. **Flip color-mode unit tests.** `DATA_COLOR_MODE_ATTR === 'data-theme'`. `readDocumentColorMode` reads `data-theme`. It ignores `data-panda-theme` and `data-color-mode`.
3. **Toast attribute rename** in the same PR (`data-toast-theme`). Update `toastStyles.ts` and Toast CT.
4. **Hosts**: Book decorator, CT `playwright/main.tsx`.
5. **Lib + matrix tests/fixtures** from the inventory.
6. **Docs** invert the old “`data-theme` is a forbidden alias” law.
7. **Grep gates** (see below).
8. Proof: `pnpm agent vitest core` for the stylesheet/color-mode unit slice, then `pnpm agent playwright` on `matrix/color-mode`, `matrix/lib` portal theme cases, and overlay `OV-THEME-*`. Lib Portal unit tests + Toast CT via `test-component`. This is a core CSS contract change, so `pnpm ct` is not sufficient on its own.

Do not land the DOM rename without the CSS translator. Do not land the CSS translator without Toast. Those three are one behavior.

---

## 10. Proof that the scrub actually happened

After implementation, these should be empty outside this file, the translator, its Panda-input fixtures, and `PANDA_THEME_ATTR`:

```bash
rg -n "data-panda-theme" --glob '!DATA_THEME.md' --glob '!**/node_modules/**' --glob '!vendor/panda/**'
```

Shipped CSS (user-space `styles.css` and portable `baseSystem.css` / layered CSS) must not contain `data-panda-theme`. The matrix system contract that currently does `text.includes('data-panda-theme=dark')` should assert `data-theme=dark` instead.

Behavioral tests that must still pass, just under the new attribute:

- Nested light island inside a dark ancestor, and the reverse (portable `:not([data-theme])` still prevents ancestor leak).
- Portal first primitive re-stamps `data-layer` + `data-theme` (`PT-THEME-01` … `04`).
- Document-only stamp on `documentElement` with no React `colorMode` still resolves tokens.
- Overlay / popover / dialog portaled surfaces resolve dark tokens (`OV-THEME-01`).
- Toast `light | dark | system` chrome still works, now on `data-toast-theme`.

---

## 11. What we are explicitly not doing

- Not introducing a public theme provider.
- Not observing `prefers-color-scheme` inside Portal or primitives. That stays an app-root concern that then sets `colorMode` / `data-theme`.
- Not supporting `data-theme="system"` as a token mode.
- Not walking `closest('[data-theme]')` to discover mode. React context first, document fallback second.
- Not leaving `data-panda-theme` as a documented “also supported” reader. That is how leaks survive.
- Not rewriting Panda’s `getThemeSelector` / `theme_root_selector` via patch-package or a fork of `vendor/panda`. Our postprocess is the supported extension point we already own.
- Not waiting for Panda v2 to expose a theme selector. `panda-v2` and `vendor/panda` still hardcode `data-panda-theme`.
- Not remodeling `colorMode` as Panda `_dark` (`.dark &`) to dodge the attribute. Nested light/dark islands would regress.

---

## 12. Bottom line

Panda v1 and v2 will keep emitting `[data-panda-theme=…]`. That is an input dialect. The v2 migration does not change the plan; it makes the translator more necessary, because the same attribute now appears in nested combinators.

Reference UI already has the two seams required for a clean scrub: `DATA_COLOR_MODE_ATTR` for the DOM, and stylesheet postprocess for CSS. Change the constant, translate once at the CSS front door, rename Toast’s colliding `data-theme`, then burn the hardcoded string out of tests and docs.

The result consumers should see:

```
colorMode="dark"  →  data-theme="dark"  →  [data-layer][data-theme=dark]
```

Panda is not part of that sentence.

