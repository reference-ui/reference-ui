# Overlay decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: one React kernel for layered content — geometry, isolation, dismissal.

## Landed (context, 2-4 lines)

Objective B verified a NO-OP: quarantine never froze Overlay (no freeze
commit; the sole 1-line drive-by was ruled do-not-lift), so zero source
files changed and the green baseline IS the proof — E2E 117/117 +
unit 30/30 on unmodified baselines, plus nested UX SIGN-OFF.
Log: `.agents/missions/quarantine-landing/objective-B-overlay.md`;
record commit `931feb84c` (verified via `git log`).

## Candidate features (quarantine-sourced)

None — quarantine surfaced no Overlay API or functionality. The entire
quarantine diff on `Overlay/` is one type annotation on
`parts/Backdrop.tsx` (tip `89850d1c8`), ruled do-not-lift per
`docs/MISSIONS/QUARANTINE_RECON.md` §6 (see Non-decisions); dependent
rewrites (Menu/Combobox/DateField) consume unchanged Overlay contracts,
so there is zero quarantine-sourced backlog to decide.

## Suspected gaps (no quarantine source)

### 1. Documented shadow destination rule for overlay consumers — verdict: OPEN

- **Evidence:** four sibling cases cite a "documented destination" that
  does not exist: `DF-COMP-04` (DateField picker must portal into the
  owning root, not `document.body`; DateField DECISIONS #10 DEFERRED
  explicitly on Overlay), `MN-ENV-03` (Menu: "portal destination and
  composed-path ownership are Overlay product questions"), `CB-ENV-03` /
  `CB-COMP-04` (Combobox: "documented portal destination" / "documented
  shadow destination"). Overlay kernel shadow behavior is already proven
  (`OV-ENV-03` full modal contract in a ShadowRoot, `OV-OUT-09`
  composedPath, `OV-INERT-06` nested shadow, `OV-SCROLL-09` shadow
  scrollers, `OV-POS-12` shadow positioning) — the gap is the
  consumer-facing rule, not the engine. The event half
  (React container-delegation retargeting, `tree.md:46`) is owned by
  Portal DECISIONS suspected #1 — this item is the destination rule
  plus composed-path dismissal ownership only, no overlap.
- **API sketch:** no new props — a documented rule plus proof: when the
  trigger/source lives in an open ShadowRoot, `Overlay.Portal
  container` targets that root (resolved how — consumer-authored, or a
  `getRootNode()` default?); composed inside/outside dismissal follows
  `OV-OUT-09`; one consumer-level CT (DateField picker in shadow)
  proves the rule end to end.
- **Why not landed:** no Overlay landing crew existed to author
  consumer contracts (Objective B was a verified no-op), and no
  sibling crew would author another component's contract blind
  (DateField: "not authored blind").
- **Revisit when:** HQ answers the destination question below; then
  DateField ports `DF-COMP-04`/`DF-ENV-01`, Menu adopts `MN-ENV-03`.
- **Open questions:** is the shadow destination consumer-authored
  (`container={shadowRoot}` explicitly) or automatic (portal follows
  the source's root)? Is shadow+modal a supported combination at all
  (`CB-COMP-04` adversarial gate)?

### 2. Layer/dismissal accounting audit for composed consumers — verdict: OPEN

- **Evidence:** Combobox DECISIONS suspected #4 (`CB-CLOSE-03`: one
  layer entry, granular-before-high-level dismissal exactly once, one
  positioned popover, no double-registered event) — "needs Overlay
  co-design (layer accounting is Overlay-owned)" with "Revisit when:
  Overlay opens its layer/dismissal accounting for audit, or a
  double-dismiss bug is reported against Combobox-in-Overlay."
- **API sketch:** no new props — a published composition accounting
  contract: a wrapped `Overlay.Content` (Combobox.Popover, Menu.Content
  via Popover policy) shares exactly one layer entry with its
  coordinator; Escape/outside-press yields one granular→high-level
  sequence per modality; nested popover-in-dialog registers as branch,
  not a second layer. Audit surface undecided: prose + CT proof, or a
  dev diagnostic on double registration.
- **Why not landed:** kernel halves are already frozen (`OV-LAYER-01`
  branch, `OV-LAYER-03` child-only, `OV-LAYER-06` cascade,
  `OV-LAYER-09` branch membership) — what is missing is the
  consumer-facing audit, which needs HQ to bless the accounting shape
  before Combobox can assert against it.
- **Revisit when:** HQ confirms the accounting shape (who logs the
  layer — wrapped Content, parent Overlay, or both-as-branch), or the
  first double-dismiss bug lands against Combobox-in-Overlay.
- **Open questions:** who logs the layer for a wrapped Content — the
  coordinator, the parent Overlay, or both as branch? Is
  granular-before-high-level ordering asserted per modality (Escape vs
  outside press vs blur)?

### 3. Granular dismiss-handler vocabulary as the shared contract — verdict: OPEN

- **Evidence:** Combobox DECISIONS candidate #7 (`onEscape` granular
  cancelable API, `CB-REVERT-02`): "its shape (event type,
  granularity, ordering vs Overlay's document-level dismiss listener)
  must be designed once across Overlay/Popover/Combobox, not invented
  per component" — and quarantine's answer (a synthetic
  `{key: 'Escape'}` event) is exactly the per-component invention to
  avoid.
