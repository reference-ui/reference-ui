# Portal Color Mode Protocol

**Type**: Architecture contract. Documentation only.  
**Owner**: `Portal` in `@reference-ui/lib`, backed by the primitive compiler in `@reference-ui/neo`.  
**Scope**: `@reference-ui/lib` (Portal surfaces). Overlay is a consumer of Portal, not the place the contract is enforced.  
**Canonical attribute**: `data-color-mode` (Neo `DATA_COLOR_MODE_ATTR`, `packages/reference-rs/modules/primitives/js/context.ts:17`). Retired attribute names are never emitted or read.

---

## 0. Decision

Portaled surfaces losing theme is **a Portal problem**. Fixing Portal, together with the primitive compiler that already exists, must fix Overlay, Popover, Tooltip, Dialog, Drawer, Menu, and any future floating surface that teleports.

No component may grow its own color-mode portal bridge, DOM sniffer, or `'dark'` fallback. Those are workarounds, and they are not part of the design.

Each surface must leave Overlay with *less* theme code, not more.

```
App / Book root
  colorMode="light" | "dark"     ──▶  ColorModeContext (React, logical)
  data-color-mode="…" on <html> ──▶  document fallback (DOM, physical)

Portal
  LayerScopeContext = false      ──▶  physical DOM break (implemented)

First primitive inside the portal
  emits data-layer + data-color-mode on the teleported node
  CSS tokens resolve.
```

---

## 1. The physical DOM and the React tree

React portals preserve the **fiber tree** and therefore React context. They do not preserve the **physical DOM ancestor chain**.

Reference UI tokens are physical. The portable stylesheet scopes semantic variables to (`packages/reference-rs/modules/atomic/src/stylesheet/system_layers/scope.rs:44-58`):

```css
[data-layer="<system>"], [data-layer="<system>"][data-color-mode="light"] { … }
[data-layer="<system>"][data-color-mode="dark"] { … }
```

The bare `[data-layer]` selector is the light base, and each mode selector is more specific, so a host that carries a resolved mode takes that mode's values. Every primitive host carries the mode it resolved (`packages/reference-rs/modules/primitives/js/factory.ts:62`). A host with no resolved mode keeps the light base and does not inherit a dark ancestor's values, because no `:not([data-color-mode])` rewrite is emitted. A standalone system prints `:root, [data-color-mode=light]` and `[data-color-mode=dark]` (`scope.rs:44-49`). A node on `document.body` with neither attribute matches `:root` and renders white-on-white (or white-on-dark).

Two React contexts model the two trees:

| Context | Meaning | Crosses a portal? | Must be true on the physical node? |
| :--- | :--- | :---: | :---: |
| `ColorModeContext` | Logical theme of this React subtree | Yes | Yes — reflected as `data-color-mode` |
| `LayerScopeContext` | "An ancestor *in the DOM* already emitted `data-layer`" | Yes, unless Portal resets it | Yes — reflected as `data-layer` |

The failure mode: Portal teleports the DOM but leaves `LayerScopeContext === true`. The first primitive inside the portal then believes it is still under a `data-layer` ancestor, omits the attribute, and its tokens fall through to `:root`.

That is a Portal invariant. Overlay cannot be the owner.

---

## 2. Existing machinery

The compiler and Portal implement the protocol. The machinery is the only path: Overlay-side patches that duplicate it are not used.

### 2.1 Primitive runtime (`@reference-ui/neo`)

Every HTML primitive resolves context through `usePrimitiveContext(colorMode, variant, layerName)` (`packages/reference-rs/modules/primitives/js/context.ts:182`):

