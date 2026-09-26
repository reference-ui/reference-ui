# Slider patches — mechanical backlog

Every item below is fully specified: a test could pin it today. No API,
product, or naming call needed — implement and prove.

### 1. RTL/vertical axis contract (from DECISIONS candidate #2)
- **What:** Inherited-`dir` RTL flips the value↔position mapping (right-anchored geometry, reversed ArrowLeft/Right); vertical keeps Up/Right = +1 in both directions; PageUp/Down snap to the step grid.
- **Acceptance:** Browser cases SD-KEY-02/03, SD-POINTER-10/13, SD-DOM-06 green across LTR/RTL × horizontal/vertical against the retained API.
- **Source:** Quarantine `0b1388d87` `Slider.tsx` RTL detection/geometry/keymaps + snapped Page steps; behavior fully specified in TESTS.md, no open questions.

### 2. Grab-offset drag session with owned-pointer lifecycle (from DECISIONS candidate #3)
- **What:** Off-center thumb grabs preserve the grab offset (no jump); exactly one pointer owns the session; explicit capture/release lifecycle; zero-size tracks defer without `NaN`; mid-drag prop/cardinality/disabled changes apply without stale closures.
- **Acceptance:** SD-POINTER-03 (grab offset, headline) plus SD-POINTER-04..09, SD-CTRL-05, SD-DYNAMIC-02/03, SD-COMP-01/03 green as real-engine pointer cases.
- **Source:** Quarantine `0b1388d87` `Slider.tsx` (`grabOffsetRef`, `activePointerIdRef`, window listeners, `latestPropsRef`); any session topology passing the cases is acceptable.

### 3. Track-press nearest-movable-thumb selection + active/index tie rule (from DECISIONS candidate #4)
- **What:** Track presses move the nearest thumb that can actually move toward the press (immovable thumbs skipped); ties go to the most recently active thumb, then the lower DOM index; the chosen thumb takes focus.
- **Acceptance:** SD-POINTER-01/02 and SD-DOM-08 green as browser cases, including the `[40,40]` stacked-press tie sequence; no reliance on paint order.
- **Source:** Quarantine `0b1388d87` Track `handleTrackPointerDown` movability evaluation + tie-breaks; requires a new internal `activeThumbIndex` concept.

### 4. `onChangeEnd` once-per-changed-session semantics (from DECISIONS candidate #5)
- **What:** `onChangeEnd` fires exactly once with the last requested candidate after a changed pointer release or the matching keyup of a changed key session; canceled sessions, programmatic updates, and bound no-ops emit nothing.
- **Acceptance:** SD-END-01 (once, after final request, before capture cleanup) and SD-END-03 (seven cancel paths silent) green as browser cases; SD-END-02/04 tail green.
- **Source:** Quarantine `0b1388d87` `Slider.tsx` session refs (`hasChangedInSessionRef`, `activeKeyRef`, end-on-matching-keyup). Note: if FEATURES.md #3 blesses Shift+Arrow paging, a modifier-aware session key must be defined. (Moot: FEATURES #3 decided strip, 2026-09-26.)

### 5. Runtime diagnostics wiring (from DECISIONS candidate #6)
- **What:** Call the landed (currently unwired) `validateSliderConfig` kernel at render and throw on malformed anatomy (zero/duplicate Track, duplicate Range) and value↔Thumb count mismatches, before any ARIA or CSS publishes.
- **Acceptance:** SD-DOM-05/12 and SD-CTRL-07 green as browser cases (descriptive error raised, no `onChange`, no `NaN` in any attribute or custom property); consumers audited for throw-safety first.
- **Source:** Quarantine `0b1388d87` `Slider.tsx` validation call sites + anatomy/count throws; kernel already landed and unit-pinned. Cases specify throws (fail fast); a dev-only warning would be an HQ-approved amendment, not the default.

### 6. Proof-only backlog: a11y checker + environment matrix (from DECISIONS candidate #9)
- **What:** No code change expected — run the checker and the environment cases against the retained API and fix whatever real bugs they surface; run last, after the API settles.
- **Acceptance:** SD-A11Y-01 checker green over labeled scalar/range/disabled/vertical/RTL fixtures; SD-ENV-02 (StrictMode × React 17/18/19) and SD-ENV-04 (Chromium/Firefox/WebKit) green; SD-ENV-03 (ShadowRoot) green or cut by explicit HQ scope decision.
- **Source:** Quarantine `0b1388d87` e2e/unit corpus (all four cases claim green on quarantine); known risk spots: `document.activeElement` and window listeners under ShadowRoot, StrictMode double-effect sessions.
