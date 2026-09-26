# Slider decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: multi-thumb drag/keyboard/ARIA value kernel; apps own chrome and forms.

## Landed (context, 2-4 lines)

Landing `f1836d1d9` ported the pure `slider-math.ts` kernel verbatim from
quarantine plus 15 colocated cases (`SD-MATH-01`–`13`, `SD-TYPE-01` adapted,
`SD-ENV-01` adapted), with snap/bounds/step/page/percent wired into `Slider.tsx`
and generic `SliderProps<T>` typing. Visuals frozen (4 CT green on unmodified
baselines), `tsc` clean, UX APPROVED. Full arc:
`.agents/missions/quarantine-landing/slider.md`.

## Candidate features (quarantine-sourced)

### 1. Controlled-only `value` (strip `defaultValue` + internal state) — verdict: OPEN

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`value: T` required,
  `defaultValue`/`internalValue` deleted); fixture `matrix/lib/src/slider.tsx`
  uses `defaultValue` zero times; cases SD-CTRL-01/02/04, SD-DOM-01, SD-DOM-11.
- **API sketch:** `value: T` becomes required, `defaultValue` and the internal
  `useState` go away; every interaction is a request the parent must accept
  (`SD-CTRL-02` rejection semantics become the only path). Matches `Slider.md`
  Proposed API and SPEC work-order #1.
- **Why not landed:** breaking public-API deletion; landing law ports are
  API-identical, so uncontrolled `value?` + `defaultValue` was retained and
  `SD-TYPE-01` was adapted to it instead.
- **Revisit when:** now — this item IS the revisit trigger. HQ must pick strip
  vs bless before the matrix re-target, since all 58 quarantine e2e fixtures
  encode controlled-only usage and must be rewritten one way or the other.
- **Open questions:** does any consumer (present or planned) need uncontrolled
  mode? All four Book stories (`SingleThumb`, `RangeThumbs`, `Vertical`,
  `NativeParity`) already drive controlled `value`, which suggests the strip
  cost is low — but HQ must confirm no out-of-Book consumer relies on
  `defaultValue`.

### 2. RTL/vertical axis contract (geometry mapping + key policy + Page snapping) — verdict: DEFERRED

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`isRtl` via
  `closest('[dir]')`/computed style, RTL `right`-anchored thumb/range geometry,
  RTL arrow map, vertical-keys-independent-of-RTL map, snapped Page steps);
  cases SD-DOM-06, SD-KEY-02/03/04, SD-POINTER-10/13, SD-COMP-02.
- **API sketch:** no new props — `orientation="vertical"` keeps working and
  horizontal sliders under inherited `dir="rtl"` flip the value↔position
  mapping; ArrowLeft/Right reverse only in horizontal-RTL, vertical keeps
  Up/Right = +1 in both directions, and PageUp/Down snap to the step grid
  (`snapValueToStep(cur ± pageStep)` instead of today's raw `val ± pageStep`).
- **Why not landed:** geometry + keymap rewrite classed suspect per recon; the
  current component has no RTL detection at all and unsnapped Page steps.
  Needs-browser-proof across LTR/RTL × horizontal/vertical, plus matrix
  re-target (no slider spec exists under `matrix/` on this branch).
- **Revisit when:** the matrix re-target reaches the axis cases and SD-KEY-02/03,
  SD-POINTER-10/13, SD-DOM-06 pass as browser cases against the retained API.
- **Open questions:** none for the behavior itself — fully specified in TESTS.md.
  Only sequencing: axis work pairs naturally with the drag session (item 3),
  since both touch the pointer→value solver.

### 3. Grab-offset drag session with owned-pointer lifecycle — verdict: DEFERRED

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`grabOffsetRef`,
  `activePointerIdRef`, window `pointermove`/`pointerup`/`pointercancel` +
  `lostpointercapture`/`blur` listeners, `latestPropsRef` fresh-props reads,
  zero-size-track guard, mid-drag cardinality/disable discard); cases
  SD-POINTER-03/04/05/06/07/08/09, SD-CTRL-05, SD-DYNAMIC-02/03, SD-COMP-01/03.