1. `inheritedColorMode = ColorModeContext ?? readDocumentColorMode(doc)` (`:192`), where `doc` comes from `DocumentContext` (`:189`).
2. Emits `data-layer` when `shouldEmitLayerScope` is true (`:95-105`): a `layerName` is set, and either no ancestor scope is in effect (`hasLayerScope`, `:78`), the ancestor scope belongs to another system (`isSameSystemScope`, `:86`), or the same system is in effect and a color mode is explicit or not inherited (`hasExplicitColorMode || inheritedColorMode == null`).
3. Emits `data-color-mode` via `resolveColorModeAttr` whenever a mode resolves (`:145`, `DATA_COLOR_MODE_ATTR = 'data-color-mode'`, `:17`). The reader consults `documentElement` and then `body` of the target document (`:119-123`, with `modeAttrOf` at `:130-132`) and honors no aliases.
4. The generated factory re-provides `LayerScopeContext` and `ColorModeContext` to descendants (`packages/reference-rs/modules/primitives/js/factory.ts:53-56`).

Unit proofs:

- `context.test.ts`: the `resolvePrimitiveContext` truth table (first stamp, inherit without restamp, restamp on explicit mode, variant, no-name silence).
- `Portal.test.tsx`: DOM emission, including the document fallback (`data-color-mode` on the teleported node, and the `documentElement` stamp with no React context).

`useColorMode()` is a public read of the same context-or-document resolution. It is not a second theme system.

### 2.2 Portal (`@reference-ui/lib`)

`packages/reference-lib/src/components/Portal/Portal.tsx` gates the mount and the destination (`hooks/use-destination.ts`) and makes one `createPortal` call around `PortalScope` (`Portal.tsx:22`). The reset lives in `packages/reference-lib/src/components/Portal/scope/PortalScope.tsx:25-29`:

```tsx
<LayerScopeContext.Provider value={false}>
  <DocumentContext.Provider value={destinationDocument(node)}>
    {children}
  </DocumentContext.Provider>
</LayerScopeContext.Provider>
```

`destinationDocument` returns the node itself when it is a `Document`, otherwise its `ownerDocument` (`Portal/destination/resolve.ts:47-52`). Portal reads no color mode: it never resolves, sniffs or defaults one. Portal **renders no host node** (`Portal.md`; `PortalScope` renders only its two providers). Theme restoration happens on the first *primitive* child, not on a Portal wrapper.

`Portal.test.tsx` covers the unit behavior, and `Portal.ct.spec.ts` carries `PT-THEME-01`–`06` in Playwright:

- Bare `<Portal><Div/></Portal>` inside an active layer, with `ColorModeContext="dark"`, emits `data-layer` **and** `data-color-mode="dark"` on the teleported node.
- Nested primitives inside that portal omit extra `data-layer` and keep `data-color-mode`.
- A standalone primitive with no React context reads `data-color-mode` from `document.documentElement`.

If those tests pass and Overlay still needs a private surface, Overlay is compensating for something Portal should own, or Overlay is wrapping a non-primitive host that skips the compiler.

### 2.3 Color-mode contract (Neo cases)

The in-tree contract for **non-portaled** islands lives in Neo cases: `NEO-PRIM-07` (`colorMode` prop stamps, and nested islands repaint), `NEO-COND-04` (`_dark` / `_light` flip with the attribute), `NEO-TOKEN-05` (sheet islands), and `NEO-PRIM-14` (portaled island). Portal must not fork that contract. Portal only re-establishes it after teleportation.

### 2.4 Overlay as a consumer

Overlay, Popover, and Tooltip portal through `Portal`. Dialog, Drawer, and Menu are Overlay compositions. Toast mounts in-tree under `ReferenceLibrary`, not through a Portal, so its host follows the color mode only when `ReferenceLibrary` sits inside the app's `colorMode` root ([ReferenceLibrary.md](../ReferenceLibrary/ReferenceLibrary.md)). If it portals later, it inherits this protocol.

Overlay's job is to keep using `Portal`. It must not resolve theme.

### 2.5 Current implementation

