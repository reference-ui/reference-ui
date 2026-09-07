# Shorthands Extension (`@reference-ui/core`)

This module provides custom Panda CSS utility extensions that decompose multi-property CSS shorthands (`border`, `outline`) into orthogonal width and style longhands.

---

## 1. The Atomic CSS & CSS Shorthand Problem

### 1.1 W3C CSS Shorthand Reset Mandate
Under the W3C CSS specification (CSS Backgrounds and Borders Module Level 3), directional border shorthands (`border-bottom`, `border-top`, etc.) and the `outline` shorthand are defined as resetting shorthands:

$$\text{Initial value of } \texttt{border-*-color} = \texttt{currentColor}$$
$$\text{Initial value of } \texttt{outline-color} = \texttt{currentColor / invert}$$

When an author declares:
```css
border-bottom: 1px solid;
```
the browser evaluates this declaration as:
```css
border-bottom-width: 1px;
border-bottom-style: solid;
border-bottom-color: currentcolor; /* Omitted sub-property reset to initial value */
```

### 1.2 The Cascade Collision in `@layer utilities`
In JSX/TSX:
```tsx
<Box borderBottom="1px solid" borderColor="gray.800" />
```
Authors treat `borderBottom` and `borderColor` as two orthogonal style props. However, atomic CSS engines emit these as two independent utility classes inside `@layer utilities`:
* `.bd-c_gray\.800 { border-color: var(--colors-gray-800); }` (emitted earlier)
* `.bd-b_1px_solid { border-bottom: 1px solid; }` (emitted later)

Because both classes have identical specificity `(0, 1, 0)`, **stylesheet source order determines the winner**. The shorthand emitted later resets `border-bottom-color` back to `currentColor` (e.g. pure white `#ffffff` in dark mode), completely clobbering the intended color token.

The identical failure mode occurs with `outline`:
```tsx
<Button outline="1px solid" outlineColor="blue.600" />
```
The `outline: 1px solid` declaration resets `outline-color: currentColor`.

---

## 2. The Solution: Shorthand Decomposition

Rather than emitting raw CSS shorthands, our custom transforms parse the value and emit **only the width and style longhands** when no color is authored in the shorthand string:

```ts
// Authored: borderBottom="1px solid"
// Emitted CSS:
.bd-b_1px_solid {
  border-bottom-width: 1px;
  border-bottom-style: solid;
  /* border-bottom-color is intentionally omitted! */
}
```

Because `border-bottom-color` is omitted:
1. `borderColor="gray.800"` (`.bd-c_gray.800`) applies cleanly to all sides.
2. `borderBottomColor="gray.800"` (`.bd-b-c_gray.800`) applies cleanly to the bottom side.
3. If no color is authored anywhere, the browser falls back naturally to `currentColor` per spec.
4. If a color *is* authored in the shorthand (e.g. `borderBottom="1px solid colors.gray.800"`), the transform resolves the token and emits `borderBottomColor: var(--colors-gray-800)`.

---

## 3. Supported Utilities

### 3.1 Borders
* `border` (`b` / `bd`)
* `borderTop` (`borderT` / `bd-t`)
* `borderRight` (`borderR` / `bd-r`)
* `borderBottom` (`borderB` / `bd-b`)
* `borderLeft` (`borderL` / `bd-l`)
* `borderInline` (`borderX` / `bd-x`)
* `borderBlock` (`borderY` / `bd-y`)
* `borderInlineStart` (`borderStart` / `bd-s`)
* `borderInlineEnd` (`borderEnd` / `bd-e`)
* `borderBlockStart` (`bd-bs`)
* `borderBlockEnd` (`bd-be`)