- **API sketch:** no new props — pressing a thumb away from its center preserves
  the grab offset (no jump), exactly one pointer/touch owns the session
  (second touchpoints ignored, active-axis scroll suppression only),
  capture/release lifecycle is explicit, zero-size tracks defer without `NaN`,
  and mid-drag prop/cardinality/disabled changes take effect without stale
  closures or resurrected values.
- **Why not landed:** the full drag rewrite was the core suspect item; today's
  per-thumb capture + root-level drag has no grab offset, no pointerId check
  (a second touchpoint's move drives the drag), and `values` in callback deps
  (stale mid-drag reads). All of it needs real-engine pointer proof.
- **Revisit when:** the matrix re-target reaches the POINTER cluster and
  SD-POINTER-03 (grab offset) passes as the headline browser case, with
  SD-POINTER-04..09 as the lifecycle tail.
- **Open questions:** none for the specified behavior. Implementation note for
  the future crew: `latestPropsRef`-style freshness is required by SD-CTRL-05,
  but the window-listener topology itself is not frozen — any session design
  passing the cases is acceptable.

### 4. Track-press nearest-movable-thumb selection + active/index tie rule — verdict: DEFERRED

- **Source:** quarantine `0b1388d87`, `Slider.tsx` Track `handleTrackPointerDown`
  (per-thumb movability evaluation against neighbor bounds, most-recently-active
  tie-break, lowest-DOM-index final tie-break, chosen thumb focused); cases
  SD-POINTER-01/02, SD-DOM-08.
- **API sketch:** no new props — pressing the Track moves the nearest thumb
  that can actually move toward the press (immovable thumbs skipped), ties go
  to the most recently active thumb then the lower DOM index, and the chosen
  thumb takes focus. Requires an `activeThumbIndex` concept the current code
  does not track (its root handler picks nearest-by-distance only).
- **Why not landed:** selection-rule behavior change needing browser proof
  (focus assertions, stacked-thumb presses); landing froze interaction
  behavior and ported kernels only.
- **Revisit when:** SD-POINTER-01/02 and SD-DOM-08 are re-targeted and pass as
  browser cases, including the `[40,40]` stacked-press tie sequence.
- **Open questions:** none — the freeze rule ("nearest movable; ties choose the
  most recently active thumb, then the lower DOM index") is exact. Only note:
  SD-DOM-08 explicitly forbids relying on paint order, so any z-index stacking
  stays cosmetic.

### 5. `onChangeEnd` once-per-changed-session semantics — verdict: DEFERRED

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`hasChangedInSessionRef` /
  `hasChangedInKeySessionRef` / `activeKeyRef`, end-on-matching-keyup,
  cancel-silence on `pointercancel`/`lostpointercapture`/`buttons=0`/blur/
  unmount/disable); cases SD-END-01/02/03/04.
- **API sketch:** no new props — `onChangeEnd` fires exactly once carrying the
  last requested candidate after a *changed* pointer release or the matching
  keyup of a changed key session (native repeats coalesce); canceled sessions,
  programmatic updates, and bound no-ops emit nothing. Today's
  `commitThumbValue` calls `onChangeEnd` on pointer-down, every changing
  keydown, and pointer-up — several ends per session, and an end on press even
  when the press changed nothing.
- **Why not landed:** callback-semantics behavior change; landing froze
  `onChange`/`onChangeEnd` call patterns and the crew had no consumer audit of
  who depends on the current eager-end behavior.
- **Revisit when:** the SD-END cluster is re-targeted and SD-END-01 (once, after
  final request, before capture cleanup) plus SD-END-03 (seven cancel paths
  silent) pass as browser cases.
- **Open questions:** should the key-session end trigger stay keyup-matched
  (`e.key === activeKeyRef`) if HQ keeps Shift+Arrow paging (item 8)? The two
  decisions interact: a modifier-aware session key must be defined if modified
  keys ever start sessions.

### 6. Runtime diagnostics wiring (config/array/distance validation + anatomy + count throws) — verdict: DEFERRED

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`validateSliderConfig` call
  at render, duplicate-Track/Range throws, missing-Track throw, count-mismatch
  throws on press/key); cases SD-MATH-01/09/10 (component level), SD-DOM-05,
  SD-DOM-12, SD-CTRL-07, SD-DYNAMIC-04 (rejection half).
