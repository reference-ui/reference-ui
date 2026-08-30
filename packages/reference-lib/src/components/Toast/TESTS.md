# Toast tests

Playwright: `matrix/lib/tests/e2e/toast.spec.ts`  
Page: `/toast`  
Requires `ReferenceLibrary` on the fixture root.

Toast is not Overlay. radix `e2e/toast.spec.ts` is mostly tab order / axe / announcement container — different product. **Sonner** is the queue reference.

## Unique to Toast

| Our case | Vendor |
| --- | --- |
| Show; disappears after duration | sonner `test/tests/basic.spec.ts` “toast is rendered and disappears after the default timeout” |
| Hover pauses; remaining time resumes (not full duration reset) | sonner “toast is not removed when hovered”; Base UI remaining-time store tests |
| `duration: false` / Infinity does not fire immediately | sonner “toast is not removed if duration is set to infinity” (`setTimeout(Infinity)` trap) |
| `toast.update(id)` same identity, new definition/content | sonner “show correct toast content when updating”; “should update toast content and duration after 3 seconds” |
| Reuse id of dismissed toast does not inherit old props | sonner “a new toast reusing the id of a dismissed toast does not inherit its props” |
| Recreate same id right after dismiss stays on screen (StrictMode race) | sonner “toast recreated right after being dismissed stays on screen”; `state.ts` rAF pending dismissals |
| Show before `ReferenceLibrary` mounts still appears | sonner “toast created before the Toaster mounts is still shown” |
| `toast.dismiss()` all; `toast.dismiss(id)` one | sonner dismiss-all / history trim (“dismissed toasts do not pile up”) |
| `limit` hides extras (pick hide-in-place; freeze-gate vs Zag queue-wait) | sonner `visibleToasts` |
| `announce()` / `announce:` option hits live region | radix toast announcement tests as **AT** contrast; Spectrum NVDA `aria-hidden` delay — steal caution, not API |
| Custom `render` (no success/error/loading variants) | sonner “render custom jsx”; **leave** “various toast types” success/error/promise chrome |

## Combined: Overlay

| Our case | Vendor |
| --- | --- |
| Timers pause while a **modal Overlay is the top layer** | **none** — our contract. Overlay is a fixture on this page, assertion stays here |
| Toast clicks do not dismiss Overlay; Overlay inert does not hide the toaster | Zag `trackDismissableBranch`; Spectrum `data-react-aria-top-layer` |

Do not add trap/inert to Toast. radix “should not interrupt natural tab order” is closer to our “not Overlay” than to a toast focus manager.

## Leave

Swipe-to-dismiss physics, promise helpers, toasterId multi-toaster, icon a11y, action-button layout CSS, radix toast reverse-tab-through-toasts unless we explicitly take that UX.

## Vitest

Queue merge, remaining-time math, StrictMode dismiss race — candidate for unit later. Playwright first for hover + Overlay pause.
