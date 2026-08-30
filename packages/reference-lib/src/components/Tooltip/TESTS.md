# Tooltip tests

Playwright: `matrix/lib/tests/e2e/tooltip.spec.ts`  
Page: `/tooltip`

Not Overlay (no trap, no inert). Positioning engine is Popover’s — do not re-run the Floating UI flip matrix. Skip-delay group is mounted with ReferenceLibrary, not a Provider.

## Unique to Tooltip

| Our case | Vendor |
| --- | --- |
| Hover delay; focus-visible opens immediately; leave cancels pending open | radix `tooltip.tsx` delay; Aria `useTooltipTriggerState`; Zag tooltip machine `opening`/`closing` |
| After one tooltip, neighbour opens **instantly** within skip-delay window; only one visible | radix `skipDelayDuration`; Aria `globalWarmedUp`; Floating UI `FloatingDelayGroup`; Zag `setGlobalId` |
| Escape dismisses (WCAG 1.4.13) without moving pointer | radix DismissableLayer Escape; Aria `useTooltipTrigger` |
| Default content is non-interactive (no tab stops inside) | our split vs HoverCard |
| Close on scroll of trigger ancestors; ignore scroll inside input | radix tooltip capture scroll; Aria `useCloseOnScroll.ts`; Zag `closeOnScroll` |
| Pointer vs keyboard modality: hover only for pointer | Aria `getInteractionModality` |
| `aria-describedby` wired; generated id if omitted | our API; Slot on Trigger |
| Flip/shift/arrow **smoke** (one placement), not the full middleware suite | Popover / floating-ui functional |

## Combined

HoverCard / safe polygon → `Popover/TESTS.md` `openOnHover`. Provider API → do not add; group is ReferenceLibrary (`ReferenceLibrary/TESTS.md`).

## Not here

Interactive tooltip. Cursor-follow `trackCursorAxis` unless freeze needs it. Public `Tooltip.Provider`.
