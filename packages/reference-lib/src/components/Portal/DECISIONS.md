# Portal decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: relocates children elsewhere in the DOM, no wrapper.

## Landed (context, 2-4 lines)

Nothing landed: Portal had NO quarantine freeze commit and NO landing crew —
there is no crew log and no landing commit. `git log 7aea45265..components-quarantine
-- packages/reference-lib/src/components/Portal/` is empty, and
`.agents/missions/quarantine-landing/objective-B-overlay.md` confirms Portal/
untouched with an empty diffstat. Current behavior is the reference-system
SPEC as documented in `Portal.md` / `TESTS.md`.

## Candidate features (quarantine-sourced)

No quarantine freeze commit exists for Portal, so there are no
quarantine-sourced candidate APIs to decide.

## Suspected gaps (no quarantine source)

Moved to FEATURES.md — the one OPEN gap (shadow-portal event contract,
gap #1) needs a design call.

## Non-decisions (rejected outright)

- Wrapper host props (`className`, `style`, `as`/`asChild`): Portal renders no
  wrapper — `TESTS.md` Out of scope; `Portal.md` "Leave Radix's host-node props".
- Stacking, focus, dismissal, inerting, modality: owned by Overlay —
  `TESTS.md` Out of scope.
- Positioning: owned by Popover — `TESTS.md` Out of scope.

## Walkthrough notes for HQ

- Open design work lives in FEATURES.md (1 item: shadow-portal event
  contract) — decide ownership before any shadow consumer ships.
- No mechanical patches pending — PATCHES.md confirms the honest none.
- The no-wrapper model is settled (non-decision): open the Portal story in
  Book, inspect the DOM, children land directly in the destination body node.
- Late-resolved containers (ref/function resolving null-then-target, never a
  transient body copy) are the main behavioral contract beyond Radix — feel
  it via the story's custom-container fixture and PT-CONTAINER-02/03.
