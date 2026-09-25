COMPLETE — Tabs quarantine-landing crew
Branch: reference-system (aa95c7005 at start); quarantine tip 89850d1c8 read-only via git show/diff. Never switch, never commit.
Dir: packages/reference-lib/src/components/Tabs/ (confirmed capital-T Tabs)

## Plan
1. Baseline `pnpm agentct Tabs` before changes.
2. Diff quarantine Tabs freeze commit a49fc0626 (source 632/257, colocated 31/22, matrix unit +1181, e2e +610) vs base/current.
3. Port ONLY stability + test-case wins; visuals frozen (SUSPECT per recon §4-6).
4. Prove after with agentct; view-story visual check; ux-designer sign-off.

## Progress
- 2026-09-25: claimed crew, confirmed dir, read LANDING.md + QUARANTINE_RECON.md + test-component/view-story/ux-designer skills.
- Baseline `pnpm agentct Tabs`: unit 2/2, CT 3/3 react19 green (snapshots frozen).
- Recon analysis: quarantine Tabs (a49fc0626) = controlled-only rewrite + RovingFocus + registration maps. SUSPECT (not ported): required-value throw, defaultValue/variant/root-disabled removal, pill deletion, chrome edits (textShadow/boxShadow/focus-offset), weakened colocated tests. Salvageable: 30 matrix unit + 19 e2e case IDs → re-targeted to current API.
- Ported into Tabs.tsx (zero visual change): P1 nested-tablist scoping (TB-NEST-01); P2 redundant onChange suppression (TB-SELECT-04/MANUAL-04); P3 RTL horizontal reversal read live at event time (TB-AUTO-02/06); P4 disabled never tab stop (TB-DOM-08/11); P5 roving stop follows focus, selection re-syncs (TB-DOM-03/MANUAL-01) + wire dropped consumer onFocus; P6 useId baseId replacing module counter (TB-DOM-07/ENV-01, matches Collapsible/Overlay idiom); P7 duplicate value throw (TB-DOM-10).
- Tests: Tabs.test.tsx 2 → 17 (all colocated, current API incl. uncontrolled guard); stories +3 (Manual/Rtl/Nested); CT 3 → 6 (new ones assertion-only, no snapshots).
- SURPRISE 1: first CT run — new TB-NEST-01 asserted inner selection after outer switch, but inactive panels unmount children (current policy). Fixed the TEST to pin unmount + controlled-state restore; architecture unchanged (always-mount deferred, flagged for UX).
- SURPRISE 2: `--react all` — P7 as render-phase claiming (quarantine mechanism) FALSE-POSITIVEd on react17/18 (hook state resets between double-render invocations). Reworked to effect-with-cleanup claiming; now 18/18 CT (6×3 majors) + 17/17 unit green. Quarantine mechanism itself is version-fragile — do not lift blindly elsewhere.
- SPEC.md: proof index 3 → 18/49 (incl. recording TB-DOM-02/05 from pre-existing CT titles per legend); manual-roving gap marked fixed.
- Deferred with rationale: required-controlled-value / API removals (breaking); RovingFocus composition (concurrent crew + rewrite risk); registration maps + anatomy console.warns (noise, marginal); pointerdown-early activation / blur-order / focus-rescue (behavioral additions needing UX design); always-mounted panel children (state/effects semantics change); all visual chrome diffs (SUSPECT).
- Known gap: disabled-selected tab leaves zero tab stops until focus lands (no registration → can't find first-enabled); native disabled is unfocusable anyway. Flagged for UX review.
- view-story check (Playwright MCP, Book :5000 already up, reused): Horizontal resting + click-to-Password (indicator + panel swap correct), Pill resting (track + selected pill correct), Vertical + live ArrowDown (focus ring, selection, panel all follow). A11y trees correct (tablist/tab/tabpanel). Console 0 errors on all stories; warnings are pre-existing css() static-miss notices (Book chrome + pre-existing transition string), untouched.
- Nested ux-designer review spawned (tabs-ux-review); verdict: **APPROVE** — look PASS (no drift, all 3 stories), all 7 feel changes approved with rationale, a11y good. Residual non-fails: (a) disabled-selected zero tab stops is pre-existing, now honest markup — first-enabled fallback needs a registration map, follow-up; (b) suggests Book stories for manual/disabled/RTL/nesting as follow-up (CT covers them; book left frozen deliberately).
- Reviewer method note: shared Playwright MCP browser was contested by another crew (tab navigated to Slider mid-test), so reviewer fell back to sanctioned `pnpm capture` (isolated Chromium); earlier MCP End-key anomaly did NOT reproduce in isolation. Evidence: `.reference-ui/captures/Tabs_*.png` (reviewer's, untracked).
- Handoffs: (1) Quarantine render-pass duplicate mechanism is React 17/18-fragile — other crews must NOT lift it blindly; use effect-with-cleanup claiming. (2) Always-mounted panel children + RovingFocus composition + pointerdown/focus-rescue behaviors deferred to a future interaction-design pass. (3) No files outside Tabs dir + this log touched; never switched branches; nothing committed — arc is commit-ready as one component commit.