| Location | What it does |
| :--- | :--- |
| `Portal/scope/PortalScope.tsx` | Resets `LayerScopeContext` to `false` and propagates `DocumentContext` (`:25-29`). This is the contract. |
| `readDocumentColorMode()` | Reads only `DATA_COLOR_MODE_ATTR`, on `documentElement` and then `body` of the target document (`packages/reference-rs/modules/primitives/js/context.ts:119-123`). |
| `overlay-portal-surface.tsx` | Removed. No references remain, and the five-tier cascade went with it. |
| `parts/Backdrop.tsx`, `parts/Content.tsx` | `Div` primitives (`parts/Backdrop.tsx:50`, `parts/Content.tsx:111`), each portalled through `Portal` (`parts/Backdrop.tsx:104`, `parts/Content.tsx:146`). Presence and FocusLock wrap a primitive. |
| `book/decorator/BookDecorator.tsx` | Stamps `data-color-mode` on `<html>` (`:19`) and passes `colorMode={theme}` on its shell and story layouts (`:26`, `:45`), mounting `ReferenceLibrary` inside that root. |
| `Overlay.md` | Its Portal section cites this protocol. |

Overlay sets no `colorMode` internally; an authored `colorMode` on Content passes through as an island. Passing an explicit `colorMode` to a `Div` triggers `hasExplicitColorMode` in `shouldEmitLayerScope`, which re-emits `data-layer` even when Portal did not reset scope. That coupling is accidental, so Overlay must not rely on it. Portal's `LayerScopeContext = false` is the direct signal. After that, a primitive with inherited `ColorModeContext` emits both attributes (see the portal cases in `Portal.test.tsx`).

**Light is a mode. Absence is not light.** Absence means fall through to `:root`, the document, or `undefined`. The docs theme is typed `'light' | 'dark'`, with no light-to-`undefined` coercion (`DocsThemeContext.tsx`; `DocLayout` passes `colorMode={colorMode}`).

---

## 3. Context rules

### Law 1 — One physical attribute

The only color-mode DOM attribute is `data-color-mode` (`DATA_COLOR_MODE_ATTR`, Neo `packages/reference-rs/modules/primitives/js/context.ts:17`).

The Neo engine emits `[data-color-mode]` selectors in sheets (`NEO-TOKEN-05`) and stamps the same attribute on primitives (`NEO-PRIM-07`). The Panda-era name is retired: it is never emitted and never read (`NEO-PARITY-04` pins its absence from the generated folder; `NEO-PRIM-14` pins zero occurrences around the portal island). `data-theme` is Toast chrome only, never color mode. Readers honor no aliases; writers emit one name.

### Law 2 — One logical context, provided by primitives

`ColorModeContext` is private, and every generated primitive provides it. Applications **must not** be required to wrap trees in a public `ColorModeProvider` (library Law 3: zero public providers).

The app, Book, and docs root is a primitive with an **explicit** `colorMode`:

```tsx
<Div colorMode={theme}>{children}</Div>  // theme is 'light' | 'dark', never undefined
```

That stamps `data-color-mode` on the root and fills `ColorModeContext` for the whole fiber tree, including portaled descendants.

### Law 3 — Portal is the only DOM-boundary primitive

On every `createPortal`:

1. Reset `LayerScopeContext` to `false`.
2. Propagate the destination document via `DocumentContext`.
3. Do not emit a wrapper node.
4. Do not resolve, sniff, or default color mode. Color mode is already in `ColorModeContext` or on the destination document.
5. Do not special-case Overlay.

The first primitive rendered as a portal child is then outside layer scope, inherits color mode, and emits `data-layer` and `data-color-mode`. Nested primitives inside that portal inherit layer scope again and stay lean.

### Law 4 — Resolution order (strict, no invented default)

```
explicit colorMode prop
  ?? ColorModeContext
  ?? readDocumentColorMode(destination ownerDocument)
  ?? undefined
```

`undefined` means "do not stamp `data-color-mode`". It must **not** become `'dark'` or `'light'`. A missing stamp is a test failure, not a value to guess.

`readDocumentColorMode` is a last-resort for hosts that toggle theme on `<html>` without a Reference primitive root. It is not Overlay's job.

### Law 5 — Destination document, not global `document`

