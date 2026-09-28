# Listbox patches

Mechanical follow-ups from DECISIONS.md: fully specified, test-pinnable today. No product/UX/API decisions needed — take and implement.

### 1. Wire `validateVirtualAdapter` into registration (from DECISIONS candidate #2)

- **What:** Registration calls the existing exported validator on `virtual.items` change and on indexed Option mount; an invalid mapping emits the existing descriptive diagnostic.
- **Acceptance:** `LB-VIRT-09`-style test: invalid adapter mapping emits the descriptive diagnostic, valid adapters register silently, 29-case in-dir suite stays green.
- **Source:** DECISIONS.md candidate §2; `Listbox.tsx` `validateVirtualAdapter` (line 65, zero call sites); case IDs `LB-VIRT-01`, `LB-VIRT-09`.
- **Status (finish-line P2A 2026-09-28):** DONE — verified wired at indexed Option registration (against the live adapter ref) and in the `virtual.items`-change effect; atomic replacement also clears a stale pending target. Proof: `LB-VIRT-09` unit ×2 + CT (replace/break/fix); full suite green.

### 2. Strengthen duplicate detection to same-pass re-registration (from DECISIONS candidate #3)

- **What:** Any same-pass re-registration of an already-registered value throws the descriptive identity error naming the value, even when derived ids collide.
- **Acceptance:** Test: render two same-value options with colliding derived ids → throws naming the value; colocated `Listbox.test.ts` semantics extended; suite green.
- **Source:** DECISIONS.md candidate §3; `Listbox.tsx` option registry; case ID `LB-DOM-06`.
- **Status (finish-line P2A 2026-09-28):** DONE — verified two-layer: render-time `registerRenderValue` (distinct ids) plus commit-time `registerOption` (same-value re-registration incl. colliding derived ids, StrictMode-safe via cleanup). Proof: `LB-DOM-06` unit + `LB-DYNAMIC-05` CT (collide → descriptive error); full suite green.
