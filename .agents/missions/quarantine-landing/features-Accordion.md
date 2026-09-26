# Accordion FEATURES crew log

Status: COMPLETE — BLOCKED (verify-block filed, no code changed)

- Branch: `reference-system` (never switched; verified via `git branch --show-current` 2026-09-26)
- No commits made (per brief).
- Touch discipline: Accordion dir + this log only; every other path read-only. Accordion dir untouched — zero edits.

## Brief

Accordion has ONE triaged item: FEATURES.md #1 find-beforematch (triage:
IMPLEMENT-NOW "blocked on Collapsible #1 primitives" — and Collapsible #1
is HELD for HQ). Task: verify the block formally; land anything landable
standalone (breaking NOW per API-STANCE, visuals frozen, `pnpm agentct
Accordion` + UX proof); else file a precise verify-block and change nothing.

## Evidence read

- `packages/reference-lib/src/components/Accordion/FEATURES.md` §1:
  closed items open on browser find-in-page — "items inherit
  `hiddenUntilFound` from their item Collapsible, and a `beforematch`
  event on a closed item's Content expands that item (single mode: the
  match may swap the open item). Blocked on Collapsible landing
  `hiddenUntilFound` passthrough + `beforematch` expansion first."
  Open design Q: single-swap vs opt-in (`findExpansion?: 'auto' | 'off'`).
- `packages/reference-lib/src/components/Collapsible/FEATURES.md` §1
  (HOLD-FOR-HQ): root/Content `hiddenUntilFound` prop, closed Content
  renders `hidden="until-found"`, `beforematch` opens + skips motion once.
  Open: prop shape (root vs root+Content), aria-controls target,
  GSAP interplay, SSR story.
- Triage (`.agents/missions/quarantine-landing/features-triage.md`):
  Accordion #1 → "IMPLEMENT-NOW: single-mode swap is forced by the mode
  invariant, no new surface; blocked on Collapsible #1 primitives."
  Collapsible #1 → "HOLD-FOR-HQ: prop shape ..., aria-controls target,
  GSAP interplay, SSR story all open."
- `docs/MISSIONS/API-STANCE.md`: breaking NOW pre-release; simplest
  forever-contract wins.

## Code verification (the formal block)

Grep over `packages/reference-lib/src/components/{Accordion,Collapsible}/`
for `hiddenUntilFound|beforematch|until-found|untilFound`: **zero hits**.
The primitive does not exist in either dir.

Composition seam (why nothing is landable standalone):

1. `Accordion.Content = CollapsibleContent` — direct alias
   (`Accordion.tsx:417,422`). `AccordionItem` renders bare
   `<Collapsible id disabled>` (`Accordion.tsx:38-44`) — no Find
   passthrough exists to thread through.
2. `CollapsibleContent` renders through `<Presence present={isOpen}>`
   (`Collapsible.tsx:413`), which **unmounts** closed content. A closed
   Accordion item's panel is not in the DOM at all: Ctrl+F cannot match
   it and no `beforematch` can fire on it. An Accordion-side
   `beforematch` listener without the Collapsible primitive would be
   dead code with no node to attach to when closed.
3. The expansion path a future handler would call exists and is
   identified: `Collapsible.setIsOpen` → `accordion.toggleItem(id)`
   (`Collapsible.tsx:83-95`), honoring single-swap/multiple policy via
   the existing `toggleItem` (`Accordion.tsx:264-313`). Triage's
   "no new surface" reading holds — but it is unreachable until closed
   content stays mounted-findable.
4. Landing Accordion-owned `hidden="until-found"` rendering ahead of
   Collapsible would fork the closed-content path Collapsible owns
   (Presence unmount + GSAP exit + PRES-08 inert isolation) and preempt
   the HQ-held Collapsible #1 prop-shape call (root vs root+Content).
   That contradicts the documented inherit-from-Collapsible design and
   the maintainer take ("good to add once Collapsible lands the
   primitives").

Standalone-landable audit: none. The single-mode design question is
already settled by triage (swap forced by the mode invariant, no new
surface), so there is no residual Accordion-side design work to land
either — the item is 100% gated on the Collapsible primitive.

## Verify-block (filed)

- **Blocked item:** Accordion FEATURES.md #1 (Find `beforematch` /
  `hiddenUntilFound`).
- **Missing:** Collapsible FEATURES.md #1 — `hiddenUntilFound`
  passthrough (prop shape TBD by HQ) + closed-Content
  `hidden="until-found"` rendering + `beforematch` listener that opens
  via `setIsOpen` (routing into `accordion.toggleItem` for items).
- **Unlocks it:** HQ resolves Collapsible #1 (prop shape, aria-controls
  target, GSAP skip-motion-once interplay, SSR story); Collapsible crew
  lands the primitive; Accordion crew then wires inherit-from-item
  (triage: no new Accordion surface, single-swap forced) + TESTS.md Find
  cases (SPEC Find-axis row currently has no case ID).
- **Block chain:** Accordion #1 IMPLEMENT-NOW → blocked on Collapsible
  #1 → HOLD-FOR-HQ. Formally verified; nothing to implement until the
  HQ hold clears.

## Proof / tests

No code changed, so no `pnpm agentct` run and no UX review commissioned:
there is no delta to prove or review (PATCHES crew precedent: same
treatment for the verified no-op, see `patches-Accordion.md`). The
deliverable is this verify-block.

## Files changed

None (code). Log only: `.agents/missions/quarantine-landing/features-Accordion.md`.

## Flags

- None for HQ beyond the filed block: Collapsible #1 remains the sole
  gate, already HELD-FOR-HQ with its four open design calls enumerated
  in Collapsible FEATURES.md §1.