When a portal target is an iframe element, a ShadowRoot, or another owner document, document reads use `resolvedNode.ownerDocument` (or the shadow host's document), never a hardcoded global `document`. `readDocumentColorMode(doc?)` takes the document, `DocumentContext` carries it, and Portal provides the destination document (`packages/reference-rs/modules/primitives/js/context.ts:56-59,119`).

### Law 6 — Theme changes are React state

Live overlay plus theme toggle works because the root primitive's `colorMode` changes, `ColorModeContext` updates, and portaled children re-render. Book does this through `BookShell` → `BookDecorator` (`packages/reference-lib/book/app/BookShell.tsx:116`).

Do **not** add a `MutationObserver` on `<html>` as the primary mechanism. Observers are a last resort for foreign hosts that mutate attributes with no React state. They are out of scope until a real consumer proves React-driven theme is impossible.

### Law 7 — Islands travel with the fiber tree

A dark card (`<Div colorMode="dark">`) that contains an Overlay: the Overlay's React tree sits under that island, so `ColorModeContext` is `'dark'` at the Portal call site. After teleportation the first primitive still sees `'dark'`. No `anchor.closest()` walk is involved.

If a consumer places `<Overlay>` *outside* the island and only the trigger is inside, the overlay follows the Overlay's ancestors, not the trigger's DOM. That is the composition model. Geometry may follow the trigger; theme follows the Overlay fiber.

---

## 4. Component ownership

| Surface | Uses Portal? | Color-mode work allowed |
| :--- | :---: | :--- |
| `Portal` | — | Reset `LayerScopeContext`, propagate `DocumentContext`. Nothing else. |
| Generated primitives | n/a | Emit `data-layer` / `data-color-mode` from `usePrimitiveContext`. Document fallback via `readDocumentColorMode(ownerDocument)`. |
| `Overlay` Backdrop / Content | Yes | Host `Div`. Pass through user `colorMode` if authored (island). No sniffers. |
| `Popover` / `Tooltip` / Dialog / Drawer / Menu | Via `Overlay.Portal` | None. |
| `Toast` | Not today | None. Its host sits under `ReferenceLibrary`, so mount that inside the app's `colorMode` root. If it later portals, use `Portal`. |
| `FocusLock` / `Presence` | Wrap Overlay hosts | Remain wrapper-free / cloneElement. Must not insert a non-primitive host above the first themed primitive in a way that blocks the Portal reset. |
| Book / Docs | App roots | Explicit `colorMode={'light' \| 'dark'}` on the root primitive. Book also stamps `data-color-mode` on `<html>`; Docs does not stamp `<html>`. |
| Neo island cases | In-tree and portaled | `NEO-PRIM-07` / `COND-04` / `TOKEN-05` keep the CSS island contract; `NEO-PRIM-14` is the portaled case. Overlay tests are not the source of truth. |

---

## 5. Forbidden patterns

Do not reintroduce these, and do not replace them with equivalent workarounds in another file.

- `OverlayPortaledSurface` or any Overlay-local theme wrapper.
- Defaulting an unresolved mode to `'dark'` or `'light'`. It hides a missing `colorMode="light"`, and the tokens are light-first.
- DOM walks for theme, such as `el.closest('[data-color-mode], [data-theme]')`.
- A second attribute name. Book stamps only `data-color-mode`, `readDocumentColorMode` reads only `DATA_COLOR_MODE_ATTR`, and Neo has no aliases.
- `colorMode={isDark ? 'dark' : undefined}`. The standing rule covers any future form of it.
- A public `<ColorModeProvider>`. It violates library Law 3.
- A Portal host `Div`, or a Radix-style wrapper, added so attributes can be placed on it.

`Portal`'s `LayerScopeContext` reset and primitive `usePrimitiveContext` are the machinery to keep. `OV-THEME-01` is a *consumer* proof, not Overlay-owned machinery.

---

## 6. Constraints and edge cases

### 6.1 First child of a portal must be a primitive

If a portal's first host is a raw `<div>`, a text fragment, or a non-primitive wrapper, `data-layer` does not emit until a primitive appears. Overlay is safe because Backdrop and Content are primitives. Presence and FocusLock clone or wrap *the primitive*, and never insert a foreign node above it.

Bare `<Portal>{children}</Portal>` is supported for app content. The contract is that **the first token-using node must be a Reference primitive**. This is documented in `Portal.md`. Portal does not add a wrapper to work around it.

### 6.2 Owner document

`readDocumentColorMode(doc?: Document | null)` takes the document, `DocumentContext` carries it through the tree, and Portal provides the destination document (`packages/reference-rs/modules/primitives/js/context.ts:56-59,119`). The global `document` is only the fallback when no document is provided, which is correct for same-origin iframes. The reader is designed once, in Neo.

### 6.3 Nested portals

Each Portal resets layer scope. A nested overlay (modal, then popover, then menu) re-emits `data-layer` on each teleported root and inherits `ColorModeContext` from the parent overlay's primitives. Nested overlays must not re-query the document, so they cannot override an island. This is a test requirement, not a separate resolver.

### 6.4 Shadow roots

Portal accepts a ShadowRoot as `container` (`PT-DOM-05`). Theme attributes on the portaled primitive are sufficient when the portable stylesheet is adopted into that root. Stylesheet adoption is a host concern. Color mode resolves as elsewhere: `ColorModeContext` wins, and with no context the fallback reads `data-color-mode` from the host document's `<html>` or `<body>`, never from anything inside the shadow tree.

### 6.5 Live toggle without React

Live toggling without React state is not supported. The app contract is to stamp `data-color-mode` and set `colorMode` on a Reference root.

---

## 7. Proof

Theme proofs live with Portal and the Neo island cases, not with Overlay:

| ID | Claim |
| :--- | :--- |
| `PT-THEME-01` | Bare Portal + `ColorModeContext` + first primitive emits `data-layer` and `data-color-mode`. (`Portal.ct.spec.ts`; unit twin in `Portal.test.tsx`.) |
| `PT-THEME-02` | Same in light mode. Computed token background is light, text is dark. No `'dark'` default. |
| `PT-THEME-03` | Nested Portal under a dark overlay inherits dark from context, re-emits `data-layer` on the inner root, and does not consult `<html>` when context is set. |
| `PT-THEME-04` | Document-only `data-color-mode` on `ownerDocument.documentElement`, with no React context: the first primitive still stamps, and tokens resolve. |
| `PT-THEME-05` | Island: light app, `colorMode="dark"` ancestor. An Overlay or Popover opened from inside the island is dark. (Story fixture in `Portal.story.tsx`.) |
| `PT-THEME-06` | Theme toggle on the Book or app root while an overlay is open updates the portaled surface without a remount. |
| `OV-THEME-01/02` | Overlay consumer proofs (dark anchored dialog, and light). |
| `NEO-PRIM-14` | The portaled island case at the engine level (second-root shape, zero retired-attribute pin). Overlay internals are not duplicated here. |

Contrast assertions: not `rgb(255, 255, 255)` when dark. WCAG 4.5:1 on portaled text is optional and not yet asserted.

Docs: `Portal.md` documents the theme and layer scope: reset layer, no wrapper, first child primitive, and the canonical attribute.

---

## 8. Manual checks in the Book

These complement the proof matrix. They do not replace it.

- [ ] Dark Book theme: dialog, popover, tooltip, and nested cascade share dark surfaces and light text.
- [ ] Light Book theme: the same surfaces are light, and the text is dark. No white-on-white.
- [ ] Toggle the Book theme while a dialog is open: the portaled surface follows without a reopen.
- [ ] Dark island inside a light page: a popover from the island is dark.
- [ ] Bare `<Portal><Div bg="ui.dialog.background">` in a Book fixture matches the Overlay result.
- [ ] Grep the repo: zero `OverlayPortaledSurface`, zero `?? 'dark'` theme fallbacks, and zero retired-attribute writes from Reference packages.

---

## 9. Non-goals

- A Portal host `Div`, or a Radix-style wrapper, "so we can put attributes on it".
- A public theme provider.
- Overlay, Popover, or Tooltip color-mode props beyond the primitive `colorMode` already on every part.
- Guessing a default mode when context and document are empty.
- Observing `prefers-color-scheme` inside Portal. That belongs at the app root, which then sets `colorMode` and `data-color-mode`.