- **API sketch:** no new props — the landed `validateSliderConfig` kernel
  (currently exported but called zero times by `Slider.tsx`) runs at render so
  `NaN`/infinite/equal-bounds/non-positive-step/non-integer-distance configs,
  empty/decreasing/`NaN` arrays, and controlled arrays violating
  `minStepsBetweenThumbs * step` raise descriptive diagnostics before any ARIA
  or CSS publishes; malformed anatomy (zero/duplicate Track, duplicate Range)
  and value↔Thumb count mismatches throw instead of rendering `NaN` geometry.
- **Why not landed:** new runtime throws are a breaking behavior change for any
  consumer currently (unknowingly) passing malformed configs; landing kept the
  kernel unit-pinned but unwired, and the crew ran no consumer audit.
- **Revisit when:** consumers are audited for throw-safety, and SD-DOM-05/12
  plus SD-CTRL-07 pass as browser cases (error raised, no `onChange`, no `NaN`
  in any attribute or custom property).
- **Open questions:** throw vs dev-only warning — HQ call. A throw matches the
  cases as specified and fails fast before a drag can start against an
  undefined rectangle; a warning is kinder during consumer migration. Either
  way, the kernel half is already landed — only the call sites are missing.

### 7. Thumb identity: auto mount-order index vs explicit `index` — verdict: OPEN

- **Source:** quarantine `0b1388d87`, `Slider.tsx` (`getThumbAutoIndex` via
  `useId` map, explicit `index` honored as override, default range anatomy
  rendering one thumb per value); fixture evidence: `index=` appears only 4
  times in the 1561-line quarantine fixture, i.e. fixtures assume auto-index
  almost everywhere; cases SD-DYNAMIC-01, SD-DOM-08, SD-ENV-01 (fixture assumed
  auto index — the landing crew had to adapt it to explicit `index`).
- **API sketch:** two directions. (a) Auto: `Thumb` takes no `index` (matching
  `Slider.md` Proposed API, which has none); identity is mount-order
  positional, surviving-thumb identity recalculates on cardinality change per
  SD-DYNAMIC-01. (b) Explicit: keep `index?: number`, ideally making it
  required for multi-thumb so the current `index = 0` default (every unindexed
  thumb silently binds value 0) stops being a footgun.
- **Why not landed:** landing retained explicit `index` and today's zero
  default; quarantine's auto machinery (including its never-unregistering id
  map, a StrictMode-remount wart) was classed suspect and left out.
- **Revisit when:** now — this item gates the matrix re-target. Every range
  fixture must be written either auto or explicit; HQ must pick before fixture
  rework starts, or the rework will be thrown away.
- **Open questions:** for HQ: is positional mount-order stable enough for
  conditional thumbs (if a middle thumb unmounts, do survivors keep identity
  by key or shift by position)? SD-DYNAMIC-01 demands keyed-part atomicity —
  whichever direction is picked, the `index = 0` silent default must go.

### 8. Modified-key policy: strip Shift+Arrow paging to match the freeze — verdict: OPEN

- **Source:** quarantine `0b1388d87`, `Slider.tsx` key handler (`if
  (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return`); case SD-KEY-07
  requires modified arrows to be ignored with no `preventDefault` and no
  `onChange`. Today's component instead implements Shift+Arrow/Down as Page
  steps — a convenience the freeze never specifies.
- **API sketch:** two directions. (a) Strip: delete the `shiftKey` branches so
  all modified keys pass through to the application untouched (browser and
  application shortcuts stay available; Page keys remain the only large-step
  input). (b) Bless: keep Shift+Arrow paging and amend SD-KEY-07 with a named
  exception, documenting it as a deliberate Reference UI extension.
- **Why not landed:** either direction breaks someone — (a) removes a shipped
  convenience, (b) amends the freeze. Landing froze key behavior untouched.
- **Revisit when:** now — small, self-contained, and it gates SD-KEY-07
  re-targeting (the case cannot pass as written while Shift+Arrow pages).
