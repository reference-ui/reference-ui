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

## Candidate features (moved — see PATCHES.md / FEATURES.md)

1. Controlled-only `value` (strip `defaultValue` + internal state) — OPEN → FEATURES.md #1 (breaking API fork; HQ must pick strip vs bless).
2. RTL/vertical axis contract (geometry mapping + key policy + Page snapping) — DEFERRED → PATCHES.md #1 (fully specified; needs browser proof).
3. Grab-offset drag session with owned-pointer lifecycle — DEFERRED → PATCHES.md #2 (fully specified; needs real-engine pointer proof).
4. Track-press nearest-movable-thumb selection + active/index tie rule — DEFERRED → PATCHES.md #3 (exact freeze rule; needs browser proof).
5. `onChangeEnd` once-per-changed-session semantics — DEFERRED → PATCHES.md #4 (specified; see the FEATURES.md #3 interaction note inside).
6. Runtime diagnostics wiring (config/array/distance validation + anatomy + count throws) — DEFERRED → PATCHES.md #5 (kernel landed; call sites + throws only, cases specify throws).
7. Thumb identity: auto mount-order index vs explicit `index` — OPEN → FEATURES.md #2 (HQ must pick before the matrix re-target).
8. Modified-key policy: strip Shift+Arrow paging to match the freeze — OPEN → FEATURES.md #3 (strip vs bless is HQ's call).
9. Proof-only backlog: a11y checker + environment matrix — DEFERRED → PATCHES.md #6 (pure proof; run last).

## Suspected gaps (moved — see PATCHES.md / FEATURES.md)

1. Documented `dragging` data hooks on Root/parts — DEFERRED → FEATURES.md #4 (hook naming and parts coverage need design).
2. Single-thumb default accessible name — OPEN → FEATURES.md #5 (catalog-wide policy call, not per-component).
3. Pointer target size below WCAG 2.5.8 minimum — OPEN → FEATURES.md #6 (product call with visual consequences).

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

- Most important #1: **Controlled-only vs uncontrolled (FEATURES.md #1).**
  The one breaking API fork: stripping matches the freeze but deletes shipped
  props; blessing amends the freeze with a documented reason. Feel it in Book:
  every story (`SingleThumb`, `RangeThumbs`, `Vertical`, `NativeParity`) is
  already controlled — the migration cost looks near-zero, which is the tell.
- Most important #2: **Grab-offset drag (PATCHES.md #2).** The biggest
  feel gap: grab a `RangeThumbs` thumb by its edge (not center) and drag — the
  value jumps to the center-mapped position on first move. After this lands,
  edge grabs track 1:1 with no initial jump.
- Most important #3: **`onChangeEnd` spam (PATCHES.md #4).** Every
  commit-on-release consumer is affected: hold an arrow key on `SingleThumb`
  with a console count on `onChangeEnd` — one end per repeat today, exactly one
  per session after. A press that changes nothing fires an end today, silence
  after.
- Sequencing note: **thumb identity (FEATURES.md #2) gates the matrix
  re-target** — all 58 e2e fixtures must be rewritten auto or explicit, so
  decide it alongside FEATURES.md #1 before fixture work starts, or the rework
  is thrown away.
- Proof tail: **PATCHES.md #6 runs last**, after the API settles —
  environment proof on a shifting API is throwaway work. Feel it in Book:
  open `NativeParity` with a checker run and compare against the labeled
  scalar/range/disabled/vertical/RTL fixtures; note SD-ENV-03 needs your
  in-scope/out call on ShadowRoot.
