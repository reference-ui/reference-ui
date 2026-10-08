# Portal features

## 1. Shadow-portal event contract (from DECISIONS gap #1) — LANDED

Decided: PORTAL-OWNS. The feared gap ("item handlers never fire", consumer
ENV-03 skips) does not exist: React 17/18/19 attach their full delegated
listener set to every portal container on mount (`preparePortalMount`), so
events inside a ShadowRoot destination dispatch with the true target, and a
destination change remounts the portal (`containerInfo` identity), which
re-attaches listeners on the new container. No retargeting shim is needed and
none was added — a Portal-level suppression would break the composed
outside-press and Escape contracts consumers prove (OV-ENV-03, MN-ENV-03,
CB-ENV-03, DF-ENV-01, DF-COMP-04, all green with zero skips).

Owned contract, proven at Portal level by `ShadowFixture`
(`PT-DOM-05`, `PT-ENV-03`, `PT-COMP-03`, `PT-SHADOW-01`, React 17/18/19):

- Placement: children land directly in the ShadowRoot, in order, no wrapper.
- Late resolve: a shadow destination resolving after mount gets exactly one
  copy, never a transient body copy.
- Delivery: content handlers fire exactly once, in logical bubble order, for
  pointer and keyboard events; logical context crosses the boundary; removal
  empties the root.
- Switch: moving a destination into a foreign-owned ShadowRoot keeps the full
  logical event sequence (via the documented PT-REACT-05 replacement).

Known React-delegation artifact (documented, not suppressed): handlers on
React ancestors at/above the shadow host fire twice per shadow-portal event —
once with the true target at the portal-container listener, once retargeted to
the host at the root-container listener. Consumers should treat
common-ancestor handlers as idempotent; content handlers are unaffected.
