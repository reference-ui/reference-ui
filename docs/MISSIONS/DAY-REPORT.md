# Day campaign report — 2026-09-26 (HQ out)

Mission: land PATCHES + obvious FEATURES across `@reference-ui/lib`
on `reference-system`, per [API-STANCE.md](API-STANCE.md) (no V2,
breaking NOW, controlled-only leaning, controllability +
customization themes). Captain: star-captain protocol — delegated
crews, firsthand suite verification before every commit, 1 commit
per arc, visuals frozen (snapshots byte-identical unless noted).

## Numbers

- 36 commits (35 arcs + stance/requirements docs).
- Triage: 105 FEATURES items → 79 IMPLEMENT-NOW / 26 HOLD, plus
  52 PATCHES items (51 mechanical, 1 flagged-then-green).
- Fully landed: Slot, Switch, RovingFocus, Calendar, Combobox,
  DateField, NumberField, Listbox, Tabs, Splitter, Menu, Announcer,
  Portal, Tree, Popover (override seam).
- Correctly empty (verified, no crew needed): Button, Icon, Field,
  Accordion, Collapsible (all-held), FocusLock (all-held), Presence
  (held), Toast/Tooltip (no docs).
- In flight at EOD: Slider-F (last crew, running).
- Parked: Overlay-F commit (crew 4/4 green; gate red-varying under
  HMR churn — commits in the lull after Slider-F).
- Adversity absorbed: 16 child churn-deaths (all retried from
  checkpoints, zero work lost), 1 commit-on-red (below).

## HOLD list for HQ walkthrough (34)

Triage 26 (in
`.agents/missions/quarantine-landing/features-triage.md`): 12
parked pending consumer/evidence, 2 recommend-decline (Menu
press-drag, Menu intent timing), 12 genuine design forks —
headliners: Splitter #11 hit-area trade-off, Tabs #5 press timing,
Menu #7 + Overlay #6 Tab handshake, DateField #2 range fork,
Calendar #9 Tab-commit, Overlay #5 focus retention.

Field additions (8, in triage "Captain amendments"):
1. Listbox #3 Section/Empty removal → JOINT design (Combobox
   re-exports them; triage premise was stale).
2. Listbox #2-model → kernel gap (TypeaheadModel needs
   empty-buffer cycle + collator repeat; RF-side).
3. DateField PATCHES #1 (+ #2/#4/#5/#8 behind it) → visual re-pin
   (locale display repaints all 8 snapshots).
4. NumberField PATCHES §1–§5 + §8 → HQ gates (§8 re-pin, ICU
   handshake, SPEC order).
5. Tabs #2 ↔ RovingFocus #5 contradiction → HQ picks: RF re-adds
   currentness input, or Tabs stays forked.
6. Combobox #6 + Tree #1 circular → HQ sequences (neither can move
   first).
7. Tree #3 Slot registration → SSR wall (proven: effect-timed
   registration invisible to renderToString; keep scan or pay SSR).
8. Presence #1 GSAP delete → premise refuted (Collapsible is a
   load-bearing consumer; GSAP stays or Collapsible migrates).

## Captain's calls (HQ can overturn)

- Tabs #1 DEVIATION (accepted, reversible): `variant` stays in the
  kernel. The crew proved Book-side recipes uncollectible under
  concurrent churn (15+ probes); 22 snapshots byte-identical, full
  matrix green. Strip deferred pending collector story.
- DateField proof realignment: min/max days now assert
  disabled-unclickable (+ force-click no-commit); unavailable stays
  enabled-but-DateField-rejected until PATCHES #4. Follows committed
  Calendar-B; nothing weakened.
