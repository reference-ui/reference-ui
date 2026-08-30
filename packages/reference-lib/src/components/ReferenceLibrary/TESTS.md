# ReferenceLibrary tests

No dedicated `reference-library.spec.ts` unless mount itself regresses. Proof is the systems it mounts.

## Owns

| Our case | Where it runs | Vendor |
| --- | --- | --- |
| Toaster at React root, no portal, no context | `toast.spec.ts` | sonner `<Toaster />` |
| `toast.show` before mount replays | `toast.spec.ts` | sonner “toast created before the Toaster mounts” |
| `announce()` live region | `toast.spec.ts` | radix/Spectrum live region |
| Tooltip skip-delay group (not a Provider) | `tooltip.spec.ts` | radix Provider `skipDelayDuration`; Aria `globalWarmedUp`; Zag `setGlobalId` |

## Not here

Layer stack, FocusLock, scroll lock — Overlay. A public `<Tooltip.Provider>` / OverlayProvider as a descendant contract.
