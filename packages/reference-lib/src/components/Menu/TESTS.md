# Menu tests

Playwright: `matrix/lib/tests/e2e/menu.spec.ts`  
Page: `/menu`  
Chrome: Popover (dropdown) or virtual `anchor` (context menu). Menu does not own Overlay.

radix `dropdown-menu.spec.ts`, `context-menu.spec.ts`, and `menubar.spec.ts` repeat submenu pointer, typeahead scope, Escape, and extension-overlay. **Combine:** stack/dismiss → Overlay; submenu geometry + APG keyboard → here, once. Context menu is a composition on this page, not a second spec. Menubar is a documented composition (`RovingFocus` + Menu), not a freeze primitive — optional third composition, not a `menubar.spec.ts`.

## Unique to Menu

| Our case | Vendor |
| --- | --- |
| Pointer over submenu trigger opens submenu; does not focus first item | radix `dropdown-menu.spec.ts` “should open submenu and not focus first item when moving pointer over trigger” (copied in context-menu, menubar) |
| Pointer to submenu and back to parent trigger stays open | “should not close when moving pointer to submenu and back to parent trigger” |
| Pointer **away** closes; pointer **towards** stays (grace / intent polygon), including collision edge / RTL | “should close submenu when moving pointer away but remain open when moving towards”; Zag `intentPolygon`; Aria `useSafelyMouseToSubmenu` |
| Pointer to another parent item closes the submenu | “should close open submenu when moving pointer to any item in parent menu” |
| Click item or outside closes all menus | “should close all menus when clicking item in any menu, or clicking outside” |
| Keyboard: Right/Enter/Space opens submenu and focuses first item; Left closes only that submenu | radix keyboard describes |
| Escape closes submenu then parent (layer stack — assert here only the Menu-internal steps; Overlay owns dialog+menu Escape) | radix “should close all menus when pressing escape…” |
| Typeahead scoped to the **active** menu | “should scope typeahead behaviour to the active menu” (copied three times in radix — run once) |
| Space during typeahead does not activate / open submenu | Base UI `MenuRoot.test.tsx`; Aria `useTypeSelect` |
| RTL: Left opens submenu, Right closes | radix RTL describe |

## Combined: nest with Overlay

Owned by Overlay (`dismisses only the menu when clicking inside dialog outside menu` in radix dropdown/context/select). Extension overlay → Overlay. Do not copy those cases here.

## Triple composition

MenuButton (`button` + Popover + Menu), ContextMenu (virtual pointer `anchor` + Menu), nested submenu (at least one `Menu.Sub`).

## Not here

Menubar hover-between-triggers as a primitive. NavigationMenu. Zag/Base UI Menu-as-overlay runtime.
