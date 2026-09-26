# Splitter patches

Mechanical follow-ups: fully specified, a test could pin each one today.
Source contracts live in TESTS.md / SPEC.md; provenance in DECISIONS.md.

### 1. Full pointer-session robustness contract (from DECISIONS candidate #6)

- **What:** Harden the drag session: capture + focus + `data-resizing` on primary pointerdown, single group owner, touch isolation, pen/button gating, selection lock + resize cursor, nested isolation, secondary-click termination, one cleanup on every cancel path with no `onChangeEnd`.
- **Acceptance:** `SP-DRAG-01`, `SP-DRAG-04`–`SP-DRAG-12`, `SP-END-01`, `SP-END-03`, `SP-END-04` green (`SP-END-01`/`SP-END-03` partially pinned already; first slices `SP-DRAG-05` touch, `SP-DRAG-11` nested).
- **Source:** quarantine `c7bdd1f7c` `Splitter.tsx` session handling; DECISIONS.md candidate 6.

### 2. Keyboard interaction sessions (from DECISIONS candidate #7)

- **What:** Held key repeats (Arrow, Shift+Arrow, Home/End, Enter) emit one interaction with one `onChangeEnd` on keyup; cross-axis Arrows and modified/special/printable keys pass through unprevented with no callbacks.
- **Acceptance:** `SP-END-02`, `SP-KEY-02`, `SP-KEY-07` green alongside landed `SP-KEY-04`.
- **Source:** quarantine `c7bdd1f7c` key handling; DECISIONS.md candidate 7.

### 3. Enter collapse/restore (from DECISIONS candidate #8)

- **What:** Enter on a Handle beside a `collapsible` Panel requests `collapsedSize` through the solver; Enter on a collapsed Panel restores the last feasible expanded size clamped to current constraints; Enter beside a non-collapsible Panel stays unprevented with no callbacks.
- **Acceptance:** `SP-COLLAPSE-01`, `SP-COLLAPSE-02`, `SP-COLLAPSE-03` green; `SP-COMP-01` sidebar as composition proof.
- **Source:** quarantine `c7bdd1f7c` Enter handling, freeze decision 3; DECISIONS.md candidate 8.

### 4. RTL direction wiring (from DECISIONS candidate #10)

- **What:** Under inherited `dir="rtl"`, logical primary becomes the right Panel; drag deltas and horizontal Arrows reverse; `aria-controls` follows the logical primary; mid-focus direction switches apply immediately; values stay DOM-order paired; vertical geometry unchanged.
- **Acceptance:** `SP-MATH-09`, `SP-KEY-05`, `SP-KEY-08`, `SP-DRAG-02`, `SP-DOM-05` green on the `[rtl]` axis.
- **Source:** quarantine `c7bdd1f7c` direction-aware adjacency/deltas; DECISIONS.md candidate 10.

### 5. Environment and composition proof suites (from DECISIONS candidate #13)

- **What:** Matrix-only proof obligations: StrictMode single-registration on React 17/18/19, ShadowRoot focus/cleanup, cross-engine drag/keyboard/Enter parity, and the four product compositions (sidebar, editor/console, nested workspace, inner grid never writing `grid-template-*`).
- **Acceptance:** `SP-ENV-02`, `SP-ENV-03`, `SP-ENV-04`, `SP-COMP-01`–`SP-COMP-04` green (re-targeted to the real API, never copied verbatim); `SP-ENV-01` SSR already landed adapted.
- **Source:** quarantine `c7bdd1f7c` matrix suites; DECISIONS.md candidate 13.

### 6. `prefers-reduced-motion` on Handle transitions (from DECISIONS gap #2)

- **What:** Guard the 150ms Handle `background-color` transition (and any future collapse-affordance motion) behind `prefers-reduced-motion`; no prop, no other behavior change.
- **Acceptance:** Reduced-motion media query present per the lib-wide convention; transition suppressed with the preference set, intact without it.
- **Source:** nested ux-designer review via `.agents/missions/quarantine-landing/splitter.md:24`; DECISIONS.md gap 2.

### 7. SP-A11Y-01 checker sweep execution (from DECISIONS gap #5)

- **What:** Run the configured accessibility checker after settling each named state (horizontal, vertical, three-Panel, mixed-constraint, collapsed); assert zero violations plus named Handles, perpendicular orientation, valid ranges, primary `aria-controls`, and disabled state on every Handle.
- **Acceptance:** `SP-A11Y-01` executed and green once its states exist (PATCHES #3, PATCHES #4, FEATURES per-Handle disable).
- **Source:** TESTS.md `SP-A11Y-01`, SPEC.md case index; DECISIONS.md gap 5.