- **Open questions:** does HQ want any modifier-based large step at all? If
  yes, Shift+Arrow is the natural survivor and SD-KEY-07 gets its exception;
  if no, strip and let Page keys own large steps per the freeze.

### 9. Proof-only backlog: a11y checker + environment matrix — verdict: DEFERRED

- **Source:** quarantine `0b1388d87` e2e/unit corpus (SD-A11Y-01 checker run over
  labeled scalar/range/disabled/vertical/RTL fixtures; SD-ENV-02 StrictMode ×
  React 17/18/19 ref/session singularity; SD-ENV-03 ShadowRoot-local
  focus/capture/RTL/geometry; SD-ENV-04 Chromium/Firefox/WebKit smoke matrix);
  no case ID gaps — all four exist and claim green on the quarantine branch.
- **API sketch:** no API change expected — this is pure proof: run the checker
  and the three environment cases against the retained API and fix whatever
  real bugs they find (known risk spots: `document.activeElement` and window
  listeners under ShadowRoot, StrictMode double-effect session duplication).
- **Why not landed:** no matrix slider spec exists on this branch to host these
  cases, and the landing arc proved colocated + CT only (SD-ENV-01 excepted).
- **Revisit when:** the matrix re-target reaches the ENV tail — ideally last,
  after items 1–8 settle, since environment proof on a shifting API is throwaway
  work.
- **Open questions:** is ShadowRoot support in-scope for reference-ui at all, or
  should SD-ENV-03 be cut from the contract? HQ product call; SD-ENV-02/04 are
  uncontroversial gates.

## Suspected gaps (no quarantine source)

### 1. Documented `dragging` data hooks on Root/parts — verdict: DEFERRED

- **Evidence:** TESTS.md geometry contract promises "Root/parts expose exact
  orientation/disabled/dragging data state" and SD-POINTER-07 asserts "every
  documented dragging hook clears" — yet neither implementation exposes a
  dragging hook (quarantine: `data-active` on the thumb only; current:
  `data-active` + internal `draggingIndex`, nothing on Root/Track/Range).
- **API sketch:** no new props — add `data-dragging` (naming per the contract's
  "dragging data state") to Root and the active Thumb for the session duration,
  cleared on release/cancel alongside capture; Track/Range only if HQ wants the
  full "parts" reading of the contract.
- **Why not landed:** unspecified which parts carry the hook and no case pins
  the attribute name; landing froze data attributes to the CT baselines.
- **Revisit when:** SD-POINTER-07/08 re-targeting forces the question — the
  re-target author must name the hooks before writing the assertions.
- **Open questions:** Root + active Thumb, or all parts? And does `data-active`
  (already shipped on thumbs) get renamed to match, or do both hooks coexist?

### 2. Single-thumb default accessible name — verdict: OPEN

- **Evidence:** nested ux-designer review observation, via crew log
  (`.agents/missions/quarantine-landing/slider.md`): unnamed single thumbs
  leave screen-reader users with no label; both implementations default the
  single-thumb `aria-label` to `undefined` (defaults exist only for 2+ thumbs:
  Minimum/Maximum, "Value N of M").
- **API sketch:** product choice, not a kernel problem — either a default name
  (e.g. `"Value"`), a dev-only warning when a single thumb has no
  `aria-label`/`aria-labelledby`, or an explicit documented stance that naming
  is consumer-owned (the current de-facto position).
- **Why not landed:** pre-existing observation flagged as backlog, not a
  verdict factor; any default name or warning is new consumer-facing behavior.
- **Revisit when:** HQ picks a catalog-wide unlabeled-control policy — this
  should not be decided per-component if siblings face the same question.
- **Open questions:** default name vs warning vs consumer-owned? Note SD-A11Y-01
  runs the checker on *labeled* fixtures, so the unlabeled path stays unproven
  either way until a case pins the chosen stance.

### 3. Pointer target size below WCAG 2.5.8 minimum — verdict: OPEN

- **Evidence:** nested ux-designer review observation, via crew log: the
  24×16 thumb token fails WCAG 2.5.8 Target Size (Minimum) on height (24×24
  CSS px); pre-existing, flagged as backlog rather than a landing blocker.
