# OVERLAY_THEME.md — Forensic Analysis of Portaled Overlays & Theme Inheritance

## 1. Executive Summary

This document provides an in-depth architectural analysis of how portaled overlays inherit light/dark color modes and design-system layer scopes in Reference UI.

### The Symptom
During recent component development, overlays (`<Overlay.Content>`, `<Overlay.Backdrop>`, dialogs, menus, and popovers) rendered with a **blazing bright white background** when opened inside a dark mode application. 

### The Underlying Cause
1. **DOM Teleportation**: React portals move DOM nodes to `document.body`, outside the application's root container.
2. **CSS Token Scoping**: In Reference UI, semantic tokens (e.g. `ui.dialog.background`, `ui.button.background`) require CSS selectors scoping them to `[data-layer="<system>"][data-panda-theme="<mode>"]`.
3. **The React Context / DOM Asynchrony**: While the DOM node was teleported outside the themed container, **React Context crossed the portal seamlessly**. Because React Context reported `inheritsLayerScope = true`, the primitive compiler deliberately suppressed emitting `data-layer` on the portaled node to avoid redundant DOM bloat.
4. **The Cascade Drop**: Stripped of both `data-layer` and `data-panda-theme` in the real DOM, the portaled surface fell back to the `:root` stylesheet defaults—which in a light-first theme is **pure white** (`oklch(100% 0 0)`).

### The Recent Fix (Commit `9e7bf688`)
* `reference-core` exported `useColorMode()` from `generate.ts`.
* `reference-lib` created `OverlayPortaledSurface` which reads `useColorMode()` from React Context and passes it as an explicit `colorMode` prop to `<Div>`.
* Passing explicit `colorMode` triggers `hasExplicitColorMode = true` inside `generate.ts`, forcing the primitive to re-emit both `data-layer` and `data-panda-theme` on `document.body`.

---

## 2. Deep Dive: Context vs. DOM Hierarchy

To understand why this happened, consider the mismatch between how React renders component trees and how browsers evaluate CSS cascade scopes.

### 2.1 The DOM Reality
In a standard application, the root DOM looks like this:

```html
<!DOCTYPE html>
<html>
  <body>
    <!-- The Root App Container -->
    <div id="root" data-layer="reference-lib" data-panda-theme="dark">
      <main>
        <button class="ref-button">Open Dialog</button>
      </main>
    </div>

    <!-- The Portaled Dialog (teleported by ReactDOM.createPortal) -->
    <div class="ref-div ref-overlay-content" style="position: fixed; ...">
      <h3>Confirm Action</h3>
    </div>
  </body>
</html>
```

Notice the crucial disconnect:
* The portaled `<div>` is a direct child of `<body>`.
* It is **NOT** a descendant of `<div id="root">`.
* In CSS, selector inheritance flows strictly down the **DOM tree**, not the React component tree.

### 2.2 How Tokens Depend on Ancestor Attributes
In Reference UI, portable stylesheets emit token variables scoped to design system layers and themes:

```css
@layer tokens {
  /* Scoped Dark Mode Tokens */
  [data-layer="reference-lib"][data-panda-theme="dark"] {
    --colors-ui-dialog-background: var(--colors-gray-950); /* Dark Slate */
    --colors-ui-dialog-foreground: var(--colors-gray-50);
  }

  /* Scoped Light Mode Tokens */
  [data-layer="reference-lib"][data-panda-theme="light"] {
    --colors-ui-dialog-background: oklch(100% 0 0); /* Pure White */
    --colors-ui-dialog-foreground: var(--colors-gray-950);
  }

  /* Fallback Root Tokens (Light-First Default) */
  :where(:root, :host) {
    --colors-ui-dialog-background: oklch(100% 0 0); /* Pure White */
  }
}
```

When an element has neither `[data-layer]` nor `[data-panda-theme]` on itself or any ancestor in the DOM tree, any token-backed prop such as `bg="ui.dialog.background"` cannot match the dark mode selector. It falls back to `:where(:root, :host)`, resulting in a solid white dialog on a dark page.

---

## 3. The Core Compiler Dynamics (`generate.ts`)

