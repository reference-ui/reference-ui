# Popover tests

Playwright: `matrix/lib/tests/e2e/popover.spec.ts`  
Page: `/popover`

Layer-stack cases (Escape topmost, nested dismiss, extension overlay) are **Overlay’s**. Do not copy radix `popover.spec.ts` nest/extension tests here — they collapse into `Overlay/TESTS.md`. This spec is positioning, virtual anchors, hover-open, and Presence on anchored content.

## Unique to Popover

| Our case | Vendor |
| --- | --- |
| Flip when preferred side overflows | `vendor/floating-ui/packages/dom/test/functional/flip.test.ts` |
| Shift stays in view without detaching | `shift.test.ts`, `offset.test.ts` |
| Arrow padding / alignment | `arrow.test.ts` |
| `size` → available height; list content scrolls instead of overflowing | `size.test.ts` (Select/Combobox/Menu consume this on `Popover.Content`) |
| autoUpdate on scroll / resize / iframe / shadow / zoom | `autoUpdate.test.ts`, `scroll.test.ts`, `iframe.test.ts`, `shadow-dom.test.ts`, `zoom.test.ts`, `top-layer.test.ts` |
| Virtual anchor: point, rect, `getBoundingClientRect` | `virtual-element.test.ts` |
| Hide flags when reference clipped | `hide.test.ts` — policy (close vs hide) is product; prove flags exist |
| Presence: `open={false}` does not unmount until exit | Overlay Presence contract, anchored |
| Trigger is `button`; `anchor` wins for position when both present | our API |

## Hover (`openOnHover`) — HoverCard composition

| Our case | Vendor |
| --- | --- |
| Pointer can travel trigger → content without dismiss (grace / polygon) | Floating UI `packages/react/src/safePolygon.ts` + Base UI `safePolygon.test.ts`; Aria `useSafeArea.ts`. Radix HoverCard is delay-only — use as **contrast**, not the bar |
| Impatient click after hover-open does not immediately dismiss | Base UI `stickIfOpen` / PopoverTrigger “impatient clicks” |
| Open/close delays; leave cancels pending open | Zag hover-card / popover machines |

Interactive hover is this primitive. Tooltip is non-interactive (`Tooltip/TESTS.md`).

## Combined: nest with Overlay

Owned by Overlay. When this primitive exists, Overlay’s page gains:

- Non-modal popover in dialog, outside both → both close  
- Modal popover in dialog, outside popover → only popover closes  

radix `e2e/popover.spec.ts` both describes. Do not duplicate in this file.

## Triple composition

Filters popover (trigger + content), context-menu-style virtual `anchor` (no trigger), HoverCard (`openOnHover`).

## Not here

Floating UI React `useDismiss` / `FloatingTree` / `FloatingFocusManager` as a second runtime. Radix `e2e/popper.spec.ts` (we use Floating UI core). Full flip matrix PNG snapshots.
