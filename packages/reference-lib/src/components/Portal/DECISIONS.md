# Portal decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: relocates children elsewhere in the DOM, no wrapper.

## Landed (context, 2-4 lines)

Nothing landed from quarantine: Portal had NO quarantine freeze commit and NO
landing crew — `git log 7aea45265..components-quarantine
-- packages/reference-lib/src/components/Portal/` is empty, and
`.agents/missions/quarantine-landing/objective-B-overlay.md` confirms Portal/
untouched with an empty diffstat.

FEATURES #1 (shadow-portal event contract) landed under PORTAL-OWNS: no shim —
React 17/18/19 per-portal-container delegation plus remount-on-container-change
already deliver the full contract, proven by Portal-owned `ShadowFixture` CT
(`PT-DOM-05`, `PT-ENV-03`, `PT-COMP-03`, `PT-SHADOW-01`) on all three majors.
The ancestor double-dispatch artifact is documented in FEATURES.md.

## Candidate features (quarantine-sourced)

No quarantine freeze commit exists for Portal, so there are no
quarantine-sourced candidate APIs to decide.

## Suspected gaps (no quarantine source)

None open — gap #1 (shadow-portal event contract) is decided PORTAL-OWNS and
landed; see FEATURES.md.

## Non-decisions (rejected outright)

- Wrapper host props (`className`, `style`, `as`/`asChild`): Portal renders no
  wrapper — `TESTS.md` Out of scope; `Portal.md` "Leave Radix's host-node props".
- Stacking, focus, dismissal, inerting, modality: owned by Overlay —
  `TESTS.md` Out of scope.
- Positioning: owned by Popover — `TESTS.md` Out of scope.

## Walkthrough notes for HQ

- FEATURES #1 (shadow-portal event contract) is landed under PORTAL-OWNS
  with no API change: React per-portal-container delegation is the mechanism,
  Portal-owned `ShadowFixture` CT is the proof (React 17/18/19).
- No mechanical patches pending — PATCHES.md confirms the honest none.
- The no-wrapper model is settled (non-decision): open the Portal story in
  Book, inspect the DOM, children land directly in the destination body node.
- Late-resolved containers (ref/function resolving null-then-target, never a
  transient body copy) are the main behavioral contract beyond Radix — feel
  it via the story's custom-container fixture and PT-CONTAINER-02/03.