The root of the suppression lies in [`packages/reference-core/src/system/build/primitives/generate.ts`](file:///Users/ryn/Developer/reference-ui/packages/reference-core/src/system/build/primitives/generate.ts#L36-L49):

```tsx
const inheritsLayerScope = React.useContext(LayerScopeContext);
const inheritedColorMode = React.useContext(ColorModeContext);
const hasExplicitColorMode = colorMode != null && colorMode !== '';
const resolvedColorMode = hasExplicitColorMode ? String(colorMode) : inheritedColorMode;

// The decision rule:
const shouldEmitDataLayer = RESOLVED_DATA_LAYER_NAME != null 
  && RESOLVED_DATA_LAYER_NAME !== '' 
  && (!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null);

const dataLayerAttr = shouldEmitDataLayer ? { 'data-layer': RESOLVED_DATA_LAYER_NAME } : {};
const colorModeAttr = resolvedColorMode != null && resolvedColorMode !== '' ? { 'data-panda-theme': resolvedColorMode } : {};
const providesLayerScope = inheritsLayerScope || shouldEmitDataLayer;

return (
  <LayerScopeContext.Provider value={providesLayerScope}>
    <ColorModeContext.Provider value={resolvedColorMode}>
      <${tag} ref={ref} className={classes} {...dataLayerAttr} {...colorModeAttr} {...elementProps}>
        {children}
      </${tag}>
    </ColorModeContext.Provider>
  </LayerScopeContext.Provider>
);
```

### The Logic Trap in Portals
1. **The Optimization**: To keep DOM output clean and lightweight, `shouldEmitDataLayer` is designed to emit `data-layer="..."` only on the **root primitive** of a layer boundary. Descendants receive `inheritsLayerScope = true` via React Context, so intermediate `<div>`, `<span>`, and `<button>` elements omit `data-layer`.
2. **The Portal Loophole**: React's `createPortal` propagates React Context down to the portaled children.
3. Therefore, inside `<Overlay.Content>`, `inheritsLayerScope` was **`true`**!
4. Because `inheritsLayerScope` was `true` and no explicit `colorMode` prop was passed:
   ```ts
   shouldEmitDataLayer = (!true || false || false) === false
   ```
5. `data-layer` was omitted from the portaled DOM node!
6. Without `data-layer`, the CSS selector `[data-layer="reference-lib"][data-panda-theme="dark"]` could never match!

---

## 4. The Recent Changes: Commit `9e7bf688`

To restore theme inheritance without rewriting the portal architecture, commit `9e7bf688` introduced two changes:

### 4.1 In `reference-core`: Exporting `useColorMode()`
In `generate.ts`, the internal `ColorModeContext` was exposed through a public hook:
```tsx
export function useColorMode(): string | undefined {
  return React.useContext(ColorModeContext)
}
```
This hook is packaged and exported directly from `@reference-ui/react`.

### 4.2 In `reference-lib`: `OverlayPortaledSurface`
In [`packages/reference-lib/src/components/Overlay/overlay-portal-surface.tsx`](file:///Users/ryn/Developer/reference-ui/packages/reference-lib/src/components/Overlay/overlay-portal-surface.tsx):

```tsx
export const OverlayPortaledSurface = React.forwardRef<HTMLDivElement, OverlayPortaledSurfaceProps>(
  function OverlayPortaledSurface(
    {
      children,
      colorMode: colorModeProp,
      ...props
    },
    ref
  ) {
    const inheritedColorMode = useColorMode()
    const colorMode = colorModeProp ?? inheritedColorMode

    return (
      <Div ref={ref} colorMode={colorMode} {...props}>
        {children}
      </Div>
    )
  }
)
```

Both `Overlay.Backdrop` and `Overlay.Content` in [`Overlay.tsx`](file:///Users/ryn/Developer/reference-ui/packages/reference-lib/src/components/Overlay/Overlay.tsx#L316) were updated to render inside `<OverlayPortaledSurface>`.

### 4.3 Why This Fix Works
When `OverlayPortaledSurface` reads `inheritedColorMode = "dark"` from Context and passes it as `<Div colorMode="dark">`:
1. In `generate.ts`, `hasExplicitColorMode` evaluates to **`true`**.
2. The condition `(!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null)` evaluates to **`true`**.
3. `shouldEmitDataLayer` becomes **`true`**.
4. The portaled DOM node on `document.body` renders:
   ```html
   <div class="ref-div" data-layer="reference-lib" data-panda-theme="dark">
   ```
5. The DOM now has both required attributes directly on the root of the portaled subtree.
6. The dark mode token rules match, and the dialog renders dark.

---

## 5. Robustness Audit: Where It Holds & Where Edge Cases Lurk

The current implementation resolved the immediate visual bug, but an architectural audit reveals both strengths and subtle edge cases:

### 5.1 Strengths
* **Zero Runtime Overhead**: Reading context and passing an explicit prop costs nothing in performance.
* **Component-Level Encapsulation**: Users of `<Overlay>`, `<Dialog>`, `<Combobox>`, `<Menu>`, and `<Popover>` do not have to manually pass `colorMode`—the component handles it internally.
* **Preserves Nested Overrides**: If a user explicitly renders `<Overlay.Content colorMode="light">` inside a dark app, `colorModeProp` overrides `inheritedColorMode`, correctly rendering a light dialog inside a dark host.

---

### 5.2 Edge Cases & Latent Fragilities

#### Edge Case A: External Theme Toggling (DOM-only Dark Mode)
If an application toggles dark mode by setting attributes on `<html>` or `<body>` (e.g. `document.documentElement.setAttribute('data-panda-theme', 'dark')` or using a theme provider that doesn't use Reference UI's `ColorModeContext`), then:
* In React, `ColorModeContext` is **`undefined`**.
* `useColorMode()` returns `undefined`.
* `hasExplicitColorMode` is `false`.
* The portaled surface emits neither `data-layer` nor `data-panda-theme`.
* The overlay falls back to light mode, even though the surrounding document is dark!

#### Edge Case B: Standalone `<Portal>` Usage
[`Portal.tsx`](file:///Users/ryn/Developer/reference-ui/packages/reference-lib/src/components/Portal/Portal.tsx) is a public component in `@reference-ui/lib`. If an engineer or downstream package writes:
```tsx
<Portal>
  <Div p="4r" bg="ui.dialog.background">Custom Floating Widget</Div>
</Portal>
```
Because they used `<Portal>` directly rather than `<OverlayPortaledSurface>`, the portaled `<Div>` will suffer from the exact same bug: `data-layer` is omitted and the widget renders in light mode.

#### Edge Case C: Indirect Coupling in `generate.ts`
The fact that `data-layer` emission is coupled to `hasExplicitColorMode` (`!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null`) is an indirect side-effect. `OverlayPortaledSurface` is effectively exploiting the fact that passing `colorMode` happens to also force `data-layer` emission. If someone ever refactors `generate.ts` to decouple `colorMode` from `dataLayerAttr`, the portal fix would silently break.

---

## 6. Hardening Recommendations for Production

To make overlay and portal theme inheritance 100% bomb-proof across any portal, any library, and any theme architecture:

### 1. Reset Layer Scope at the Portal Primitive Boundary
The cleanest architectural fix is to declare that **any portal is, by definition, a DOM boundary break**.
In `Portal.tsx`:
```tsx
import { LayerScopeContext } from '@reference-ui/core' // or via context bridge

export function Portal({ children, container }: PortalProps) {
  // Reset LayerScopeContext to false so that the first primitive rendered
  // inside the portal knows it MUST emit data-layer onto the DOM!
  return ReactDOM.createPortal(
    <LayerScopeContext.Provider value={false}>
      {children}
    </LayerScopeContext.Provider>,
    resolvedNode
  )
}
```
When `LayerScopeContext` is reset to `false` inside `createPortal`:
* The first primitive inside the portal automatically has `inheritsLayerScope = false`.
* `shouldEmitDataLayer` automatically becomes `true`.
* It re-establishes `data-layer` on the DOM without requiring an artificial `hasExplicitColorMode` trigger.

### 2. Fallback DOM Theme Sniffing
If `useColorMode()` returns `undefined` (because dark mode was set on `<html>` or `<body>` outside Reference UI), `OverlayPortaledSurface` should fall back to sniffing the host document's active theme:

```ts
function useResolvedColorMode(explicitMode?: string): string | undefined {
  const contextMode = useColorMode()
  if (explicitMode) return explicitMode
  if (contextMode) return contextMode

  // Fallback to DOM attribute on documentElement or body if running in browser
  if (typeof document !== 'undefined') {
    const domTheme = document.documentElement.getAttribute('data-panda-theme') 
      || document.body.getAttribute('data-panda-theme')
    if (domTheme) return domTheme
  }

  return undefined
}
```

### 3. Add Automated Matrix E2E Contract in `matrix/color-mode`
Add a dedicated Playwright test in `matrix/color-mode/tests/e2e/color-mode-contract.spec.ts`:
1. Mount an `<Overlay>` inside a container with `colorMode="dark"`.
2. Open the overlay.
3. Assert that `document.querySelector('[data-reference-overlay-content]')`:
   * Has computed background equal to `colors.gray.950` (dark dialog token).
   * Does NOT have `oklch(100% 0 0)` (light fallback).
   * Has both `data-layer` and `data-panda-theme="dark"` in the live DOM.

---

## 7. Summary Matrix

| Mechanism | Without `OverlayPortaledSurface` | With `OverlayPortaledSurface` (Current) | With Hardened Portal Boundary (Proposed) |
| :--- | :--- | :--- | :--- |
| **DOM Location** | `document.body` (outside `#root`) | `document.body` (outside `#root`) | `document.body` (outside `#root`) |
| **`data-layer` on Portal Root** | ❌ Omitted (`inheritsLayerScope=true`) | ✅ Emitted (via `hasExplicitColorMode`) | ✅ Emitted (via portal context boundary reset) |
| **`data-panda-theme` on Portal Root** | ❌ Omitted | ✅ Emitted (via `useColorMode()`) | ✅ Emitted (via `useResolvedColorMode()`) |
| **Visual Result in Dark Mode** | 💥 Bright white blowout | 🎯 Dark slate background | 🎯 Bomb-proof across all theme strategies |
| **Bare `<Portal>` Protection** | ❌ None | ❌ Fragile (requires manual wrapper) | ✅ Protected automatically |
