# Portal Color Mode Protocol

**Status**: Living architecture contract. Documentation only — this file is the roadmap, not an implementation log.  
**Cutover (2026-09-23)**: D1 retargeted the canonical attribute to `data-color-mode` (Neo `DATA_COLOR_MODE_ATTR`, `packages/reference-neo/src/primitives/runtime/context.ts:14`); every retired-attribute mention below was rewritten to it. Items marked ✅ are verified landed; the rest stand.  
**Owner**: `Portal` in `@reference-ui/lib`, backed by the primitive compiler in `@reference-ui/neo`.  
**Scope**: `@reference-ui/lib` (Portal surfaces).  
**Predecessor forensics**: [`OVERLAY_THEME.md`](../ARCHIVE/OVERLAY_THEME.md) (symptom analysis). This document supersedes that file’s *recommendations*. Overlay is a consumer of Portal, not the place the contract is enforced.

---

## 0. Decision

Portaled surfaces losing theme is **a Portal problem**. Fixing Portal, together with the primitive compiler that already exists, must fix Overlay, Popover, Tooltip, Dialog, Drawer, Menu, and any future floating surface that teleports.

No component may grow its own color-mode portal bridge, DOM sniffer, or `'dark'` fallback. Those are workarounds. They are scheduled for deletion.

```
App / Book root
  colorMode="light" | "dark"     ──▶  ColorModeContext (React, logical)
  data-color-mode="…" on <html> ──▶  document fallback (DOM, physical)

Portal
  LayerScopeContext = false      ──▶  physical DOM break (already implemented)

First primitive inside the portal
  emits data-layer + data-color-mode on the teleported node
  CSS tokens resolve. Done.
```

---

## 1. Why this failed

React portals preserve the **fiber tree** and therefore React context. They do not preserve the **physical DOM ancestor chain**.

Reference UI tokens are physical. The portable stylesheet scopes semantic variables to:

```css
[data-layer="<system>"][data-color-mode="dark"] { … }
[data-layer="<system>"][data-color-mode="light"] { … }
:where(:root, :host) { /* light-first fallback */ }
```

Unthemed layer descendants are rewritten as `[data-layer]:not([data-color-mode])` so they inherit the nearest *physical* theme ancestor. A node on `document.body` with neither attribute matches `:root` and blows out to white-on-white (or white-on-dark).

Two React contexts already model the two trees:

| Context | Meaning | Crosses a portal? | Must be true on the physical node? |
| :--- | :--- | :---: | :---: |
| `ColorModeContext` | Logical theme of this React subtree | Yes | Yes — reflected as `data-color-mode` |
| `LayerScopeContext` | “An ancestor *in the DOM* already emitted `data-layer`” | Yes, unless Portal resets it | Yes — reflected as `data-layer` |

The original bug: Portal teleported DOM but left `LayerScopeContext === true`. The first primitive inside the portal believed it was still under a `data-layer` ancestor, omitted the attribute, and tokens fell through to `:root`.

That is a Portal invariant. Overlay cannot be the owner.

---

## 2. Machinery that already exists (do not re-invent)

This is not a greenfield. The compiler and Portal already implement most of the protocol. Hardening means **using that machinery as the only path**, then deleting the Overlay-side patches that duplicate it.

### 2.1 Primitive runtime (`@reference-ui/neo`)

Every HTML primitive resolves context through `usePrimitiveContext(colorMode, variant, layerName)` (`packages/reference-neo/src/primitives/runtime/context.ts:142`):

1. `inheritedColorMode = ColorModeContext ?? readDocumentColorMode(doc)` (`:152`), where `doc` comes from `DocumentContext` (`:149`).
2. Emits `data-layer` when `shouldEmitLayerScope` is true (`:67`): a `layerName` is set and `!inheritsLayerScope || hasExplicitColorMode || inheritedColorMode == null`.
3. Emits `data-color-mode` via `resolveColorModeAttr` whenever a mode resolves (`:105`, `DATA_COLOR_MODE_ATTR = 'data-color-mode'`, `:14`). The reader consults `documentElement` then `body` of the target document and honors no aliases (`:84-92`).
4. The generated factory re-provides `LayerScopeContext` and `ColorModeContext` to descendants (`factory.ts:53-56`).

