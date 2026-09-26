# Switch decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: compact on/off button with default-or-authored thumb.

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

### 2. Geometry-authority removal (strip inline thumb transform/transition; `data-state`-only styling) — verdict: OPEN

- **Source:** quarantine commit `7bed212af`, `Switch.tsx` (Thumb lost inline
  `transform: translateX(...)` + `transition`) + SPEC.md freeze work-order
  item 2 ("no geometry authority; `data-state` only"); no case ID.
- **API sketch:** Switch sets no `transform`/`transition` on either thumb;
  apps style travel purely against `data-state="checked" | "unchecked"`
  (including RTL, per `SW-ENV-04`); no `--reference-switch-*` geometry
  custom properties published.
- **Why not landed:** visuals are frozen per LANDING.md and the strip was
  recon mangling exhibit 2 — landing with it would have deleted the shipped
  slide animation. The freeze demand and the shipped paint genuinely
  disagree, so this stays an open product call, not a landed behavior.
- **Revisit when:** HQ rules on who owns thumb motion — now, at walkthrough:
  either bless the inline transform/transition as the shipped visual
  contract (and amend the freeze), or approve a designed restyle arc that
  moves travel to app CSS with fresh snapshots.
- **Open questions:** is the 200ms slide part of the brand feel HQ wants
  pinned, or should the first app-owned-travel story prove `data-state`
  CSS is sufficient? If apps own travel, do low-specificity (default
  thumb) consumers get a documented CSS recipe?

### 3. Structural Thumb identity (replace `displayName` sniffing; Fragment-wrapped thumbs) — verdict: DEFERRED

- **Source:** quarantine commit `7bed212af`, `Switch.tsx`
  (`hasStructuralThumb` fragment-walker) + SPEC.md freeze work-order item 3
  ("detect authored `Switch.Thumb` structurally, not `displayName`"); case
  ID `SW-DOM-04` (authored-Thumb replacement shapes).
- **API sketch:** no public API change; internally, authored-Thumb detection
  survives `React.Fragment` wrapping and HOC forwarding, so exactly one
  thumb exists in every shape without relying on
  `displayName === 'SwitchThumb'`.
- **Why not landed:** quarantine's mechanism was probing scaffolding
  (`Symbol.for('@reference-ui/Switch.Thumb')`, `__referencePart`), recon
  exhibit 4 — test hooks baked into the shipped component. The need is
  real (current code still displayName-sniffs and misses
  Fragment-wrapped thumbs) but wants a designed identity (Slot or part
  marker), not walker machinery.
- **Revisit when:** a consumer reports a Fragment-wrapped or forwarded
  `Switch.Thumb` rendering a duplicate default thumb, or the catalog
  adopts a standard part-identity primitive Switch can share.
- **Open questions:** which identity primitive — Slot-based composition,
  context registration, or a shared part marker? Must detection see
  through exactly one Fragment level or arbitrary depth?

### 4. Managed-prop type Omit (hide `aria-checked` / `aria-pressed` from public Root types) — verdict: DEFERRED

- **Source:** quarantine commit `7bed212af`, `Switch.tsx` (`Omit<...,
  'onChange' | 'type' | 'role' | 'aria-checked' | 'aria-pressed'>`) +
  SPEC.md freeze gap item 4; case ID `SW-TYPE-01` (managed-prop omissions).
- **API sketch:** `SwitchProps` omits `aria-checked` and `aria-pressed` so
  consumers cannot declare them; Root owns `aria-checked="true" | "false"`
  and the absence of `aria-pressed` at the type level, matching the
  runtime strip + managed-wins spread order already landed.
- **Why not landed:** any Omit change is public type-surface churn; landing
  kept types untouched and enforced the same contract at runtime (consumer
  `aria-pressed` stripped, conflicting `data-state`/`aria-checked`
  ignored per `SW-DOM-02`). Types deserve their own designed pass, not a
  stability-landing side effect.
- **Revisit when:** the next intentional type-surface pass — land together
  with any sibling managed-prop Omits so consumers meet one coherent
  breaking-type story.
- **Open questions:** error or silent Omit for consumers currently passing
  `aria-checked`? Does the Omit extend to `data-state` / `data-disabled`
  (currently runtime-ignored but type-visible)?

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

### 1. Clipped extra children leak into the accessible name — verdict: OPEN

- **Evidence:** UX verdict F1 advisory in
  `.agents/missions/quarantine-landing/switch.md` (Handoff) — live a11y
  tree showed `switch "Extra Visual"` while the themed track visually
  clips that child; `SW-DOM-04` had to assert presence-not-visibility
  for the same reason (SPEC.md Landing note).