- **API sketch:** no API change — either grow the `sliderThumb` token, expand
  the invisible hit area (pseudo-element padding) while keeping the painted
  DSP fader-cap chrome, or document a conformance exception for the dense
  fader aesthetic.
- **Why not landed:** any fix touches frozen visuals (token growth) or adds
  hit-area machinery; landing law froze look-and-feel and the CT baselines
  pin the current geometry.
- **Revisit when:** HQ schedules an a11y-hardening pass — this needs a design
  eye on the fader-cap aesthetic, not just an engineer resizing a token.
- **Open questions:** is the DSP fader-cap look (the reason the thumb is wide
  and short) worth a target-size exception, or should pointer targets win and
  the chrome adapt? Product call with visual consequences.

## Non-decisions (rejected outright)

- Quarantine's stripped thumb motion (removed `transition`/`transform` slide):
  mangling per recon §4 exhibits — retained by landing, CT baselines pin it
  (crew log NOT-ported, SPEC.md Landing notes).
- Quarantine's removed interaction state (`localFocusVisible`/`isThumbPressed`
  deletion): recon §4.4 — retained by landing (crew log, SPEC.md Landing notes).
- Quarantine's colocated test no-op (`defaultValue`→`value`, 2-line diff vs
  929-line source rewrite): weakened coverage per recon §4.5 — landing wrote
  real colocated suites instead (`slider-math.test.ts`, `Slider.contract.test.tsx`).
- Field-commit focus suppression consumed via `checkGlobalFocusVisible`: shared-
  theme blast radius per recon §4.3 — landing keeps the real `isFocusVisible`
  path; quarantine's global-check plumbing not lifted.
- Quarantine's "73/73 + Production: Yes" SPEC rewrite: claimed proof without
  landing verification (honest count 15/73 colocated) — SPEC.md Status keeps
  the honest count; proof accrues per-case through the real gates.
- Hidden form inputs / `name` / reset / validation: TESTS.md Out of scope,
  SPEC.md Won't do + Vendor Leave, `Slider.md` "Leave" (application owns forms).
- Thumb swap/push behavior: TESTS.md Out of scope; preserve-order freeze
  (SD-POINTER-11, SD-MATH-08) — thumbs meet, never cross, swap, or push.
- Per-thumb `disabled`: SD-DOM-07 freezes a single Root-level disabled policy
  rather than Base UI's per-thumb surface.
- Visual marks, labels, tooltips: TESTS.md Out of scope — application chrome,
  not kernel contract.
- Configurable `largeStep`: SD-KEY-04 + `Slider.md` freeze the computed Page
  step (`ceil(((max-min)/10)/step)*step`); no vendor-style override prop.
- Base UI's vertical horizontal-key reversal: deliberately not inherited —
  SD-KEY-02/03 freeze Aria/Radix semantics (vertical independent of RTL).
- Invented `SD-FOCUS-01`/`02` titles: not catalog — SPEC.md Case index ("Drop
  or rehome after freeze").

## Walkthrough notes for HQ

- Most important #1: **Controlled-only vs uncontrolled (Candidate 1, OPEN).**
  The one breaking API fork: stripping matches the freeze but deletes shipped
  props; blessing amends the freeze with a documented reason. Try in Book:
  every story (`SingleThumb`, `RangeThumbs`, `Vertical`, `NativeParity`) is
  already controlled — the migration cost looks near-zero, which is the tell.
- Most important #2: **Grab-offset drag (Candidate 3, DEFERRED).** The biggest
  feel gap: grab a `RangeThumbs` thumb by its edge (not center) and drag — the
  value jumps to the center-mapped position on first move. After this lands,
  edge grabs track 1:1 with no initial jump.
- Most important #3: **`onChangeEnd` spam (Candidate 5, DEFERRED).** Every
  commit-on-release consumer is affected: hold an arrow key on `SingleThumb`
  with a console count on `onChangeEnd` — one end per repeat today, exactly one
  per session after. A press that changes nothing fires an end today, silence
  after.
- Sequencing note: **thumb identity (Candidate 7, OPEN) gates the matrix
  re-target** — all 58 e2e fixtures must be rewritten auto or explicit, so
  decide it alongside Candidate 1 before fixture work starts, or the rework is
  thrown away.