Unit proofs already exist:

- `context.test.ts` — `resolvePrimitiveContext` truth table (first-stamp, inherit-without-restamp, restamp-on-explicit-mode, variant, no-name silence).
- `Portal.test.tsx` — DOM emission incl. the document fallback (`data-color-mode` on the teleported node, `documentElement` stamp with no React context).

`useColorMode()` is a public read of the same context-or-document resolution. It is not a second theme system.

### 2.2 Portal (`@reference-ui/lib`)

`packages/reference-lib/src/components/Portal/Portal.tsx` already wraps `createPortal` in:

```tsx
<LayerScopeContext.Provider value={false}>
  {children}
</LayerScopeContext.Provider>
```

Portal **renders no host node** (`Portal.md`). That stays. Theme restoration must happen on the first *primitive* child, not on a Portal wrapper.

`Portal.test.tsx` already proves the intended end state (unit), and `Portal.ct.spec.ts` carries `PT-THEME-01`–`06` in Playwright:

- Bare `<Portal><Div/></Portal>` inside an active layer + `ColorModeContext="dark"` emits `data-layer` **and** `data-color-mode="dark"` on the teleported node.
- Nested primitives inside that portal omit extra `data-layer` (no bloat) and keep `data-color-mode`.
- A standalone primitive with no React context reads `data-color-mode` from `document.documentElement`.

If those tests pass and Overlay still needs a private surface, Overlay is compensating for something Portal should own — or Overlay is wrapping a non-primitive host that skips the compiler.

### 2.3 Color-mode contract (Neo cases)

The in-tree contract for **non-portaled** islands lives in Neo cases (the `matrix/color-mode` suite was retired with the Obj-2 cutover): `NEO-PRIM-07` (`colorMode` prop stamps + nested islands repaint), `NEO-COND-04` (`_dark`/`_light` flip with the attribute), `NEO-TOKEN-05` (sheet islands), and `NEO-PRIM-14` (portaled island, re-targeted off the retired suite). Portal hardening must not fork that contract. Portal only re-establishes it after teleportation.

### 2.4 Overlay as a consumer

Overlay, Popover, Tooltip already portal through `Portal`. Dialog / Drawer / Menu are Overlay compositions. Toast currently mounts in-tree under `ReferenceLibrary` (not a Portal); if it later portals, it must get this protocol for free.

Overlay’s only remaining job is to keep using `Portal`. It must not resolve theme.

---

## 3. First pass vs protocol

A first pass already landed to stop the white-on-white blowout in Book. It is **accepted as a temporary patch**, not as architecture.

### 3.1 What landed

| Location | What it does | Protocol verdict |
| :--- | :--- | :--- |
| `Portal.tsx` | Reset `LayerScopeContext` to `false` (+ propagate `DocumentContext`) | **Keep.** This is the contract. |
| `readDocumentColorMode()` | ✅ Canonical — reads only `DATA_COLOR_MODE_ATTR` on `documentElement` then `body` of the target document (`context.ts:84-92`). No aliases ever landed in Neo. | Done. |
| `overlay-portal-surface.tsx` | ✅ Deleted — zero hits repo-wide. 5-tier cascade is gone with it. | Done. |
| `Overlay.tsx` Backdrop / Content | ✅ Back on `Div` (`parts/Backdrop.tsx:37`, `parts/Content.tsx:152`). Presence / FocusLock wrap a primitive; that is enough. | Done. |
| `book/decorator/BookDecorator.tsx` | ✅ Single-stamp — `data-color-mode` on `<html>` + `colorMode={theme}` for both modes (`:19`, `:27`). | Done. |
| `Overlay.md` / `OVERLAYS.md` | `Overlay.md` §Portal cites this protocol ✅. `OVERLAYS.md` §3.3 row still names the retired attribute — flagged for the lib-docs owner (package docs, out of `docs/` scope). | Nearly done. |