- **API sketch:** no new Overlay props — Overlay's existing vocabulary
  (`onEscape` / `onOutsidePress` run first, `onDismiss` fires unless
  `preventDefault()`, proven `OV-ESC-01`/`02`, `OV-OUT-01`/`03`) is
  blessed as the canonical shape Popover/Combobox/Menu reuse for their
  own granular handlers: real DOM events, same ordering, same
  preventDefault semantics — instead of each consumer inventing its
  own event type.
- **Why not landed:** the vocabulary exists and is proven, but its
  canonical status across consumers was never declared; Combobox
  cannot design its root `onEscape` until HQ confirms whether
  Overlay's shape is the shared one.
- **Revisit when:** HQ confirms or rejects Overlay's handler shape as
  canonical — this unblocks Combobox candidate #7 either way.
- **Open questions:** real `KeyboardEvent`/`PointerEvent` everywhere,
  or are synthetic cancelable events ever acceptable? Does "revert
  text but stay open" need a distinct verb, or is preventDefault +
  controlled props sufficient?

### 4. Closed-content observability for coordinators — verdict: OPEN

- **Evidence:** Combobox DECISIONS candidate #10 (`CB-OPEN-03`: "edit
  opens only with content" — `onOpen` only when a Popover is authored
  AND its logical collection is non-empty): "incompatible with Overlay
  unmount-when-closed as written … the gate needs an Overlay
  content-presence contract (or a mounted-but-hidden query path)
  designed first."
- **API sketch:** undecided, two shapes: (a) Overlay exposes
  closed-content metadata without mounting (a lightweight
  registry/presence contract a coordinator queries while closed);
  (b) explicit non-goal — coordinators answer "content exists" from
  authored children + collection metadata above the mount (Combobox
  owns both halves: authored Popover, Listbox collection), and Overlay
  keeps unmount-when-closed absolute.
- **Why not landed:** unmount-when-closed is load-bearing Overlay
  behavior (closed Content leaves the active stack immediately,
  `Overlay.md` Presence section); any observability mechanism cuts
  against it and needs HQ's architectural call first.
- **Revisit when:** HQ picks shape (a) or (b) — Combobox candidate #10
  is parked on this answer.
- **Open questions:** does "content exists" need Overlay at all, or is
  authored-children inspection plus collection metadata sufficient?
  If (a), what is the query surface — registry, render-prop, context
  metadata — and who pays for its staleness proofs?

### 5. Trigger-toggle focus retention — verdict: OPEN

- **Evidence:** DateField DECISIONS suspected #2 (`DF-CAL-03` requires
  "input keeps focus" on trigger toggle; landing asserted the toggle
  and scoped focus out): "Overlay focus domain — toggle + focus
  choreography belongs to `Overlay.Trigger`" and "design lives with
  Overlay." Corroboration: `combobox.md` surprise (8) felt the same
  Trigger toggle + focus interplay from the consumer side.
- **API sketch:** behavior, no new props decided: clicking an open
  `Overlay.Trigger` toggles closed while focus stays on (or returns
  to) a designated input instead of landing on the button. Candidate
  shapes: mousedown-default-prevention policy on Trigger, or
  toggle-close resolving through `restoreFocus` targeting. Current:
  native click moves focus to the button; restore-after-Presence
  (`OV-RESTORE-*`) covers close paths but not toggle-to-input.
- **Why not landed:** product choreography question with no corpus
  test demanding a shape — DateField scoped it out honestly rather
  than invent Overlay focus policy from the consumer side.