- **API sketch:** no new API by default — either a doc note ("extra
  children are clipped; keep them decorative and `aria-hidden`"), or a
  behavior fix (Root computes its accessible name excluding clipped
  descendants), or a dev warning when a text-bearing non-Thumb child is
  authored.
- **Why not landed:** pre-existing behavior, not a quarantine regression;
  landing re-targeted the test and recorded the observation instead of
  inventing name-computation semantics mid-arc.
- **Revisit when:** now, at walkthrough — HQ picks doc-note vs. fix vs.
  warning.
- **Open questions:** is advisory text in `Switch.md` enough, or should
  Switch actively guard (warn / `aria-hidden` enforcement)? Is there a
  legitimate design where a visible extra child coexists with the thumb?

### 2. No ref or handle to the default thumb — verdict: OPEN

- **Evidence:** TESTS.md `SW-DOM-05` — "the default thumb is not
  referenced in this fixture"; landing added `forwardRef` to authored
  `Switch.Thumb` only (`switch.md` STABILITY item 1), so low-specificity
  consumers have no handle to the rendered thumb `span`.
- **API sketch:** options range from a `thumbRef?` prop on Root, to a
  `Switch.useThumb()` accessor, to documenting "author `Switch.Thumb`
  when you need the node" as the complete answer.
- **Why not landed:** nothing in quarantine or the suite needed it —
  measurement/animation consumers are hypothetical, and the authored
  Thumb escape hatch exists.
- **Revisit when:** a consumer needs to measure or animate the default
  thumb (e.g. travel-distance readout, FLIP animation) without taking on
  authored-Thumb styling.
- **Open questions:** is "author a Thumb" an acceptable answer, or does
  low-specificity need first-class node access? If added, prop vs. hook?

### 3. `onChange` receives only the boolean — no event access — verdict: OPEN

- **Evidence:** `Switch.md` request contract (`onChange?: (checked:
  boolean) => void`) + `SW-ACT-05` (cancellation flows through consumer
  `onClick` + `preventDefault`, not through the change callback);
  consumers needing modifier keys, timestamps, or `stopPropagation`
  context at request time have no channel.
- **API sketch:** either keep boolean-only and document the `onClick`
  pairing (`SW-ACT-05` pattern) as the event channel, or widen to
  `onChange(checked, event)` / a request object.
- **Why not landed:** the request contract is deliberate (button has no
  durable checked state; the boolean *is* the request) and quarantine
  never questioned it — widening mid-landing would fork every `SW-ACT`
  title for a hypothetical need.
- **Revisit when:** a consumer shows the `onClick`-pairing insufficient —
  e.g. needs the request and the event atomically in one callback.
- **Open questions:** is the `onClick` + `onChange` pairing ergonomic
  enough to bless as the permanent pattern? If widened, second-arg event
  or single request object?

## Non-decisions (rejected outright)

- Symbol/`__referencePart`/fragment-walker probing scaffolding in shipped source — log SUSPECT (recon exhibit 4).
- Bare-`Span` auto-thumb fallback replacing `SwitchThumb` identity — log SUSPECT (recon exhibit 2 chrome removal).
- Book `CheckedByDefault` removal / `Checked` rename erasing the uncontrolled demo — log SUSPECT; SPEC.md Landing note.
- SPEC "Resolved" gap claims + "Production: Yes" verdict atop mangled behavior — log SUSPECT; SPEC.md Status rewritten at landing.
- Skipped-case IDs `SW-DOM-08` / `SW-COMP-01` / `SW-ENV-03` / `SW-COMP-03` (not features; reasons in SPEC.md Landing note + log SKIP line).

## Walkthrough notes for HQ

- Most important #1: uncontrolled is **preserved** (§1 DECLINED) — try
  Book `CheckedByDefault` (toggles with no wiring) vs. `Default`
  controlled story; killing `defaultChecked` would break the former.
- Most important #2: thumb motion is **shipped paint** (§2 OPEN) — click
  any story and watch the 200ms slide; HQ must bless it as contract or
  commission the `data-state`-CSS restyle arc.
- Most important #3: clipped children leak into the **accessible name**
  (suspected §1 OPEN) — inspect the a11y tree of a Switch with an extra
  child; decide doc-note vs. fix vs. warning.
- Feel item: disabled is natively inert + unfocusable, and consumer
  `aria-pressed` / conflicting `data-state` are now ignored at runtime
  (managed-wins) — toggle DevTools ARIA on the `Disabled` story.
- Skipped cases (`SW-DOM-08`, `SW-COMP-01`, `SW-ENV-03`, `SW-COMP-03`)
  are recorded non-ports with reasons, not backlog — see SPEC.md Landing
  note.
