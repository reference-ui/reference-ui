# Style Errors Post-Mortem & Resolution Report

**Date**: September 7, 2026  
**Status**: Resolved  
**Scope**: `@reference-ui/core`, `@reference-ui/lib` (BookShell & Components), `@reference-docs`  

---

## 1. Executive Summary

During testing of the Book component browser (`http://localhost:5000/`) in dark mode (`theme=dark`), several severe visual anomalies occurred:
1. **White Wireframe Borders Everywhere**: Horizontal dividing lines across the shell header, search bar container, breadcrumb control bar, story list active indicators, and SectionCard containers rendered as stark, high-contrast `#ffffff` borders instead of subtle dark gray (`gray.800` / `rgba(255,255,255,0.1)`).
2. **Docs Parity Discrepancy**: When comparing Book with the documentation app (`packages/reference-docs`), the Docs rendered identical border elements with perfect, subtle dark borders in dark mode, appearing completely unaffected.
3. **Splitter & Showcase Styling Regressions**: Splitter cards inside `Showcase.book.tsx` rendered light gray panels with near-invisible white text on white backgrounds, while the splitter handle initially carried an excessive 64px hit gap.

This document details the exact root cause, CSS cascade and shorthand mechanics, why the docs succeeded while Book failed, and the architectural fix implemented in both `@reference-ui/core` and `@reference-ui/lib`.

---

## 2. Root Cause Analysis (Post-Mortem)

### 2.1 CSS Shorthand Expansion Trait

In CSS (W3C CSS Backgrounds and Borders Module Level 3), directional border properties such as `border-bottom`, `border-top`, `border-left`, and `border-right` are **shorthand properties**. They expand into three longhands:
- `<side>-width`
- `<side>-style`
- `<side>-color`

When a shorthand is declared with omitted sub-properties (e.g. `border-bottom: 1px solid`), CSS specification mandates that **any omitted sub-property is reset to its initial value**:
$$\text{initial value of } \texttt{border-*-color} = \texttt{currentColor}$$

Therefore, the declaration:
```css
border-bottom: 1px solid;
```
is functionally and strictly equivalent to:
```css
border-bottom-width: 1px;
border-bottom-style: solid;
border-bottom-color: currentcolor;
```

### 2.2 Panda Utility Output Order in `@layer utilities`

Panda CSS generates atomic utility classes inside the `@layer utilities` cascade layer. Within the same layer, rules with the same selector specificity (`(0, 1, 0)`) are evaluated strictly by **stylesheet source order** (last declared rule wins).

Inspecting the computed stylesheet rules revealed Panda's generation order:

```css
/* Index ~323: 4-sided generic border-color */
.bd-c_gray\.800 {
  border-color: var(--colors-gray-800);
}

/* Index ~325: directional border-right shorthand */
.bd-r_1px_solid {
  border-right: 1px solid;
}

/* Index ~327: directional border-bottom shorthand */
.bd-b_1px_solid {
  border-bottom: 1px solid;
}

/* Index ~331: directional border-left shorthand */
.bd-l_2px_solid {
  border-left: 2px solid;
}

/* Index ~546: directional border-*-color longhands */
.bd-b-c_gray\.800 {
  border-bottom-color: var(--colors-gray-800);
}
```

Notice the critical ordering:
1. Generic `borderColor` (`.bd-c_*`) is emitted at **index ~323**.
2. Directional border shorthands (`.bd-b_*`, `.bd-r_*`, `.bd-l_*`) are emitted at **indices ~325–331**.
3. Directional border colors (`.bd-b-c_*`, `.bd-r-c_*`) are emitted at **indices ~546+**.

### 2.3 The Collision: Why Book Had White Borders

In `BookShell.tsx`, dividers were written pairing a directional border shorthand with the generic 4-sided `borderColor`:

```tsx
// BookShell.tsx (Header)
<Header
  borderBottom="1px solid"
  borderColor={subtleBorder} // subtleBorder = 'gray.800' in dark mode
>
```

At runtime, this element received the class string:
`class="... bd-b_1px_solid bd-c_gray.800"`

In the browser cascade:
1. `.bd-c_gray\.800` set `border-color: var(--colors-gray-800);`.
2. `.bd-b_1px_solid` (appearing **later** at index ~327) set `border-bottom: 1px solid;`.
3. The shorthand reset `border-bottom-color` to `currentColor`.
4. In dark mode, the element's inherited font color (`currentColor`) is `#ffffff` (white).
5. **Result**: The header bottom border turned bright white.

The same pattern was repeated across `BookShell.tsx` on:
- Sidebar right divider: `borderRight="1px solid" borderColor={subtleBorder}`
- Search bar bottom divider: `borderBottom="1px solid" borderColor={subtleBorder}`
- Selected story left accent: `borderLeft="2px solid" borderColor={...}`
- Canvas top control bar divider: `borderBottom="1px solid" borderColor={subtleBorder}`

Every one of these dividers was clobbered by the shorthand resetting color to `currentColor`.

---

## 3. Why the Docs Appeared Normal

When inspecting `packages/reference-docs` (`DocSidebar.tsx`, `ThemeToggle.tsx`, `mdxComponents.tsx`), the code authored directional borders differently:

```tsx
// DocSidebar.tsx
<Aside
  borderRight="1px solid"
  borderRightColor="docsSidebarBorder"
>

// ThemeToggle.tsx
<Div
  borderTop="1px solid"
  borderTopColor="docsSidebarBorder"
>

// mdxComponents.tsx
<H2
  borderBottom="1px solid"
  borderBottomColor="docsPanelBorder"
>
```