### 3.2 Why `OverlayPortaledSurface` was a hack (✅ deleted)

Passing explicit `colorMode` to a `Div` trips `hasExplicitColorMode` in `shouldEmitLayerScope`, which re-emits `data-layer` even if Portal failed to reset scope. That coupling is accidental. `OVERLAY_THEME.md` already called this out: if the compiler ever decouples `colorMode` from `data-layer`, the Overlay patch silently dies.

Portal’s `LayerScopeContext = false` is the *direct* signal. After that, a normal primitive with inherited `ColorModeContext` already emits both attributes (`Portal.test.tsx` portal cases). Overlay does not need to re-pass `colorMode`.

The rest of the cascade papered over protocol violations, all verified gone (no `closest(` theme walks, no `'dark'` fallbacks in lib Overlay/Portal):

- `el.closest('[data-color-mode], [data-theme]')` — DOM archaeology instead of React context.
- Default `'dark'` — hides missing `colorMode="light"` at app/Book roots. Tokens are light-first; inventing dark as a missing-value default is the opposite of the stylesheet contract.
- Dual attribute names — two conventions instead of `DATA_COLOR_MODE_ATTR`.

### 3.3 The “light means undefined” trap (✅ closed)

Both legs verified fixed: `src/cosmos.decorator.tsx`, `cosmos.config.json`, and `cosmos/cosmos-shell.css` are all deleted, and the docs theme is typed `'light' | 'dark'` with no light-to-`undefined` coercion (`DocsThemeContext.tsx`, `DocLayout` passes `colorMode={colorMode}`).

The standing rule: light is a mode. Absence is not light. Absence is “fall through to `:root` / document / undefined”.

---

## 4. Canonical protocol

### Law 1 — One physical attribute

The only color-mode DOM attribute is `data-color-mode` (`DATA_COLOR_MODE_ATTR`, Neo `context.ts:14`).

The Neo engine emits `[data-color-mode]` selectors in sheets (`NEO-TOKEN-05`) and stamps the same attribute on primitives (`NEO-PRIM-07`). The Panda-era name is retired — never emitted, never read (`NEO-PARITY-04` pins its absence from the generated folder; `NEO-PRIM-14` pins zero occurrences around the portal island). `data-theme` is Toast chrome only, never color mode (D1). Readers honor no aliases; writers emit one name.

### Law 2 — One logical context, provided by primitives

`ColorModeContext` is private, provided by every generated primitive. Applications **must not** be required to wrap trees in a public `ColorModeProvider` (library Law 3: zero public providers).

The app/Book/docs root is a primitive with an **explicit** `colorMode`:

```tsx
<Div colorMode={theme}>{children}</Div>  // theme is 'light' | 'dark', never undefined
```

That stamps `data-color-mode` on the root and fills `ColorModeContext` for the whole fiber tree, including portaled descendants.

### Law 3 — Portal is the only DOM-boundary primitive

On every `createPortal`:

1. Reset `LayerScopeContext` to `false`. (Done.)
2. Propagate the destination document via `DocumentContext`. (Done — `Portal.tsx:104`.)
3. Do not emit a wrapper node. (Invariant.)
4. Do not resolve, sniff, or default color mode. Color mode is already in `ColorModeContext` or on the destination document.
5. Do not special-case Overlay.

The first primitive rendered as a portal child is then outside layer scope, inherits color mode, and emits `data-layer` + `data-color-mode`. Nested primitives inside that portal inherit layer scope again and stay lean.

### Law 4 — Resolution order (strict, no invented default)

