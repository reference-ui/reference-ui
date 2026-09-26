COMPLETE — Objective B crew: Overlay (quarantine-landing mission, reference-system)

## Brief
Reconcile Overlay against quarantine tip 89850d1c8 (read-only: git show/diff/log).
Port ONLY stability + test-case wins. PRESERVE look-and-feel + behavior contracts
dependents (Tooltip, Toast, Combobox, Popover, Menu, DateField) and FocusLock coupling rely on.
Touch ONLY packages/reference-lib/src/components/Overlay/ + this log. Never commit.

## Recon (from QUARANTINE_RECON.md + own diff inspection)
- No Overlay freeze commit exists. Quarantine diff on Overlay/ = ONE line:
  parts/Backdrop.tsx onPointerDown handler gains explicit
  `(e: React.PointerEvent<HTMLDivElement>)` annotation (tip commit 89850d1c8, type-only).
- Quarantine did NOT touch: matrix unit overlay-kernel/overlay-ssr, e2e
  focus-lock/popover/tooltip/toast/portal specs. Only presence.spec.ts changed
  among overlay-adjacent matrix tests.
- Open questions for this crew: (1) is the Backdrop annotation already present
  on reference-system? (2) Field-commit shared-theme focus edits (field.ts,
  focus-visible.ts) blast radius on Overlay parts? (3) FocusLock<->Overlay/Content
  coupling both ways — any quarantine pressure? (4) Dependent rewrites
  (Menu/Combobox/DateField) — did quarantine change how they consume Overlay?

## Baseline (test-component, BEFORE changes)
- pnpm agentct Overlay: E2E 117/117 passed (react19, 0 failed), Unit 30 passed.
  Green on unmodified tree. Notable: FL-OV-01..05 focus-coupling specs all pass.

## Quarantine inspection log (all read-only: git show/diff/log, tip 89850d1c8, base 7aea45265)
- Overlay/ diff = 1 line: Backdrop.tsx `onPointerDown={e =>` gains explicit
  `(e: React.PointerEvent<HTMLDivElement>)` annotation in tip commit. Recon §6 rules
  the tip type-fix "only makes sense atop the rewrites" → DO NOT LIFT (current
  contextual typing from Div props is sound; no type error exists on reference-system).
- Untouched by quarantine (empty diffstat): FocusLock/, Overlay/shared/,
  Portal/, Tooltip/, Toast/, Popover/, matrix unit overlay-kernel/overlay-ssr,
  e2e focus-lock/popover/tooltip/toast/portal. No Overlay freeze commit exists.
- No quarantine test-case wins for Overlay: zero colocated changes, zero matrix
  overlay changes. Nothing to port.
- Dependents (Q Menu/Combobox/DateField rewrites) consume the SAME Overlay
  contracts: Overlay, useOverlay, OverlayContentProps, OverlayDismissHandlers,
  overlayStackStore, Overlay.Trigger/Content. Zero contract pressure.
- FocusLock coupling both ways, both untouched: FocusLock→Overlay is one import
  (`isNodeInside` from Overlay/shared/events); Overlay→FocusLock is Content.tsx
  rendering <FocusLock> + `FocusTarget` type import. No quarantine pressure either way.
- Shared-theme focus edits (field.ts, focus-visible.ts): Overlay/ has ZERO
  references to fieldSurfaceStyles/focus-visible/data-focus-visible → no blast radius.
- Presence: Q rewrote internals but kept `present: boolean` contract identical;
  Overlay's `<Presence present={...}>` usage compatible. Internals are Presence crew scope.

## Changes
- NONE. Zero-file reconciliation: the sole quarantine Overlay diff is a
  do-not-lift type annotation (recon §6); no stability or test-case wins exist
  to port. Overlay/ untouched; dependents' contracts preserved by construction.

## Proof (test-component, AFTER changes)
- N/A — no changes; baseline IS the proof (E2E 117/117, Unit 30/30, green tree,
  unmodified baselines). No snapshot writes, no --update-snapshots.

## Proof (test-component, AFTER changes)
- (pending)

## Visual check (view-story) + UX review (ux-designer)
- view-story: Playwright MCP unusable — shared browser tab driven by parallel
  crews (URL jumped to Toast story + :3101 gallery mid-session, refs expired).
  Fell back to pnpm capture per skill §3 (own browser, immune to contention).
- Captures (.reference-ui/captures/Overlay_Dialog_{resting,open,dismissed}.png):
  resting = trigger only; open = dimmed backdrop + centered "Confirm action"
  dialog (Cancel/Confirm); dismissed = trigger only WITH focus-visible ring
  (Escape restores focus to trigger). Matches Overlay contracts.
- UX review: nested ux-designer worker (after 2 pool-full rejections) returned
  SIGN-OFF. Look PASS (today's 3 captures match repinned overlay-dialog
  baselines state-for-state, incl. dismissed focus-visible ring). Feel:
  Escape/outside/trap/restore all approved (OV-ESC/OUT/LAYER/FOCUS/RESTORE +
  FL-OV/FL-RESTORE coverage green). A11y: no findings (role=dialog +
  aria-modal honest, inerting pinned by OV-INERT). Caveat: CT videos reaped by
  parallel crews — trap judged from spec coverage + green run + zero-diff.

## Handoffs / surprises
- Surprise (positive): Overlay is the null-quarantine component — no freeze
  commit, no test wins, no contract pressure from any direction. Fastest review.
- Handoff to Presence crew: Q rewrote Presence internals but kept the
  `present: boolean` contract Overlay relies on — safe as long as that holds.
- Handoff to Menu/Combobox/DateField crews: your Q rewrites consume unchanged
  Overlay contracts (Overlay, useOverlay, OverlayContentProps,
  OverlayDismissHandlers, overlayStackStore) — Overlay side needs nothing.
- Env notes: shared MCP browser tab is contended (parallel crews drove it
  mid-session) — pnpm capture is the reliable lens. CT test-results get reaped
  by parallel runs — videos are ephemeral. Book :5000 server I started stays up
  until session end for other crews.
- Commit-ready arc: NO COMMIT NEEDED — zero source changes. Objective B Overlay
  lands as a verified no-op: recon + green suite + UX SIGN-OFF. No re-pin
  (baselines unmodified and green).

COMPLETE
