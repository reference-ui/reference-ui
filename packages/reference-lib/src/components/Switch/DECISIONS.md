# Switch decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: compact on/off button with default-or-authored thumb.

Open/deferred items have moved: mechanical, test-pinnable work lives in
[PATCHES.md](./PATCHES.md); items needing a design call live in
[FEATURES.md](./FEATURES.md). This file keeps the header, Landed, all
DECLINED verdicts, and non-decisions.

## Landed (context, 2-4 lines)

Quarantine-landing ported tests + hardening only: 3 zero-paint source edits
(Thumb forwardRef, runtime `aria-pressed` strip, managed-wins spread order),
CT 2→22 and colocated 0→4 with all 7 snapshots byte-identical; uncontrolled
mode and thumb motion deliberately preserved; UX SIGN-OFF. Crew log:
`.agents/missions/quarantine-landing/switch.md`; landing commit `814d55f71`.

## Candidate features (quarantine-sourced)

### 1. Uncontrolled-mode removal (required `checked`, drop `defaultChecked`) — verdict: DECLINED

- **Source:** quarantine commit `7bed212af`, `Switch.tsx`
  (`defaultChecked` + internal store deleted, `checked` required) + SPEC.md
  freeze work-order item 1; no case ID (API reshape, asserted via re-cut
  `SW-ACT-08` inert-readout).
- **API sketch:** `checked: boolean` required; `defaultChecked` removed from
  types (`@ts-expect-error` fixture in `SW-TYPE-01`); omitted `onChange`
  renders an inert readout that never flips local DOM.
- **Why not landed:** breaking API removal and recon mangling exhibit 1 —
  deletes a shipped consumer path (Book `CheckedByDefault` demoed it) with
  no migration. Landing preserved uncontrolled and re-targeted `SW-TYPE-01`
  / `SW-ACT-08` to pin it: controlled-without-`onChange` stays put,
  uncontrolled-without-`onChange` toggles by design.
- **Revisit when:** a catalog-wide controlled-only mandate arrives with a
  codemod and a major-version window — never as a silent per-component
  deletion.
- **Open questions:** none. Killer reason: removing shipped uncontrolled
  state breaks consumers for spec tidiness.

### 2. Geometry-authority removal (strip inline thumb transform/transition; `data-state`-only styling) — moved

Moved to [FEATURES.md](./FEATURES.md) entry 1 — needs an HQ product call on who owns thumb motion.

### 3. Structural Thumb identity (replace `displayName` sniffing; Fragment-wrapped thumbs) — moved

Moved to [PATCHES.md](./PATCHES.md) entry 1 — mechanical: no API change, behavior fully specified, pinnable by `SW-DOM-04` today.

### 4. Managed-prop type Omit (hide `aria-checked` / `aria-pressed` from public Root types) — moved

Moved to [FEATURES.md](./FEATURES.md) entry 2 — public type-surface change, needs its design call.

### 5. Hidden form checkbox / `name`-value serialization (Radix `BubbleInput`) — verdict: DECLINED

- **Source:** quarantine design leave, recorded in SPEC.md "Won't do" and
  TESTS.md Out of scope; pinned absent by `SW-DOM-06` (no `FormData`
  value, submit/reset inert) and `SW-COMP-02` (app-owned hidden checkbox
  mirrors state).
- **API sketch:** `name?` / `value?` / `required?` props plus an internal
  hidden checkbox so Switch serializes into `FormData` and participates
  in native submit/reset.
- **Why not landed:** deliberate design leave, not missing work — a boolean
  switch is trivially bound to an application input, so serializing here
  adds a second source of truth plus an uncontrolled seam the freeze
  forbids. Same stance as Slider; only parsed-scalar fields (NumberField,
  DateField) serialize.
- **Revisit when:** a form-heavy consumer shows app-owned mirroring
  (`SW-COMP-02` pattern) failing in practice — e.g. reset-timing bugs the
  app cannot fix from outside.
- **Open questions:** none. Killer reason: second source of truth for a
  value the app already owns.

### 6. Mixed / indeterminate state (`aria-checked="mixed"`) — verdict: DECLINED

- **Source:** quarantine design leave, recorded in TESTS.md Out of scope
  ("`aria-checked="mixed"`… or checkbox `role`") and Owned elsewhere
  ("mixed/indeterminate boolean: native checkbox, not Switch"); APG
  contrast cited in TESTS.md Source evidence; no case ID.
- **API sketch:** `checked: boolean | 'mixed'` (or separate
  `indeterminate?` prop) rendering `aria-checked="mixed"` with a third
  visual thumb state.
- **Why not landed:** `role="switch"` is boolean by APG contract
  (`aria-checked` true/false, never mixed, never `aria-pressed`); a
  tri-state control is a checkbox, and the native checkbox already owns
  that. Adding it would fork the request contract (what does mixed
  request — true?) and the `data-state` styling hooks.
- **Revisit when:** never for Switch — route tri-state needs to the native
  checkbox.
- **Open questions:** none. Killer reason: mixed state contradicts the
  APG switch pattern; the native checkbox owns it.

### 7. `readOnly` prop — verdict: DECLINED

- **Source:** quarantine out-of-scope note, TESTS.md Out of scope
  ("`name` / `value` / `required` / `readOnly`"); React Aria read-only
  contrast cited and left in TESTS.md Source evidence; no case ID.