```
explicit colorMode prop
  ?? ColorModeContext
  ?? readDocumentColorMode(destination ownerDocument)
  ?? undefined
```

`undefined` means “do not stamp `data-color-mode`”. It must **not** become `'dark'` or `'light'`. Missing stamps are a test failure, not a value to guess.

`readDocumentColorMode` is a last-resort for hosts that toggle theme on `<html>` without a Reference primitive root. It is not Overlay’s job.

### Law 5 — Destination document, not global `document`

When a portal target is an iframe element, ShadowRoot, or other owner document, document reads use `resolvedNode.ownerDocument` (or the shadow host’s document), never a hardcoded global `document`. (✅ Landed: `readDocumentColorMode(doc?)` takes the document, `DocumentContext` carries it, and Portal provides the destination document — `context.ts:46-49,84`, `Portal.tsx:104`.)

### Law 6 — Theme changes are React state

Live overlay + theme toggle must work because the root primitive’s `colorMode` changes, `ColorModeContext` updates, and portaled children re-render. Book already does this via `BookRenderer` → `BookDecorator`.

Do **not** add a `MutationObserver` on `<html>` as the primary mechanism. Observers are a last resort for foreign hosts that mutate attributes with no React state. They are out of scope until a real consumer proves React-driven theme is impossible.

### Law 7 — Islands travel with the fiber tree

A dark card (`<Div colorMode="dark">`) that contains an Overlay: Overlay’s React tree sits under that island, so `ColorModeContext` is `'dark'` at the Portal call site. After teleportation the first primitive still sees `'dark'`. No `anchor.closest()` walk.

If a consumer places `<Overlay>` *outside* the island and only the trigger is inside, the overlay correctly follows Overlay’s ancestors, not the trigger’s DOM. That is the composition model. Geometry may follow the trigger; theme follows the Overlay fiber.

---

## 5. Component ownership

| Surface | Uses Portal? | Color-mode work allowed |
| :--- | :---: | :--- |
| `Portal` | — | Reset `LayerScopeContext`, propagate `DocumentContext`. Nothing else. |
| Generated primitives | n/a | Emit `data-layer` / `data-color-mode` from `usePrimitiveContext`. Document fallback via `readDocumentColorMode(ownerDocument)`. |
| `Overlay` Backdrop / Content | Yes | Host `Div`. Pass through user `colorMode` if authored (island). No sniffers. |
| `Popover` / `Tooltip` / Dialog / Drawer / Menu | Via `Overlay.Portal` | None. |
| `Toast` | Not today | None. If it later portals, use `Portal`. |
| `FocusLock` / `Presence` | Wrap Overlay hosts | Remain wrapper-free / cloneElement. Must not insert a non-primitive host *above* the first themed primitive in a way that eats the Portal reset. |
| Book / Docs | App roots | Explicit `colorMode={'light' \| 'dark'}`; stamp only `data-color-mode` on `<html>`. |
| Neo island cases | In-tree + portaled | `NEO-PRIM-07` / `COND-04` / `TOKEN-05` keep the CSS island contract; `NEO-PRIM-14` is the portaled case. Do not fork Overlay tests as the source of truth. |

---

## 6. Deletion list (workarounds to remove)

Do not replace these with equivalent hacks in another file.

