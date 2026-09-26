# Field patches

Mechanical follow-ups: fully specified, test-pinnable today. Sourced from
DECISIONS.md deferred candidates; each entry keeps its source pointer.

### 1. Nested-button focus exclusion (from DECISIONS candidate #1)

- What: Keyboard focus on a nested Button keeps its own ring and never sets Field `data-focus-visible` or the 2px bezel ring.
- Acceptance: Tab to clear/opener/chip button → computed outline stays on the button, Field `hasFocusVisible === false`, no bezel ring (`FI-CSS-06` + `FI-COMP-04` step 7 titles unchanged).
- Source: Quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`; blocked on theme-crew focus-propagation narrowing (re-derived cleanly, not ported).

### 2. Hosted DateField typing/publish sessions (from DECISIONS candidate #2)

- What: `fill('2026-10-15')` + Enter inside the bezel publishes ISO `onChange` with the bezel still wrapping input + trigger and the Calendar portalled.
- Acceptance: Hosted assertions re-added verbatim — `Value: 2026-10-15` published, wrap/trigger/portalled hold, plus a Range two-inputs-one-bezel hosted title (`FI-COMP-02`, `DF-COMP-05`).
- Source: Quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`; re-add when the DateField crew proves its session contract.

### 3. Hosted token-picker commit/remove flows (from DECISIONS candidate #3)

- What: Clicking option Bob fires one scalar Combobox `onChange` with chips updating and no Combobox token nodes; clicking chip Alice removes it with no Combobox `onChange`.
- Acceptance: Hosted assertions re-added verbatim (`FI-COMP-04` steps 8–9); landed Field-owned subset (label/embed/opener/chips/portal/invalid-bezel) keeps passing.
- Source: Quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`; re-add when the Combobox crew proves commit/remove semantics.