- **API sketch:** `readOnly?: boolean` — focusable but non-activating,
  `aria-readonly="true"`, requests suppressed like `disabled` without
  the disabled styling/semantics.
- **Why not landed:** no read-only semantics exist for a button-host
  switch: `aria-readonly` is meaningless on `role="switch"`, and every
  stated need ("show state, block input") is served by `disabled` today.
  Aria's read-only switch is an `input`-host contrast the freeze
  deliberately leaves.
- **Revisit when:** a consumer demonstrates a focusable-but-locked switch
  (e.g. permissions-preview UI) where `disabled`'s unfocusability breaks
  the flow — with a concrete ARIA story for announcing locked-ness.
- **Open questions:** none. Killer reason: `readOnly` has no meaning on
  `role="switch"`; `disabled` covers the need.

### 8. Anatomy extensions (Track/Control/Input parts, Root alias, required Thumb, `asChild`, Provider, Presence) — verdict: DECLINED

- **Source:** quarantine design leaves, recorded in `Switch.md` ("no
  Track, Control, Input, or Root alias"; "Leave separate Track/Control
  parts"; Convergence: "Leave … `asChild`, Provider, required Thumb
  JSX") and TESTS.md Out of scope ("orientation props, geometry custom
  properties, Presence, Slot/`as`, a public Provider, or a required
  Thumb in JSX"); no case IDs.
- **API sketch:** any of: `<Switch.Track>` / `<Switch.Control>` /
  `<Switch.Input>` wrappers, a `Switch.Root` alias, mandatory
  `<Switch.Thumb>` in every tree, `asChild` polymorphism, a context
  Provider, Presence-driven mount animation, or orientation props.
- **Why not landed:** variable specificity is the whole design — two
  levels (bare mount with default thumb, authored Thumb when the thumb
  needs props) cover the compact-control case, and every proposed part
  adds JSX noise without a second state owner. Orientation is
  meaningless for a binary switch; Presence/Slot/Provider solve problems
  Switch's two-part anatomy does not have.
- **Revisit when:** a consumer tree shows bare-mount + authored-Thumb
  genuinely unable to express a shipped design (name the design, not the
  abstraction) — or the catalog standardizes Slot/`asChild` and Switch
  must conform.
- **Open questions:** none. Killer reason: two specificity levels are the
  complete anatomy; more parts are noise.

## Suspected gaps (no quarantine source)

### 1. Clipped extra children leak into the accessible name — moved

Moved to [FEATURES.md](./FEATURES.md) entry 3 — HQ picks doc-note vs. fix vs. warning.

### 2. No ref or handle to the default thumb — moved

Moved to [FEATURES.md](./FEATURES.md) entry 4 — new API surface (prop vs. hook vs. doc answer).

### 3. `onChange` receives only the boolean — no event access — moved

Moved to [FEATURES.md](./FEATURES.md) entry 5 — signature widening needs its design call.

## Non-decisions (rejected outright)

- Symbol/`__referencePart`/fragment-walker probing scaffolding in shipped source — log SUSPECT (recon exhibit 4).
- Bare-`Span` auto-thumb fallback replacing `SwitchThumb` identity — log SUSPECT (recon exhibit 2 chrome removal).
- Book `CheckedByDefault` removal / `Checked` rename erasing the uncontrolled demo — log SUSPECT; SPEC.md Landing note.
- SPEC "Resolved" gap claims + "Production: Yes" verdict atop mangled behavior — log SUSPECT; SPEC.md Status rewritten at landing.
- Skipped-case IDs `SW-DOM-08` / `SW-COMP-01` / `SW-ENV-03` / `SW-COMP-03` (not features; reasons in SPEC.md Landing note + log SKIP line).

## Walkthrough notes for HQ

- Most important #1: uncontrolled is **preserved** (candidate §1 DECLINED,
  kept above) — try Book `CheckedByDefault` (toggles with no wiring) vs.
  `Default` controlled story; killing `defaultChecked` would break the
  former.
- Most important #2: thumb motion is **shipped paint** — click any story
  and watch the 200ms slide, then read [FEATURES.md](./FEATURES.md) entry
  1: HQ must bless the inline transform/transition as contract or
  commission the `data-state`-CSS restyle arc.
- Most important #3: clipped children leak into the **accessible name** —
  inspect the a11y tree of a Switch with an extra child (it reads
  `switch "Extra Visual"` while the track clips that child), then read
  FEATURES.md entry 3: decide doc-note vs. fix vs. warning.
- Feel item: disabled is natively inert + unfocusable, and consumer
  `aria-pressed` / conflicting `data-state` are now ignored at runtime
  (managed-wins) — toggle DevTools ARIA on the `Disabled` story.
- Patch preview: author a `Switch.Thumb` wrapped in `React.Fragment` and
  watch the duplicate default thumb appear — [PATCHES.md](./PATCHES.md)
  entry 1 pins the structural-detection fix, no API change.
- API backlog: managed-prop Omit, default-thumb ref, and `onChange`
  event access live in FEATURES.md entries 2, 4, 5 — each needs its
  design call before any code; feel the boolean-only contract by pairing
  `onClick` + `onChange` per `SW-ACT-05`.
- Skipped cases (`SW-DOM-08`, `SW-COMP-01`, `SW-ENV-03`, `SW-COMP-03`)
  are recorded non-ports with reasons, not backlog — see SPEC.md Landing
  note.
