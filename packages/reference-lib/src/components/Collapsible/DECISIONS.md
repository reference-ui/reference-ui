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

## Candidate features (moved)

- hiddenUntilFound / beforematch find-in-page reveal — moved to FEATURES.md #1 (needs design: prop shape, semantics).
- (Mechanical candidates, if any, live in PATCHES.md — currently none.)

## Suspected gaps (moved)

- forceMount (always-mounted Content) — moved to FEATURES.md #2 (needs design: hidden/inert semantics, composition).
- (Mechanical gaps, if any, live in PATCHES.md — currently none.)

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

- Most important (1): find-in-page reveal is deferred — see FEATURES.md
  #1, then feel it in Book `DefaultClosed`: close the panel and try
  find-in-page for "revealed on trigger click" — no match. Decide whether
  findability ships and in which prop shape before TESTS.md cases are written.
- Most important (2): uncontrolled mode (`defaultOpen`, internal store,
  `onOpenChange`) is preserved against the freeze catalog's controlled-only
  work-order item 1 — feel it in Book `DefaultClosed`/`DefaultOpen` by
  toggling with no `open` prop at all. Decide whether the freeze catalog or
  Switch precedent wins.
- Most important (3): GSAP-owned motion is preserved against freeze
  work-order item 3 (apps own collapse CSS) — feel it in Book `Controlled`:
  expand and collapse and watch the height animation run with zero author
  CSS. Measured `--reference-collapsible-content-*` vars already enable
  app-owned CSS alongside; decide whether GSAP stays the kernel.
- Minor: `forceMount` is the only suspected gap with no quarantine source —
  see FEATURES.md #2, then worth 30 seconds: does any consumer need closed
  content in the DOM?
- Mechanical follow-ups, if any, live in PATCHES.md — currently none, so
  every open item is a design call in FEATURES.md.