- Menu LINK03 red (commit 5e630106a): my `&&`-chain committed
  through a grep that exits 0 on matches — process error, now fixed
  (tee-gate: `Failed: 0` required). The spec went green in 3
  consecutive later runs (likely P3's role correction); fix crew
  stood down. Tree was red 48/49 for one commit; HEAD is green.
- Consumer migrations swept by hand where crews missed them:
  DateField locales (Field.story ×2, Showcase ×1 — had Field red),
  NumberField stepper labels (×8). All verified green.

## Still open (not holds)

- Slider-F (controlled-only, thumb identity, key strip, drag
  hooks, hit-area) — running; then Overlay gate in the true lull
  (zero crews), then campaign COMPLETE.
- Playtest backlog: 40 bugs + 26 accepted wants in
  [PLAYTEST-REQUIREMENTS.md](PLAYTEST-REQUIREMENTS.md) — untouched,
  queued (beyond today's brief). Headliners: Presence exit wedge
  (Critical), DateField zero validation (Critical), Menu.md
  composition crash (P0).
- Doom cycles + playtest-doom (standing objective 6): start when
  the tree is fully committed.
- EOD hardening queue: cross-runtime spot pass (`--react all` on
  effect-heavy arcs), tsc baseline noise in flight dirs, Popover
  Content wrapper still `role=dialog` (pre-existing).

## Tree state at EOD

HEAD green except: Slider dir (in-flight crew) + Overlay dir
(crew-done, commit parked). Everything else committed and
firsthand-verified (unit + e2e React 19; several arcs also
`--react all` crew-side).
- Tabs DECISIONS/FEATURES dirt = unit 155 live work (HQ DECISION block), not strip-race.
- Theming probe out as unit 156 (read-only inventory+stability+override, own log). HQ: stable per-component className sets; vision to follow.
- HQ 2026-09-27: docs phase deferred until wants land + lib productionized. Docs crew parked (B-05/06/07/25, W-11/13/19/30/32, W-26/27); W-31 CI gate still rides packaging.
- Playtest bug wave dispatched: units 158-163 (date/menu/combo-list/fields/presence/packaging). Primitives (B-09/37/40) rejected on capacity, retries when a slot frees. Docs crew parked per HQ; B-08 Tabs held until 155 lands.
- Unit 162 (presence) died pre-log with no dirt; relaunched fresh as 164 with log-first brief. Primitives still queued (pool full).
- 155 landed+committed (60295e8a7 Tabs system-variant). B-08 fixed in source, compiled CSS verified, TB-DOM-05 red as intended; baseline update HELD for HQ confirm. LESSON: agentct e2e does not re-sync; style edits need pnpm --dir packages/reference-lib sync first or e2e verifies stale CSS.
- 159 landed+committed (Menu B-27/B-32/B-33/W-28/HQ-dismiss; 22 unit + 60 e2e firsthand green). HOLD for HQ: choice-item handler naming (canonical onChange + Radix aliases) — strip one pre-release?
- 161 landed+committed (4 commits: NumberField B-19/B-26/B-36, Slider B-29, Collapsible B-12, Splitter pins; all firsthand green). B-26 hold-repeat disproven as NOT-A-BUG; Splitter trio already-fixed+pinned. Showcase spinbutton fallout routed as unit 166.
- 166 landed+committed (Showcase spinbutton fallout; 3/3 e2e firsthand green).
- 160 landed Combobox (4df9bb4d3); Listbox HELD for HQ snapshot confirm (intended B-38 red, 26/27). 164 landed Presence+FocusLock (B-01/B-03). 165 landed Tooltip/Toast/Button (B-09/B-37/B-40). Daemon contention caused two false-red bursts (Listbox 10, Toast 6); solo reruns green.
- 158 landed Calendar+DateField (B-15/16/23/24 fixed, B-17/18 verified; 63+30 unit, 50+44 e2e firsthand green). HOLDs for HQ: (1) B-36 reverses FEATURES #13 triage; (2) DateField baselines show pre-fix ISO text (pass in tolerance) — refresh in snapshot batch. DateField unit false-red under parallel load (30/30 solo).
- HQ order 2026-09-27: bring reference-lib home (bugs+wants, NO theming). Wants wave dispatched (7 crews); tabs-wants HELD behind B-08 snapshot confirm (dir collision), W-04 HELD behind B-10. Snapshot batch (B-08/B-38/DateField) prepped for one-glance HQ sign-off on return.
- 168 landed Tree W-17 (7 unit + 55 e2e firsthand green).
- 171 landed Presence W-09 (20 unit + 13 e2e firsthand green; nested-wedge fire proven).
- 173 landed W-35 (Slider 44+36, Splitter 33+66 firsthand green; audit doc: NumberField/Calendar/Listbox/Tree need follow-ups).
- 169 landed Calendar W-20/W-21 (67 unit + 52 e2e firsthand green; no visual drift).
- 167 landed NumberField W-02/W-25 (58 unit + 23 e2e firsthand green). HOLD for HQ: 6 snap/validate semantics rulings (RAC-exact vs TESTS.md freeze vs signed-off spec — lattice anchor, tie-breaks, validate-reject vs publish-invalid). 163 packaging gated on 174 tsc-cleanup (build &&-chain dies at tsc, B-35 patch never runs otherwise).
- 174 landed (c88c5844b); packaging committed (1195c9ea9 + 988cc884b) with build exit 0 + B-35 patch proven in dist. Firsthand smoke HELD for quiet tree (170 mid-flight trips check:dist by design). 172 Menubar DONE but ships defaultValue (stance violation) — unit 175 converting to controlled-only. HOLD for HQ: onValueChange vs onChange naming (same question as Menu choice aliases).
- 170 landed Combobox W-24 (84 unit + 77 e2e firsthand green; closeOnBlur kept deliberately per crew verdict).
- 172+175 landed Menubar W-29 controlled-only (17 unit + 23 e2e firsthand green; defaultValue deleted at gate).
- Firsthand smoke reproduces crew's 41/5 exactly (H-4/B-28/H-6 foreign; b03=0). B-28 REOPENED (minSize/maxSize leak live in fresh dist — earlier verdict covered wrong names). Dispatched follow-splitter (H-1+B-28) + follow-tree (H-2). Compiler handoffs H-3/H-4/H-6 + W-04 recorded for HQ scope decision (not lib work).
- 177 landed Tree H-2 (7 unit + 56 e2e firsthand green; zero {colors} placeholders in sheet).
- 176 landed Splitter B-28+H-1 (35 unit + 67 e2e firsthand green; legacy minSize/maxSize kept as deprecated solver aliases, min-wins — reversible if HQ wants deletion).