- **Revisit when:** HQ picks the toggle-focus shape; then DateField
  extends `DF-CAL-03` to assert input focus.
- **Open questions:** should toggle-close keep focus (never move it)
  or return focus (move then restore)? Does the rule apply to all
  Trigger toggles or only when the coordinator names a focus target?

### 6. Tab-bridge reject semantics — verdict: DEFERRED

- **Evidence:** Menu DECISIONS candidate #9 (`MN-CLOSE-08` strict form:
  focus retention on rejected Tab-close): "needs an async accept
  signal … likely jointly with Popover/Overlay dismissal policy."
  Overlay's own Tab bridge (`OV-TRG-05`: Tab past the last control
  advances relative to Trigger and fires one `onDismiss`) has the
  same hole — when the parent rejects by staying open, focus has
  already advanced and no case pins what happens next.
- **API sketch:** behavior, no new props: define the bridge-reject
  path — when the Tab bridge fires `onDismiss` and the parent stays
  open, either the optimistic focus move stands (documented final) or
  Overlay reclaims focus into Content (restore-on-reject). Whichever
  is frozen by extending the `OV-TRG-05` fixture with a rejecting
  parent.
- **Why not landed:** parked behind the controlled-accept handshake
  design, which does not exist yet anywhere (Menu #9 names the same
  trigger); Overlay's role is the bridge half of that joint design.
- **Revisit when:** the controlled-accept handshake design starts
  (Menu strict `CLOSE-08` + Popover policy) — Overlay freezes the
  bridge-reject half in the same pass.
- **Open questions:** is prevent-then-restore acceptable Tab latency,
  or does the contract need a synchronous "will you accept?" signal?
  (Shared with Menu #9 — answer once, apply to both.)

## Non-decisions (rejected outright)

- Backdrop 1-line type annotation (quarantine tip `89850d1c8`): explicit-parameter drive-by on sound contextual typing, ruled do-not-lift — recon §6 + `objective-B-overlay.md` "Quarantine inspection log".
- Native `<dialog>` second runtime, semantic Dialog/Drawer/Popover components, visual styles, snap points, iOS scale-behind, public Provider, drag-anywhere on Content, `@floating-ui/react` as runtime: out of scope per SPEC.md "Out of scope".
- react-remove-scroll's independent `isDisabled` convenience path: no second scroll switch — SPEC.md "Out of scope" (open Overlay with isolation `scroll` always owns its lock through Presence exit).
- FloatingArrow chrome, hover grace / impatient click / skip-delay, Spectrum positioner, Radix popper, Toast queue, `as` prop, styles: leave/other-owner per `Overlay.md` "Leave" + "Convergence".
- TalkBack virtual-modality skip: FocusLock-owned — SPEC.md "Owned elsewhere" ("Do not copy FocusLock / Portal / Popover catalogs into Overlay").
- Quarantine dependent-rewrite pressure on Overlay contracts (Menu/Combobox/DateField rewrites): none — same `Overlay` / `useOverlay` / `OverlayContentProps` / `OverlayDismissHandlers` / `overlayStackStore` surface, recorded in `objective-B-overlay.md`.

## Walkthrough notes for HQ

- Most important #1: the shadow destination rule is **open** (gap 1) — Overlay's shadow kernel is fully proven, but four sibling cases cite a "documented destination" that was never written, and DateField + Menu are parked on Overlay for it. In Book, open the Overlay dialog story and ask "where would this portal if the trigger lived in a ShadowRoot?" — today there is no answer; decide consumer-authored vs automatic before any shadow consumer ships. (Portal owns the event half — decide the destination half here.)
- Most important #2: layer/dismissal accounting audit is **open** (gap 2) — Combobox cannot prove single-layer single-sequence composition until Overlay blesses the accounting shape. In Book, open a Combobox popover inside a modal dialog story, press Escape, and ask "who logged that layer, and where is the once-only proof?" — that proof surface is this decision.
- Most important #3: closed-content observability is **open** (gap 4) — the only item that touches load-bearing Overlay architecture (unmount-when-closed). In Book, open any closed Combobox and ask "can the coordinator know popover content exists without mounting it?" — a yes means a new Overlay metadata surface; a no keeps the kernel absolute and pushes the answer to authored-children inspection.
- Bonus feel: trigger-toggle focus (gap 5) is the cheapest open item to feel — in Book's DateField picker story, click the trigger to toggle closed and watch focus land on the button instead of staying in the text; the fix shape is one Overlay choreography call.