1. ✅ **Deleted** `overlay-portal-surface.tsx` and all `OverlayPortaledSurface` usage (zero hits repo-wide). Backdrop and Content are back on `Div`. User `colorMode` on Content still works as an island because it is a primitive prop.
2. ✅ **Stopped** defaulting unresolved mode to `'dark'` (none in lib Overlay/Portal).
3. ✅ **Stopped** `closest(…)` walks for theme (none in lib Overlay/Portal).
4. ✅ Book writes only `data-color-mode` (`BookDecorator.tsx:19`). No alias stamp remains.
5. ✅ `readDocumentColorMode` reads only `DATA_COLOR_MODE_ATTR` on `documentElement` then `body` of the relevant `Document` (`context.ts:84-92`). No aliases landed in Neo.
6. ✅ **Fixed** light-as-undefined (Cosmos decorator deleted; docs theme typed `'light' | 'dark'`). The standing rule covers any future `colorMode={isDark ? 'dark' : undefined}`.
7. **Rewrite** Overlay docs (`Overlay.md` Portal section ✅ cites this protocol; `OVERLAYS.md` §3.3 row still names the retired attribute — flagged for the lib-docs owner).
8. **Do not** introduce a public `<ColorModeProvider>`. The original draft of this file proposed one. It violates library Law 3.

Keep `Portal`’s `LayerScopeContext` reset. Keep primitive `usePrimitiveContext`. Keep `OV-THEME-01` as a *consumer* proof, not as Overlay-owned machinery.

---

## 7. Remaining gaps (protocol-sized, not Overlay-sized)

These are the only investigations that belong on the roadmap after deletions.

### 7.1 First child of a portal must be a primitive

If a portal’s first host is a raw `<div>`, a fragment of text, or a non-primitive wrapper, `data-layer` will not emit until a primitive appears. Overlay is safe if Backdrop/Content are primitives. Presence and FocusLock must keep cloning / wrapping *the primitive*, not inserting a foreign node above it.

Bare `<Portal>{children}</Portal>` is supported for app content; the contract is: **the first token-using node must be a Reference primitive**. Document that in `Portal.md`. Do not “fix” it with a Portal wrapper.

### 7.2 `readDocumentColorMode` owner document (✅ landed)

`readDocumentColorMode(doc?: Document | null)` takes the document, `DocumentContext` carries it through the tree, and Portal provides the destination document (`context.ts:46-49,84`, `Portal.tsx:104`). Global `document` is only the fallback when no document is provided — correct for same-origin iframes. Designed in Neo, once.

### 7.3 Nested portals

Each Portal resets layer scope. Nested Overlay (modal → popover → menu) re-emits `data-layer` on each teleported root and inherits `ColorModeContext` from the parent overlay’s primitives. After OverlayPortaledSurface is gone, confirm they do **not** re-query the document and clobber an island. This is a test, not a new resolver.

### 7.4 Shadow roots

Portal already accepts ShadowRoot as `container` (`PT-DOM-05`). Theme attributes on the portaled primitive are sufficient if the portable stylesheet is adopted into that root. Stylesheet adoption is a host problem; do not sniff the light-DOM `<html>` from inside a closed shadow as Overlay does today.

### 7.5 Live toggle without React

Out of scope until a consumer cannot put `colorMode` on a root primitive. Prefer documenting “stamp `data-color-mode` *and* set `colorMode` on a Reference root” as the app contract.

---

## 8. Roadmap

Implement in this order. Each phase must leave Overlay with *less* theme code, not more.

### Phase 0 — Freeze this protocol (this document)

No more Overlay-local theme patches. New floating components use `Portal` only.

### Phase 1 — Canonical roots (✅ landed)

- Book decorator passes `colorMode={theme}` for both modes and stamps only `data-color-mode`.
- Cosmos decorator deleted with the Cosmos removal.
- Docs layout never coerces light to `undefined` (typed `'light' | 'dark'`).
- `colorMode="light"` distinct from omitted `colorMode`: covered by `PT-THEME-02` (light mode, no dark default).

### Phase 2 — Delete Overlay workarounds (✅ landed)

- `OverlayPortaledSurface` removed.
- `Portal.test.tsx` covers bare Portal + inherited context.
- Overlay Backdrop/Content are `Div` primitives under Portal + Presence + FocusLock.
- `OV-THEME-01/02` recorded in `OVERLAYS.md:327` with Overlay setting no `colorMode` internally.

### Phase 3 — Canonical document reader (✅ landed)