Notice the crucial difference:
The docs **never** paired a directional border with generic `borderColor`. They always used the matching directional color property (`borderRightColor`, `borderTopColor`, `borderBottomColor`).

Because `.bd-b-c_*` and `.bd-r-c_*` were emitted by Panda at **index ~546**, they appeared **after** `.bd-b_1px_solid` (index ~327). Therefore:
- `.bd-b_1px_solid` set `border-bottom: 1px solid;` (resetting to `currentColor`).
- `.bd-b-c_docsPanelBorder` followed immediately at index ~546 and **overwrote** `border-bottom-color` with the correct token variable!

This explained the mystery:
- **Docs**: Used specific side color props (`borderBottomColor`) $\rightarrow$ won the cascade $\rightarrow$ rendered correctly.
- **Book**: Used general `borderColor` $\rightarrow$ lost the cascade to `borderBottom` $\rightarrow$ defaulted to `currentColor` (white).

---

## 4. The Solution

Relying on developers to remember stylesheet generation orders and know that `borderColor` cannot be used with `borderBottom="1px solid"` is fragile. The design system should make `borderBottom="1px solid"` + `borderColor="..."` work intuitively.

A two-layer fix was implemented:

### 4.1 Layer 1: System-Level Utility Decomposition (`@reference-ui/core`)

In `packages/reference-core/src/system/panda/config/extensions/rhythm/border.ts`, we introduced `borderShorthandUtilities` for all border shorthand properties:
- `border`
- `borderTop`
- `borderRight`
- `borderBottom`
- `borderLeft`
- `borderInline`
- `borderBlock`
- `borderInlineStart`
- `borderInlineEnd`
- `borderBlockStart`
- `borderBlockEnd`

#### How the Transform Works:
When a value like `"1px solid"` or `"2r solid"` is passed:
1. The transform parses the tokens (`width: '1px'`, `style: 'solid'`).
2. If **no color** is specified in the string:
   Instead of emitting the shorthand `border-bottom: 1px solid;` (which triggers the CSS color reset), the utility emits **only** the width and style longhands:
   ```ts
   {
     borderBottomWidth: '1px',
     borderBottomStyle: 'solid',
   }
   ```
3. Because `border-bottom-color` is **omitted**, the CSS rule:
   ```css
   .bd-b_1px_solid {
     border-bottom-width: 1px;
     border-bottom-style: solid;
   }
   ```
   **never touches `border-bottom-color`**.
4. Both `borderColor="gray.800"` (`.bd-c_gray.800`) and `borderBottomColor="gray.800"` (`.bd-b-c_gray.800`) apply their color unhindered!
5. If no color is specified anywhere on the element, CSS naturally falls back to `currentColor` per spec.
6. If the developer *does* specify a color in the shorthand (e.g. `borderBottom="1px solid colors.gray.800"`), the transform resolves the token and emits:
   ```ts
   {
     borderBottomWidth: '1px',
     borderBottomStyle: 'solid',
     borderBottomColor: 'var(--colors-gray-800)',
   }
   ```

### 4.2 Layer 2: Component-Level Semantic Alignment (`@reference-ui/lib`)

In `packages/reference-lib/src/Book/BookShell.tsx`:
- Updated all directional dividers to use explicit directional color props:
  - `borderRight="1px solid" borderRightColor={subtleBorder}`
  - `borderBottom="1px solid" borderBottomColor={subtleBorder}`
  - `borderLeft="2px solid" borderLeftColor={isDark ? 'gray.800' : 'gray.200'}`
- In `packages/reference-lib/src/components/Showcase.book.tsx`:
  - Replaced hardcoded `colors.gray.100` / `colors.gray.50` on Splitter panels with adaptive semantic tokens: `ui.table.row.mutedBackground` and `ui.field.background`, paired with `color="design.text.base"`.
  - Replaced `colors.gray.100` on cancel / popover close buttons with `ui.button.mutedBackground`.
- In `packages/reference-lib/src/components/Splitter/Splitter.tsx`:
  - Adjusted handle geometry: visual 1px footprint between panels with a 9px interactive hit area and centered rounded pill thumb (`borderRadius: 9999`).

---

## 5. Verification & Testing

1. **Unit Tests**:
   - `border.test.ts`: Added 6 dedicated test cases verifying decomposition of `"1px solid"`, rhythm units (`"2r solid"`), token resolution (`"1px solid colors.gray.800"`), `"none"`, and `0`.
   - Core test suite: **630/630 tests passing**.
2. **Matrix Pipeline Contract**:
   - `pnpm pipeline test --packages=@matrix/primitives`: **63/63 tests passing** (14 unit, 49 e2e). Zero raw `colors.*` leaks.
3. **Visual Inspection**:
   - Splitter stories captured across Horizontal (Resting, Hover, Focus Click, Tab Keyboard), Vertical, ThreePanels, and CustomThumb.
   - Book dev server verified with crisp, dark `gray.800` dividers and no unintended white wireframes.

---

## 6. Takeaways & Best Practices

1. **Beware CSS Shorthands in Atomic Utility Systems**:
   Atomic CSS frameworks must take care with multi-property shorthands (`border`, `border-bottom`, `background`, `flex`). Omitting properties in a shorthand resets unspecified longhands to their initial values, causing unexpected overrides when combined with independent atomic utilities.
2. **Decomposition Over Raw Shorthands**:
   Transforming `borderBottom="1px solid"` to width + style longhands allows atomic color utilities (`borderColor`, `borderBottomColor`) to compose cleanly without ordering dependencies.
3. **Canonical Testing Policy**:
   Always run matrix packages through the hermetic pipeline CLI (`pnpm pipeline test --packages=@matrix/<package>`).
