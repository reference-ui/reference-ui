# Switch patches (mechanical)

Fully specified, test-pinnable-today items moved out of DECISIONS.md.
Likely-to-do; no product call needed before implementation.

### 1. Structural Thumb identity (from DECISIONS candidate #3)

- **What:** Detect authored `Switch.Thumb` structurally so Fragment-wrapped or forwarded thumbs replace the default instead of rendering a duplicate.
- **Acceptance:** `SW-DOM-04` shapes (bare, authored, Fragment-wrapped, forwarded) each render exactly one thumb; detection sees through at least one Fragment level; shipped source reads no `displayName` and ships no probing scaffolding (`Symbol.for`, `__referencePart`, fragment-walker).
- **Source:** quarantine commit `7bed212af` (`hasStructuralThumb` — mechanism rejected as recon exhibit 4, need kept) + SPEC.md freeze work-order item 3; case `SW-DOM-04`.