- `readDocumentColorMode(doc?: Document | null)` reads only `DATA_COLOR_MODE_ATTR`.
- The destination document arrives via `DocumentContext` from Portal.
- No alias attributes ever landed in Neo — nothing to delete.
- `resolveColorModeAttr` is the only writer (sole owner of `DATA_COLOR_MODE_ATTR` in shipped code).

### Phase 4 — Proof matrix (✅ landed, Portal-owned)

Theme proofs live with Portal + the Neo island cases, not Overlay:

| ID | Claim |
| :--- | :--- |
| `PT-THEME-01` ✅ | Bare Portal + `ColorModeContext` + first primitive emits `data-layer` and `data-color-mode`. (`Portal.ct.spec.ts`; unit twin in `Portal.test.tsx`.) |
| `PT-THEME-02` ✅ | Same in light mode. Computed token background is light, text is dark. No `'dark'` default. |
| `PT-THEME-03` ✅ | Nested Portal under a dark overlay inherits dark from context, re-emits `data-layer` on the inner root, does not consult `<html>` if context is set. |
| `PT-THEME-04` ✅ | Document-only `data-color-mode` on `ownerDocument.documentElement`, no React context, first primitive still stamps and tokens resolve. |
| `PT-THEME-05` ✅ | Island: light app, `colorMode="dark"` ancestor, Overlay/Popover opened from inside the island is dark. (Story fixture in `Portal.story.tsx`.) |
| `PT-THEME-06` ✅ | Theme toggle on the Book/app root while overlay is open updates the portaled surface without remount. |
| `OV-THEME-01/02` ✅ | Overlay consumer proofs (dark anchored dialog + light), recorded in `OVERLAYS.md:327`. |
| `NEO-PRIM-14` ✅ | The portaled island case at the engine level (second-root shape, zero retired-attribute pin). Do not duplicate Overlay internals. |

Contrast assertions: not `rgb(255, 255, 255)` when dark; WCAG 4.5:1 on portaled text optional in a later a11y pass, not a blocker for Phase 4.

### Phase 5 — Docs & inventory

- `Portal.md`: add a “Theme and layer scope” section (reset layer, no wrapper, first child primitive, canonical attribute).
- `Portal/NEXT.md`: theme contract is a Portal milestone, not Overlay.
- Strike OverlayPortaledSurface from Overlay manufacturing docs.
- Leave [`OVERLAY_THEME.md`](../ARCHIVE/OVERLAY_THEME.md) as historical forensics; this file is the protocol.

No Phase for MutationObserver, public providers, or per-component theme wrappers.

---

## 9. Verification checklist

Manual / Book (after Phase 2, not as a substitute for Phase 4):

- [ ] Dark Book theme: dialog / popover / tooltip / nested cascade share dark surfaces and light text.
- [ ] Light Book theme: same surfaces are light, text is dark. No white-on-white.
- [ ] Toggle Book theme while a dialog is open: portaled surface follows without reopen.
- [ ] Dark island inside light page: popover from the island is dark.
- [ ] Bare `<Portal><Div bg="ui.dialog.background">` in a Book fixture matches the Overlay result.
- [x] After OverlayPortaledSurface deletion, grep the repo (2026-09-23): zero `OverlayPortaledSurface`, zero `?? 'dark'` theme fallbacks, zero retired-attribute writes from Reference packages. (Remaining retired-attribute hits: frozen ARCHIVE/EVIDENCE captures, Neo absence-pins, and package-doc mentions flagged for owners.)

---

## 10. Non-goals

- A Portal host `Div` or Radix-style wrapper “so we can put attributes on it”.
- A public theme provider.
- Overlay/Popover/Tooltip-specific color-mode props beyond the primitive `colorMode` already on every part.
- Guessing a default mode when context and document are empty.
- Observing `prefers-color-scheme` inside Portal. That belongs at the app root, which then sets `colorMode` + `data-color-mode`.
