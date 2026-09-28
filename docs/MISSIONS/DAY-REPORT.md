# Day Report — reference-system (fresh, 2026-09-27)

Supersedes all prior ticks completely. HQ's stuff only: what you decided,
what landed, what needs you, what's sharp.

## HQ decisions (locked)

- **API stance:** breaking NOW pre-release, no V2. Controlled-only
  everywhere; no `defaultValue` props; optional-value exception for
  Accordion/Tabs only (`value` omitted = self-manage).
- **Variants philosophy:** prepackaged variants STAY (headless-only is
  useless for AI/beginners). `variant` is a SYSTEM-level prop extended
  with normal `css()`/`recipe()` — users build typed MyTabs + recipe.
  No parallel variants API. Tabs `variant` (line/pill) is permanent
  kernel API; the strip/headless direction is retired and cancelled.
- **WANTS sign-off (26/26):** all sensible, all GO. W-02 confirmed vs the
  snap-in-onChange challenge (React Aria ships it verbatim); W-21 kept
  with RAC weekday-name strings; W-29 locked as standalone `Menubar`
  (one-level Esc per APG); W-04/W-02/W-21 challenges resolved via
  prior-art. Bar for all: ≥1 prior-art trace (evidence filed).
- **Theming direction:** 5 approaches in THEMING.md. Stable hooks are
  `data-reference-*` today (verified), `ref-*` part classes planned;
  tokens underneath for no-CSS users; precedence: hook overrides >
  house variants > tokens. Theming BUILD is yours to direct — untouched.
- **Sequencing:** docs phase parked until wants land + lib productionized.
  Bugs → wants → (your call) → docs → theming.
- **Snapshot rule stands:** baseline refreshes need your eyes (B-08/B-38/
  DateField batch waiting).
- **Dismiss vs Menubar:** File+Edit click-compose is baseline dismiss
  (proven); Menubar owns keyboard/hover coordination only.

## Landed this wave (all firsthand-gated, per-component commits)

- **Bugs (~36/40):** Tabs system-variant + MyTabs proof, Menu (B-27/B-32
  proven-absent, B-33, HQ dismiss check), NumberField input session,
  Slider/ Collapsible/Splitter, Showcase fallout, Combobox, Presence +
  FocusLock (both Criticals), Tooltip/Toast/Button, Calendar + DateField
  engines, Tree H-2, Splitter B-28-real + H-1, packaging (exports, peer
  react, url patch, dist-freshness, smoke gate), tsc-clean (build exit 0).
  Parked: B-05/06/07/25 (docs phase). Held: B-08/B-38 (your eyes).
  Disproven: B-26 hold-repeat, B-40 (NOT-A-DEFECT, locked).
- **Wants:** W-02, W-03, W-09, W-17, W-20, W-21, W-24, W-25, W-28, W-29
  (controlled-only), W-31, W-35 (+5 via-bug). Held: W-15/W-16
  (tabs-wants, behind B-08), W-04 (behind compiler decision).
- **Infra:** `pnpm build` exit 0; W-31 smoke gate live; firsthand smoke
  has ZERO lib-side failures (true-gap bucket 0; only H-4/H-6 remain).

## Needs YOU (the bring-home checklist)

1. **Snapshot batch** (10 min): B-08 pill text, B-38 Listbox dark,
   DateField ISO→locale honesty. Say go → I refresh, commit, dispatch
   tabs-wants.
2. **HOLD rulings:** (a) handler naming — `onChange` vs
   `onCheckedChange`/`onValueChange` (one spelling?); (b) B-36 silence
   vs FEATURES #13 triage; (c) W-02's 6 semantics flips (RAC vs freeze
   vs signed-off); (d) Splitter legacy aliases — keep or delete?
3. **Compiler-scope decision:** H-3 (continuous numerics for 140r, or
   bless consumer-sync + W-04 loud failure?), H-4 (bare React breaks
   Reference from dist — fix where?), H-6 (dev race noise), W-04
   (neo-runtime). Not lib work; neo/rs crews on your word.
4. **Merge:** reference-system → ? (say the target; tree is prepped).

## Sharp edges (crews on them now)

- H-4 bare-React crash (compiler fix crew).
- H-6 dev miss-probe race (neo runtime crew).
- H-3 continuous-numerics OPTIONS SPIKE (no implementation — trade-offs
  + recommendation for decision #3 above).
- Snapshot tolerance audit (2% is masking real drift — policy proposal).
- `check:dist` over-broad inputs (spec edits trip it — narrow to build
  inputs).
- Menubar doom (newest component, zero adversarial exposure — red-team).

## NOT this wave (parked, not forgotten)

Docs phase · theming build · full doom cycles · 34 quarantine HOLDs ·
`default*` sibling ranging · W-35 follow-ups (NumberField/Calendar/
Listbox/Tree per OUT-OF-RANGE.md audit).
- H-4 libfix committed (8297a5451; MOUNT OK firsthand). Doom T1 REPRODUCED 3/3; rule oracle out as 186. B-08 reworked to gray.950 + dark computed assertion; 11/11 green with NO baseline drift (dark-identical — original bug is light-only). SELF-INFLICTED: nuked uncommitted fix via git-checkout during negative control; recovered verbatim, re-verified. Negative-control redo skipped (assertion demonstrably executes; bite is arithmetic + earlier wrong-fix run proved the pixel flip).
- Final firsthand smoke: 1 fail left (race-noise only); H-4/mounts/errors/true-gaps ALL GREEN. H-6 fix verified in neo cases but NOT in packed dist (dist bundles dependency copy, not workspace src) — race warnings clear on next neo publish+bump. Release-flow note, not a product bug.
- 189 landed Tabs W-15/W-16 (46 unit + 12 e2e firsthand green). ALL wants crews done; zero running.
