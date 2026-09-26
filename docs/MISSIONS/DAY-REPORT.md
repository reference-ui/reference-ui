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
