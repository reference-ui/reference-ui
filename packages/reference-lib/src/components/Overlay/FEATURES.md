# Overlay features (needs design)

Every open/deferred Overlay item needs an HQ product/design call before any
test could pin it. Source: `DECISIONS.md` suspected gaps #1–#6 (5 OPEN,
1 DEFERRED). Mechanical list: `PATCHES.md` (empty — zero test-pinnable gaps).

### 1. Documented shadow destination rule for overlay consumers (from DECISIONS gap #1, OPEN) — LANDED 2026-09-26

**Decision: AUTOMATIC.** Omitted `Overlay.Portal container` follows the
trigger: `trigger.getRootNode()` when it is a ShadowRoot, else Portal's
`document.body` fallback; explicit `container` (including `null`) always
wins. Implemented in `parts/portal-container.ts`, wired into Content +
Backdrop, unit-tested, documented in `Overlay.md` ("Shadow destination
rule"), proven end to end by `OV-ENV-05`. Shadow+modal keeps the full
`OV-ENV-03` contract. Unblocks `DF-COMP-04`, `MN-ENV-03`,
`CB-ENV-03`/`CB-COMP-04`; Menu PATCHES #3 + DateField PATCHES #7
remainders go to micro-crews.

**What it does:** Tells overlay consumers where to portal when the trigger
lives in a ShadowRoot, and who owns composed-path dismissal there. The
shadow kernel is already proven (`OV-ENV-03`, `OV-OUT-09`, `OV-INERT-06`,
`OV-SCROLL-09`, `OV-POS-12`); only the consumer-facing rule is missing, and
four sibling cases cite it (`DF-COMP-04`, `MN-ENV-03`, `CB-ENV-03`/`CB-COMP-04`).

**API:** No new props — a documented rule plus proof: when the trigger/source
lives in an open ShadowRoot, `Overlay.Portal container` targets that root and
composed inside/outside dismissal follows `OV-OUT-09`, proven end to end by
one consumer-level CT (DateField picker in shadow). Design calls: is the
destination consumer-authored (`container={shadowRoot}`) or automatic
(`getRootNode()` default), and is shadow+modal supported at all.

**Maintainer take:** Good to add — the kernel is proven and four sibling cases are parked on the rule, so writing it unblocks real consumers.

### 2. Layer/dismissal accounting audit for composed consumers (from DECISIONS gap #2, OPEN) — LANDED 2026-09-26

**Decision: coordinator-logs + prose/CT audit.** One layer entry per
coordinator/Content pair, logged by the coordinator's own Overlay root;
nested popover-in-dialog registers as branch (`parentId`), not a second
root; one granular-before-high-level sequence per modality. Contract
published in `Overlay.md` ("Composition accounting"), audited live by
`OV-LAYER-11` (`fixtures/accounting-fixture.tsx` store readout). No dev
diagnostic for double registration — explicitly deferred until it bites.

**What it does:** Publishes the composition accounting contract so a wrapped
`Overlay.Content` (Combobox popover, Menu content via Popover policy) shares
exactly one layer entry with its coordinator and dismisses exactly once —
unblocks Combobox `CB-CLOSE-03` single-layer single-sequence proof.

**API:** No new props — a published contract: one layer entry per
coordinator/Content pair; Escape/outside-press yields one
granular-before-high-level sequence per modality; nested popover-in-dialog
registers as branch, not a second layer. Audit surface undecided: prose + CT
proof, or a dev diagnostic on double registration. Design calls: who logs the
layer (coordinator, parent Overlay, or both-as-branch) and whether ordering is
asserted per modality.

**Maintainer take:** Good to add — kernel halves are frozen, so blessing the consumer-facing accounting shape turns folklore into an assertable contract.

### 3. Granular dismiss-handler vocabulary as the shared contract (from DECISIONS gap #3, OPEN) — LANDED 2026-09-26

**Decision: real-events-everywhere.** The proven `OV-ESC`/`OV-OUT`
shape is canonical: `onEscape(KeyboardEvent)` /
`onOutsidePress(PointerEvent)` + `onInteractOutside` run first,
`onDismiss()` follows unless `preventDefault()` — real DOM events, same
ordering, same semantics on every path. Blessed in `Overlay.md`
("Dismiss vocabulary"); real-event constructors pinned by `OV-ESC-08` /
`OV-OUT-12`. No new dismiss verb without a named consumer (so no
revert-text-but-stay-open verb: no consumer named it). Unblocks Combobox
candidate #7 either way.

**What it does:** Blesses Overlay's existing dismiss vocabulary as the
canonical shape Popover/Combobox/Menu reuse for their own granular handlers,
instead of each consumer inventing its own event type (quarantine's synthetic
`{key: 'Escape'}` is the invention to avoid). Unblocks Combobox candidate #7
either way.

**API:** No new Overlay props — reuse `onEscape` / `onOutsidePress` running
first with `onDismiss` firing unless `preventDefault()` (proven `OV-ESC-01/02`,
`OV-OUT-01/03`): real DOM events, same ordering, same preventDefault
semantics. Design calls: real `KeyboardEvent`/`PointerEvent` everywhere or are
synthetic cancelable events ever acceptable, and does revert-text-but-stay-open
need a distinct verb.

**Maintainer take:** Good to add — declaring the proven vocabulary canonical costs nothing and stops per-component event inventions.

### 4. Closed-content observability for coordinators (from DECISIONS gap #4, OPEN) — LANDED 2026-09-26

**Decision: NON-GOAL (b).** Unmount-when-closed stays absolute; Overlay
exposes no closed-content metadata or registry. Coordinators answer
from authored children plus collection metadata above the mount —
Combobox's `authored.ts` scan is the conforming consumer half. Recorded
in `Overlay.md` ("Closed content") and SPEC "Out of scope"; pinned by
`OV-DOM-01` / `OV-DOM-05` (no new CT — the pin already exists).

**What it does:** Answers "can a coordinator know popover content exists
without mounting it" for Combobox `CB-OPEN-03` (edit opens only with content)
— the only item touching load-bearing unmount-when-closed architecture.

**API:** Two candidate shapes: (a) Overlay exposes closed-content metadata
without mounting (a lightweight registry/presence contract a coordinator
queries while closed); (b) explicit non-goal — coordinators answer from
authored children plus collection metadata above the mount and Overlay keeps
unmount-when-closed absolute. Design calls: does "content exists" need Overlay
at all, and if (a), what query surface pays for its staleness proofs.

**Maintainer take:** Good to decide, leaning non-goal — keeping unmount-when-closed absolute wins unless a coordinator proves authored-children inspection insufficient.

### 5. Trigger-toggle focus retention (from DECISIONS gap #5, OPEN)

**What it does:** Clicking an open `Overlay.Trigger` toggles closed while
focus stays on (or returns to) a designated input instead of landing on the
button — DateField `DF-CAL-03` "input keeps focus", corroborated by the
Combobox Trigger toggle surprise.

**API:** Behavior, no new props decided. Candidate shapes: a
mousedown-default-prevention policy on Trigger, or toggle-close resolving
through `restoreFocus` targeting; current native click moves focus to the
button and `OV-RESTORE-*` covers close paths but not toggle-to-input. Design
calls: keep focus (never move) vs return focus (move then restore), and all
Trigger toggles vs only coordinator-named targets.

**Maintainer take:** Good to add — the cheapest open choreography call, with a directly feelable DateField payoff.

### 6. Tab-bridge reject semantics (from DECISIONS gap #6, DEFERRED)

**What it does:** Defines the focus outcome when the Overlay Tab bridge
(`OV-TRG-05`: Tab past the last control advances relative to Trigger and fires
one `onDismiss`) fires and the parent rejects by staying open — today focus
has already advanced and nothing pins what happens next.

**API:** Behavior, no new props: either the optimistic focus move stands
(documented final) or Overlay reclaims focus into Content (restore-on-reject),
frozen by extending the `OV-TRG-05` fixture with a rejecting parent. Parked
behind the controlled-accept handshake design shared with Menu candidate #9
(strict `MN-CLOSE-08`): is prevent-then-restore acceptable Tab latency, or
does the contract need a synchronous will-you-accept signal.

**Maintainer take:** Good to add jointly with the Menu/Popover handshake, not alone — half a contract would pin the wrong latency shape.
