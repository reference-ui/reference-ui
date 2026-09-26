# FEATURES Overlay crew log

Branch: reference-system (never switch; never commit).

## Checkpoint plan (before further reads)

Read so far: triage Overlay section (6 items, #1–#4 IMPLEMENT-NOW, #5/#6 HOLD),
`Overlay/FEATURES.md` full text, `docs/MISSIONS/API-STANCE.md`.

- #1 shadow destination rule (AUTOMATIC): implement `getRootNode()` default for
  `Overlay.Portal container` when trigger/source lives in an open ShadowRoot +
  documented rule + Overlay-level CT proof (trigger in shadow). Unblocks 4
  parked sibling cases; Menu PATCHES #3 + DateField PATCHES #7 remainders go to
  micro-crews after.
- #2 layer/dismiss accounting (coordinator-logs + prose/CT audit): publish
  contract prose (one layer entry per coordinator/Content pair; one
  granular-before-high-level sequence per modality; branch-not-layer for
  nested) + CT audit. Dev diagnostic only if double-registration bites.
- #3 granular dismiss vocabulary canonical (real-events-everywhere): bless
  proven `onEscape`/`onOutsidePress` → `onDismiss` shape (real DOM events,
  same ordering, preventDefault semantics); no new verb without a consumer.
- #4 closed-content observability (NON-GOAL (b)): unmount-when-closed stays
  absolute; document; coordinators read authored children + metadata.
- HOLD #5/#6 untouched (Tab-bridge + focus retention forks).

Proof: read test-component skill, `pnpm agentct Overlay` (unit+e2e green) +
rerun Popover suite as collateral. Visuals: Overlay headless — any snapshot
change needs view-story inspection + UX sign-off, else STOP and flag. Nested
ux-designer review (self-review by method + flag if pool-full).

Touch only: Overlay dir + this log (+ in-repo Overlay-consumer call sites ONLY
for API migration, listed).

## Log

- Plan checkpointed. Next: incremental reads — Overlay dir listing, then
  Portal/coordinator/dismiss sources, DECISIONS.md, then implement.
- Read: Portal.tsx (container default body), Overlay.tsx, Content.tsx (portals
  via context.portalContainer), Trigger.tsx, use-overlay-layer.ts, dismiss
  listeners (proven OV-ESC/OUT shape), DECISIONS.md, OV-OUT-09/OV-ENV-03 CTs +
  ENV-03 fixture (consumer-authored container today). Next: Backdrop, stack
  store, coordinator consumers.
- Read: Backdrop (also portals via portalContainer), stack store (addLayer/
  parentId branch), Popover (passes overlayProps through; no synthetic events),
  Menu NestedMenu (own Overlay root + real PointerEvent + preventDefault),
  Combobox authored.ts (consumer half of #4 already landed), SPEC proven
  kernel, nested/exotica/outside fixtures, Overlay.md TOC, test-component
  skill. Only Content/Backdrop consume portalContainer for portaling; Menu
  reads it for explicit-only inheritance.
- IDs: OV-ENV-04/05-check — ENV-04 taken (StrictMode), LAYER-07/ESC-05/OUT-10
  taken. New: OV-ENV-05 (#1 auto shadow), OV-LAYER-11 + OV-ESC-08 + OV-OUT-12
  (#2 audit + #3 real events), #4 cites OV-DOM-01/05 (no new CT).
- PLAN: (1) new parts/portal-container.ts resolvePortalContainer + use in
  Content/Backdrop + happy-dom unit test; (2) exotica ENV-05 fixture section
  + spec; (3) new accounting-fixture + story + OV-LAYER-11/ESC-08/OUT-12 spec;
  (4) docs: Overlay.md (Portal rule + accounting + vocabulary + closed
  content), FEATURES.md landed #1-#4, DECISIONS.md landed note, SPEC new IDs
  + #4 non-goal; (5) migration sweep grep; (6) agentct Overlay + Popover
  collateral + ux-designer review.
- IMPLEMENTED all of (1)-(4). Files: parts/portal-container.ts (new),
  parts/portal-container.test.ts (new), parts/Content.tsx, parts/Backdrop.tsx,
  fixtures/exotica-fixture.tsx (ENV-05), fixtures/accounting-fixture.tsx (new),
  Overlay.story.tsx (Accounting), __e2e__/Overlay.ct.spec.ts (LAYER-11/
  ESC-08/OUT-12), __e2e__/OverlayExotica.ct.spec.ts (ENV-05), Overlay.md,
  FEATURES.md, DECISIONS.md, SPEC.md.
- SWEEP (stories+books+Showcase+tests): explicit containers everywhere
  unaffected; Tooltip/Popover forward optional container (omitted+light-DOM
  still body); Menu explicit-only inheritance unaffected; Combobox explicit
  setPortalContainer wins (helper now redundant but functional — their
  remainder); Toast/Slider/Tabs/FocusLock shadow stories contain no Overlay;
  Showcase light-DOM only. ZERO consumer call-site edits required.
- PROOF: unit 34/34 (incl. 4 new resolver tests). New CTs OV-ENV-05 and
  OV-LAYER-11/ESC-08/OUT-12 green (repeat runs). Full Overlay suite (119):
  108/105/pass + wandering timeout/fast-fail sets across 3 runs under machine
  load 25-44 (concurrent campaign crews on shared daemon); ALL 25 distinct
  failing IDs re-verified green in isolation (incl. both OV-PRES-02 variants
  by line). Zero snapshot failures in any run; OV-HND-VISUAL passed (no
  visual drift). Popover collateral: 17/18 full + PO-HOVER-05 green alone;
  unit 20/20. tsc: no Overlay errors (sibling-component errors pre-existing,
  untouched).
- UX: nested ux-designer review PASS on look/feel/a11y (child
  01a0deac-3fc6-7cd3; read-only). No view-story needed: no snapshot change.
- FLAGS: (1) Real trusted click does NOT dismiss a backdrop-less modal via
  the deferred document path (pointerup-microtask cleanup in
  dismiss/listeners.ts eats pending before the click task; OV-OUT-11's
  synthetic dispatch is same-task so it passes) — frozen kernel quirk, out
  of scope, possible future PATCHES item; my ENV-05 CT mirrors OV-OUT-11.
  (2) Full-suite green unattainable while shared-machine load stays 25-44;
  evidence is full runs + isolated verification of every failure.
  (3) Videos unreadable here (binary refs unsupported + result rotation by
  concurrent crews); settled screenshots + assertions are the evidence.
  (4) Combobox shadowContainerForSource now redundant but functional —
  Combobox/micro crew remainder. HOLD #5/#6 untouched.
