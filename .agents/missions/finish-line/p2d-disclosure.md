# P2D Disclosure — Finish-Line Report

Crew: disclosure. Date: 2026-09-28. Scope: Tabs + Collapsible + Accordion (+ tests/docs). No commits (captain commits).

## Verdict

All three components green on their own runners, React 17/18/19:

| Component | Unit | CT (19 / 17 / 18) | Cases |
| :--- | :--- | :--- | :--- |
| Tabs | 62 passed | 26 / 26 / 26 | 49/49 SPEC |
| Collapsible | 30 passed | 25 / 25 / 25 | 49/49 (39 + 10 CO-MOUNT) |
| Accordion | 32 passed | 21 / 21 / 21 | 47/47 (41 + 6 AC-FIND) |

`pnpm agent vt` also PASSED for both new test files. `tsc` shows no errors in touched component files (pre-existing errors in `playwright/ct.ts`, `Accordion.test.tsx`, `Slot.test.tsx` left alone).

## Tabs (49/49, done prior window — reconfirmed this window)

- Rejoined the P1.1 RovingFocus kernel: `Tabs.tsx` composes `RovingFocus.Root`/`Item`, owns activation policy only (`TabsSelectionSync`). Kernel gained one additive seam (`useRovingFocusContext`), zero behavior change; RovingFocus unit still 50/50.
- Identity registry, `linkageSettled`, TB-DOM-13 dev diagnostics, managed-wins drops, pointer-press arming (no script focus — preserves 22 byte-identical snapshots), editable/retarget guards.
- 16 new `Tabs.cases.test.tsx` unit tests; 7 new stories; CT covers SELECT/AUTO/MANUAL/EVENT/DYNAMIC/NEST/ENV/COMP. PATCHES#1–2 LANDED; DECISIONS#10 overridden by TESTS contract (TB-DOM-13).
- Re-ran this window against current worktree: 62 unit + 26 CT green.

## Collapsible (CO-MOUNT-01–10 + 3 CT — this window)

`hiddenUntilFound` (root default + Content override, Content wins) and `forceMount` landed with `beforematch` expansion:

- Closed until-found content stays mounted with `hidden="until-found"` (declarative `hidden` + pre-paint layout-effect upgrade; React owns removal), stays inert/`aria-hidden`, keeps `aria-controls` linkage, shuts instantly (skip path, no tween).
- `beforematch` opens with enter motion skipped once. Open decision deferred past dispatch via `queueMicrotask`, so a consumer canceler registered after mount still wins; `isConnected` guard. Rejected (controlled-held) reveal arms the skip consumed by the next committed open (pinned CO-MOUNT-08).
- `forceMount`-alone closed content bypasses the collapse engine entirely (no tween, no instant restyle — it must keep author height), carries no `hidden`/inert/`aria-hidden`/pointer-events kill, and skips CO-PRES-07 evacuation. `untilFound` wins over `forceMount`.
- Tween-vs-skip oracle is the exported `finiteGsapTweens` (no spies). CT pins native Chromium semantics: `content-visibility: hidden` (until-found does NOT set `display:none` — spec correction caught by CT-01), cancelable native `beforematch`, focus retention.
- FEATURES #1 + #2 LANDED with settled design calls; SPEC 49/49; TESTS `### Mount retention`.

**Freeze-vs-landing call (proceed-on-take, flagged):** the freeze catalog's Find row said "skips author motion once"; the landing zeroes the GSAP path (no finite tween at all) rather than zeroing durations for a frame — stronger and frame-clean, and the freeze's "apps own collapse CSS" (work-order 3) was already superseded by the preserved `animateCollapse` engine, so there is no author-motion path left to zero. No TESTS contract conflict.

## Accordion (AC-FIND-01–06 + 1 CT — this window, unblocked by Collapsible)

- Only change: `AccordionItem hiddenUntilFound` passthrough to the item Collapsible (raw `<Collapsible id>` items take the root prop directly). Expansion needs zero Accordion code: item-panel `beforematch` → `setIsOpen(true)` → `toggleItem(id)`.
- **Single-swap vs opt-in (settled on take):** single mode swaps the open item. Native `<details name>` parity; no `findExpansion` switch — setting `hiddenUntilFound` IS the opt-in. A suppression flag would be incoherent: the UA reveals until-found content for the match regardless, leaving visible-but-inert closed content. Default-off globally preserved (omit the prop).
- Pinned: controlled request vs committed swap (01/02), multiple-adds (03), cancel + open-item no-op — find never toggles the open item off (04), nested standalone scoping hears nothing (05), raw-id inheritance (06). CT pins the Chromium swap end-to-end including the swapped-out item returning to `hidden="until-found"`.
- FEATURES #1 LANDED; SPEC 47/47.

## Follow-ups (not mine)

- Slot-chain per-render recreation causes slot-wrapped callback-ref churn (settled-correct) — kernel follow-up.
- Overlay modal Escape race on React 17/18; TB-NEST-02 avoids modal Escape — Overlay crew.
- Sibling Combobox in-flight surgery still poisons tooltip hover after type-to-filter; NEST-02 avoids typing. Sibling Listbox/Combobox/DECISIONS.md dirt untouched.
- Runtime flag flips mid-tween (e.g. forceMount toggled during exit) freeze the frame; flags are mount-time config, out of contract.
