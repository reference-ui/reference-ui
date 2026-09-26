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

### 1. Shadow-portal event contract — verdict: OPEN

- **Evidence:** sibling handoffs, not quarantine. `tree.md:46` skipped ENV-03:
  shadow-portal key events hit React container-delegation retargeting (native
  target retargets to the host, item handlers never fire) — "lib-wide
  framework concern". `date-field.md:49-51,124-125` blocks DF-COMP-04/ENV-01
  (ShadowRoot picker) on the shadow-portal contract, "not authored blind".
  `menu.md:23` precedent-skips ENV-03 (shadow); `combobox.md:48` notes
  modal+shadow blocked CB-COMP-04.
- **API sketch:** undecided. Placement into a ShadowRoot already works
  (PT-DOM-05, PT-ENV-03, PT-COMP-03); what's missing is the event half —
  either Portal attaches shadow-root listeners / a retargeting shim, or the
  contract is documented as unsupported and consumers stay in light DOM.
- **Why not landed:** no Portal landing crew existed to author it, and no
  sibling crew would own another component's contract blind.
- **Revisit when:** HQ assigns ownership (Portal vs Overlay vs per-consumer).
- **Open questions:** Does Portal own shadow event bridging, or only DOM
  placement? Is shadow+modal a supported combination at all (CB-COMP-04)?

## Non-decisions (rejected outright)

- Wrapper host props (`className`, `style`, `as`/`asChild`): Portal renders no
  wrapper — `TESTS.md` Out of scope; `Portal.md` "Leave Radix's host-node props".
- Stacking, focus, dismissal, inerting, modality: owned by Overlay —
  `TESTS.md` Out of scope.
- Positioning: owned by Popover — `TESTS.md` Out of scope.

## Walkthrough notes for HQ

- The one OPEN item is the shadow-portal event contract: placement in a
  ShadowRoot is specced and tested, but key/pointer delivery across the
  boundary is unowned — decide who owns it before any shadow consumer ships.
- The no-wrapper model is settled (non-decision): open the Portal story in
  Book, inspect the DOM, children land directly in the destination body node.
- Late-resolved containers (ref/function resolving null-then-target, never a
  transient body copy) are the main behavioral contract beyond Radix — feel
  it via the story's custom-container fixture and PT-CONTAINER-02/03.
