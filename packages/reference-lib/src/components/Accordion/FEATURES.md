# Accordion features (need design)

Split out of [DECISIONS.md](./DECISIONS.md): every open/deferred item
that needs a product/UX/design call before implementation.

## 1. Accordion-side Find (`beforematch` / `hiddenUntilFound`)

From DECISIONS candidate #2. Source: quarantine commit `569d00567`,
SPEC.md Find-axis row (no TESTS.md case covers Find).

**What it does:** closed Accordion items open on browser find-in-page —
items inherit `hiddenUntilFound` from their item Collapsible, and a
`beforematch` event on a closed item's Content expands that item
(single mode: the match may swap the open item). Blocked on Collapsible
landing `hiddenUntilFound` passthrough + `beforematch` expansion first.

**API:** no new Accordion props for the inherit path — existing policy
honors the resulting open state. Open design question: in single mode,
should a match *swap* the open item (SPEC's current words), or is
stealing the open item surprising — should Find expansion be opt-in per
Accordion (e.g. `findExpansion?: 'auto' | 'off'`)?

**Maintainer take:** good to add once Collapsible lands the primitives, but settle single-swap vs opt-in first.
