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

**LANDED 2026-09-28 (AC-FIND-01–06 + AC-FIND-CT-01; finish-line
disclosure P2D).** Settled single-swap vs opt-in as follows: single mode
**swaps** the open item on match — native `<details name>` parity, and the
swap falls out of existing policy with zero Accordion code (item panel
`beforematch` → `toggleItem(id)`). No `findExpansion` switch was added:
setting `hiddenUntilFound` IS the opt-in. A suppression flag would be
incoherent — the UA reveals `until-found` content for the match whether we
open or not, so suppressing the open would leave visible-but-inert
(`data-state="closed"`) content; consumers who do not want find-expansion
simply omit `hiddenUntilFound` (default off globally). `AccordionItem`
takes `hiddenUntilFound` and passes it to the item Collapsible; raw
`<Collapsible id>` items take the Collapsible root prop directly. Match on
the already-open item is a no-op (never toggles off); nested standalone
Collapsibles scope their own reveal (AC-FIND-05).