### 3.2 Outlines
* `outline` (`ring`):
  * Generated via `createOutlineShorthandUtility({ ... })` matching the `createBorderShorthandUtility` factory pattern.
  * **Why no directional outlines?** In the W3C CSS Basic User Interface specification, `outline` is inherently non-directional (`outline-top`, `outline-bottom`, etc. do not exist) because outlines do not take up space in the box model layout and may be non-rectangular.
  * Supports CSS UI Level 4 `outline-style: auto` (platform focus rings) in addition to all standard border styles.
  * Decomposes `outline="1px solid"` into `outlineWidth` + `outlineStyle`.
  * Preserves `outlineColor` (`ringColor`).
  * Accessible `outline="none"`: transforms to `{ outline: '2px solid transparent', outlineOffset: '2px' }` to preserve accessibility in Windows High Contrast Mode / Forced Colors Mode.
  * Supports `outline="0"` -> `{ outlineWidth: '0px' }`.

---

## 4. Hardened Edge Cases

The shared parser in `parser.ts` explicitly guards against common CSS gotchas:

1. **Order Independence**:
   Per W3C CSS Backgrounds and Borders § 4.4, tokens in `[width, style, color]` can appear in **any of the 6 permutations** (e.g. `red 1px solid`, `solid red 1px`). The parser identifies each token type semantically regardless of order.
2. **CSS Math Functions in Widths**:
   `calc(...)`, `min(...)`, `max(...)`, and `clamp(...)` are recognized as widths rather than misattributed to colors (e.g. `borderBottom="calc(1px + 1px) solid"`).
3. **Leading Decimals & Hairline Widths**:
   `.5px`, `.25rem`, `.5r` are recognized alongside integer and decimal units (`0.5px`).
4. **Rhythm Units & Fractions**:
   Multiples of root rhythm spacing (`2r`, `1/2r`, `1/3r`) resolve automatically to CSS calc formulas (`calc(2 * var(--spacing-root))`).
5. **CSS Global Keywords**:
   `inherit`, `initial`, `unset`, `revert`, and `revert-layer` are preserved on the main shorthand property rather than being assigned to `borderColor`.
6. **Whole-Shorthand CSS Variables & Token Paths**:
   Single CSS variable references (e.g. `border="var(--custom-border)"`) or token paths (`borders.subtle`, `outlines.focus`) pass through to the main shorthand property untouched.
7. **Modern Color Functions with Spaces & Commas**:
   Values with nested functions (`color-mix(...)`, `oklch(...)`, `light-dark(...)`, `rgb(...)`) are tokenized cleanly via paren-depth tracking.
8. **Multiple Zero Formats**:
   `0`, `'0'`, `'0px'`, `'0rem'`, `'0em'` cleanly collapse to zero width without setting unnecessary styles.

---

## 5. Other CSS Shorthands in the Design System

| Shorthand | Sub-properties Reset in CSS Spec | Collision Risk in Atomic CSS | Recommended Pattern |
|---|---|---|---|
| `border` | `width`, `style`, `color` (`currentColor`) | **High** (clobbers `borderColor`) | Decomposed via `borderShorthandUtilities` |
| `outline` | `width`, `style`, `color` (`currentColor`) | **High** (clobbers `outlineColor`) | Decomposed via `outlineShorthandUtilities` |
| `textDecoration` | `line`, `style`, `color` (`currentColor`), `thickness` (`auto`) | **Medium-High** (clobbers `textDecorationColor` & `textDecorationThickness`) | Decompose into line + style when thickness/color are separate |
| `background` | `color` (`transparent`), `image`, `position`, `size`, `repeat`, etc. | **High** (`bg` maps to `background`, `bgColor` maps to `backgroundColor`) | Use `backgroundColor` for solid fills, `backgroundImage` for gradients/images |
| `flex` | `grow`, `shrink`, `basis` (`0%`) | **Low-Medium** | Use explicit `flexGrow`, `flexShrink`, `flexBasis` when mixing |
| `font` | `weight` (`normal`), `size`, `line-height` (`normal`), `style`, `family` | **Low** | Modern React components author `fontSize`, `fontWeight`, `lineHeight` directly |

