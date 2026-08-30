# Slot tests

Vitest-first: merge rules do not need a browser (`TESTING.md`). Optional Playwright only if a composite (Tooltip.Trigger, RovingFocus.Item) regresses in DOM.

File: `matrix/lib` unit next to e2e later, or a vitest file under this package **only** for Slot — do not invent a unit suite to start Overlay.

## Unique to Slot

| Our case | Vendor |
| --- | --- |
| Child handler runs first; Slot handler skipped if `preventDefault()` | radix Slot **always** runs both — our contract **differs**; test the skip |
| Child native props win except class/style/handlers | radix Slot |
| `className` concat; `style` shallow merge, child wins per key | radix |
| Refs both called; callback identity stable | radix Presence #3664 class of bug |
| `aria-describedby` / `aria-labelledby` concat, child tokens first, dedupe | radix Slot |
| Single child; text / multiple children throw when active | radix Slottable |
| Nested Slot merges onto the deep element | radix nested Slottable |

## Combined

Tooltip.Trigger and RovingFocus.Item are Slot consumers — their e2e assume these rules. Failures there that are “click didn’t compose” belong here first.

## Not here

`as` / polymorphism. Making Reference UI primitives polymorphic via Slot.
