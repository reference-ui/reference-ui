# Announcer patches (mechanical, test-pinnable)

Source: `DECISIONS.md` OPEN/DEFERRED items fully specified today. Likely-to-do — each entry carries its proof.

### 1. Drop `data-testid` aliases (from DECISIONS candidate #3)

- **What:** remove both `data-testid` attributes; `data-reference-announcer="polite" | "assertive"` becomes the only selector.
- **Acceptance:** Toast, ReferenceLibrary, and matrix tests assert contract selectors only; `ANN-DOM-05` migration assertion retired; no `data-testid` in Announcer host output.
- **Source:** quarantine `a19418ed3` `Announcer.tsx`; case `ANN-DOM-05`; trigger: all consumers on contract selectors.

### 2. Dev-gated, deduped ambiguous-call diagnostic (from DECISIONS gap #4)

- **What:** gate `announcerDiagnostic` on `NODE_ENV !== 'production'` via the `globalThis` pattern and warn once per message shape, not once per call.
- **Acceptance:** zero warnings on ambiguous untargeted calls in production; exactly one dev warning for repeated same-shape calls (`ANN-API-05` "one development diagnostic"; `RL-ROOT-08` audit).
- **Source:** landed `Announcer.tsx:49-56`; SPEC freeze; sibling `Toast/toastRuntime.ts:116-120`.
