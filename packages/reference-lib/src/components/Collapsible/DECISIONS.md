# Collapsible decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One controlled disclosure: trigger toggles one exit-animated content region.

## Landed (context, 2-4 lines)

Quarantine-landing ported 9 hardening wins (focus evacuation, exit
isolation, aria-controls-through-exit, managed-wins spread, primary-button
guard, useId ids, trigger forwardRef, layout id registration, React 19
ref cleanup) plus a 39/39 case suite (19 unit + 22 CT incl. pre-existing),
with chrome, GSAP motion, and uncontrolled mode preserved and all 12
snapshot baselines green. Crew log:
`.agents/missions/quarantine-landing/collapsible.md`; landing commit
`b65ae4073`.

## Candidate features (quarantine-sourced)

### 1. hiddenUntilFound / beforematch find-in-page reveal — verdict: DEFERRED

- **Source:** quarantine `43f0b03cc`,
  `packages/reference-lib/src/components/Collapsible/Collapsible.tsx`
  (root + Content `hiddenUntilFound`, `beforematch` listener,
  `skipMotionOnceRef`); no TESTS.md case ID — specified only in the
  SPEC.md freeze Surface table, Gaps list, and work-order item 4.
- **API sketch:** `Collapsible` and `Collapsible.Content` each accept
  `hiddenUntilFound?: boolean` (Content prop wins over root). When true,
  closed Content renders `hidden="until-found"` instead of unmounting
  through Presence, stays Ctrl+F-discoverable, and a `beforematch` event
  opens the disclosure while skipping author motion once (zero the
  transition/animation durations for one frame, then restore).
- **Why not landed:** feature-needs-design, not stability: new public API
  with no TESTS.md case ID, so there was no contract to port or prove;
  landing rule ports stability + test-case wins only.
- **Revisit when:** HQ approves the prop shape (root-only vs root +
  Content override) and TESTS.md gains case IDs pinning closed-hidden
  rendering, beforematch-open, and skip-motion-once.
- **Open questions:** Should the Content-level override exist, or is
  root-only enough? What does `aria-controls` point at while closed-hidden
  (quarantine kept linkage live via `hasTarget` including the hidden
  branch)? Does skip-motion-once zero GSAP duration too, or only author
  CSS? What is the SSR story for `hidden="until-found"` markup?

## Suspected gaps (no quarantine source)

### 1. forceMount (always-mounted Content) — verdict: OPEN

- **Evidence:** vendor parity — Radix `Collapsible.Content` supports
  `forceMount`, and SPEC.md Vendor section cites Radix collapsible +
  Presence/measure as the lift source; our Content always unmounts via
  Presence, so closed content can never stay in the DOM for measurement,
  print, or SEO. No consumer pain filed yet; no sibling handoff.
- **API sketch:** `CollapsibleContentProps` gains `forceMount?: boolean`.
  When true, Content skips Presence unmount and stays rendered with
  `data-state="closed"` (visibility left to author CSS, e.g. `hidden`
  attribute or `display: none`), while trigger linkage and `aria-expanded`
  follow `open` as today.
- **Why not landed:** never proposed before this document; no quarantine
  source, no TESTS.md case, no freeze-catalog entry.
- **Revisit when:** a consumer needs closed content in the DOM (Accordion
  always-measure layout, print stylesheets, crawler-visible copy), or HQ
  wants Radix prop parity as a catalog policy.
- **Open questions:** Should forced-mounted closed content be `hidden`,
  `inert`, or left fully to author CSS? Does focus evacuation still run
  when nothing unmounts? How does it compose with a future
  `hiddenUntilFound` — are they two props or one?

## Non-decisions (rejected outright)

- Controlled-only rewrite (remove `defaultOpen` / internal store /
  `onOpenChange` alias; omitted `open` = controlled false): breaking API
  removal, Switch-precedent keeps uncontrolled — crew log SUSPECT,
  SPEC.md Landing note para 1, recon exhibit 1.
- Default chevron / `hideIcon` / `icon` / trigger `borderBottomWidth` /
  `data-content-present` / `data-reference-accordion-item` chrome removal:
  frozen visuals — crew log SUSPECT, SPEC.md Landing note para 2.
- GSAP `animateCollapse` removal (apps-own-all-motion rewrite) + CSS
  mount-anim suppression impl (`animationName: 'none'` when initially
  open): current owns motion — crew log SUSPECT, SPEC.md Landing note
  para 3, recon exhibit 2.
- `onChangeRef` stale-callback ref: no behavioral delta vs fresh closure —
  crew log SUSPECT.
- Book-only controlled rewrites (`open={false}` / `open={true}` story
  edits): follow from the rejected controlled-only rewrite — quarantine
  diff of `Collapsible.book.tsx`.

## Walkthrough notes for HQ

- Most important (1): `hiddenUntilFound` is deferred, so closed panels are
  invisible to Ctrl+F — in Book `DefaultClosed`, close the panel and try
  find-in-page for "revealed on trigger click": no match. Decide whether
  findability ships and in which prop shape before TESTS.md cases are written.
- Most important (2): uncontrolled mode (`defaultOpen`, internal store,
  `onOpenChange`) is preserved against the freeze catalog's controlled-only
  work-order item 1 — in Book `DefaultClosed`/`DefaultOpen`, toggle with no
  `open` prop at all. Decide whether the freeze catalog or Switch precedent wins.
- Most important (3): GSAP-owned motion is preserved against freeze
  work-order item 3 (apps own collapse CSS) — in Book `Controlled`, expand
  and collapse and watch the height animation run with zero author CSS.
  Measured `--reference-collapsible-content-*` vars already enable
  app-owned CSS alongside; decide whether GSAP stays the kernel.
- Minor: `forceMount` is the only suspected gap with no quarantine source —
  Radix parity for always-mounted content. Worth 30 seconds: does any
  consumer need closed content in the DOM?
