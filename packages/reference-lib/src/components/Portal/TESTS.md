# Portal tests

Playwright: `matrix/lib/tests/e2e/portal.spec.ts`  
Page: `/portal`

Overlay/Popover portal internally; this spec is the primitive: destination, no wrapper, late container.

## Unique to Portal

| Our case | Vendor |
| --- | --- |
| Children appear under `document.body` by default; **no wrapper node** around children | radix Portal always wraps `Primitive.div` — we must **not** |
| `container={element}` / ref / function resolved after mount | radix accepts Element \| DocumentFragment only; ref/function are ours |
| SSR: first paint does not touch `document` | radix `mounted` gate |
| ShadowRoot as container | DocumentFragment subclass |
| React tree position preserved (context, hooks) while DOM moved | all portal impls |

## Combined

Overlay custom `Overlay.Portal container` is a composition on Overlay’s page, not a second Portal suite. Prove once here that Overlay can pass a container through.

## Not here

Stacking, focus, dismiss, modality — Overlay. Radix host-node `className` on a wrapper.
