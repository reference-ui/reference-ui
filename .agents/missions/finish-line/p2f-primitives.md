# P2F primitives/matrix — crew report

Status: DONE 2026-09-28. Five parallel crews, no commits (captain commits).
All writes confined to `Presence/ Portal/ FocusLock/ Announcer/ Splitter/`
under `packages/reference-lib/src/components/`. Other working-tree changes
(Calendar/DateField/Menu/NumberField/RovingFocus) belong to parallel crews.

## Scoreboard

| Component | Was | Now | Runners (observed green) |
| --- | --- | --- | --- |
| Presence | 28/59 | **60/60** (59 + new `PR-GSAP-01`) | CT 45/45 (r19), unit 20/20 |
| Portal | 17/25 (in-flight SPEC) | **25/25** | CT 22/22 ×3 majors (66/66), unit 9/9 |
| FocusLock | no ledger | **TESTS.md 78 cases**; suite still green | CT 44/44, unit 18/18 |
| Announcer | 7/41 | **43/46** (SPEC actually holds 46 IDs) | CT 35/35, unit 15/15 |
| Splitter | 72/83 | **83/83** | CT 79/79, unit 35/35, 7 baselines unmodified |

## Presence — GSAP verdict: KEEP (maintainer-take conflict flagged)

`Collapsible.tsx:421` renders `<Presence present>` around content whose exit
motion is GSAP-owned (`CO-PRES-02` "GSAP holds the exit", `CO-PRES-03`
reduced-motion shortcut) — a proven in-repo consumer, contradicting
FEATURES §1 "lean delete — no proven consumer". `Presence.tsx` untouched;
GSAP wait documented as a deliberate extension (Presence.md section, SPEC
Surface row, `PR-GSAP-01` proof in TESTS.md). 32 new CT tests + 8 fixtures
ported INSTANT/TRANSITION/ANIMATION/RACE/NEST/COMP tails and browser
re-proofs of `PR-DOM-02/03`. Harness notes: reduced-motion emulation floors
durations at 1e-05s (`PR-INSTANT-05` pins accordingly); gallery StrictMode
double-refs mean `PR-DOM-05`/`PR-COMP-01` assert contract shape, not counts.
Runner note: `pnpm agent vitest lib -t "X"` (AGENTS.md form) is broken in
this runner rev (`lib` becomes a `-t` pattern; second `-t` crashes CAC
parsing) — component-target form used instead.

## Portal — 25/25, real bug fixed

Preserved and completed the in-flight seam-ledger work (untracked SPEC.md +
`Portal.test.tsx` additions). 7 new CT specs on a `CoverageFixture` story
(`PT-DOM-02/04/06/07`, `PT-COMP-01/02`, `PT-ENV-04`) + 2 unit pins
(`PT-REACT-03/04`). `PT-ENV-04` exposed a genuine engine bug: direct
iframe-document elements failed `resolveContainer`'s `instanceof Element`
check (cross-realm globals) so Portal silently rendered nothing — fixed
minimally in `Portal.tsx` via realm-safe `nodeType`. NEXT.md matrix counts
retired (CT supersedes). 6 `PT-THEME` guards still green, no new snapshots.

## FocusLock — ledger written, dispositions recorded, no code changes

New `TESTS.md`: 78 cases transcribed from SPEC (ID-set diff SPEC↔TESTS
empty; no new `FL-*` titles). crossFrame + TalkBack verified
deferrable (no `contentDocument` traversal callers, per-Document stacks, no
TalkBack repro) and recorded DEFERRED with revisit conditions in
FEATURES.md §1/§2 and TESTS.md out-of-scope.

## Announcer — PATCHES#1/#2 LANDED, Must rows all resolved

Repo-wide grep: zero `data-testid` announcer consumers — aliases already
gone from host output; `ANN-DOM-05` retired, no-testid pin lives in the
`ANN-DOM-01` CT. Diagnostic already dev-gated + once-per-shape, now also
browser-pinned by `ANN-API-05` (two untargeted `Nope` calls, neither host
mutates, exactly one warning). 34 new CT tests across 6 fixtures with
dual-titled siblings; SPEC defects 1–2 verified fixed by
failing-if-regressed tests (`ANN-LIFE-04/05`, `ANN-API-05`). Still
unproven (2, parked with SPEC notes): `ANN-ENV-05` (needs a second JS realm;
single-realm CT cannot host it), `ANN-COMP-03` (no field primitive calls
`announce()` in source).

## Splitter — 83/83, #11 shipped on recommendation (FLAG)

All 11 tails proven (12 new CT tests; `SP-ENV-02` green on React 17/18/19;
`SP-KEY-03` adapted: fixture max 60 vs prose 55, noted in-test). Engine
gaps closed: Panel/Handle now `forwardRef` with composed consumer refs;
`data-orientation` added to Panel + Handle. PATCHES#5 LANDED with matrix
remainder honestly documented (Firefox/WebKit legs of `SP-ENV-04` and
`[browser:all]` tags — CT is Chromium-only). 7 visual baselines unmodified.
**FLAG: FEATURES #11 (9px vs 24px) implemented per maintainer
recommendation WITHOUT explicit HQ acceptance of the click-strip
trade-off, per HQ FULL-BLAST order** — transparent `::before` strip,
±8px/side (25px total), axis-aware, pinned by `elementFromPoint` CT on both
axes; recorded in FEATURES.md, SPEC.md, and the CSS source comment.

## True blockers / needs

- None blocking. HQ attention wanted: (1) Presence GSAP item closed as
  documented extension — re-open only if HQ wants the delete; (2) Splitter
  #11 click-strip trade-off acceptance; (3) `ANN-ENV-05`/`ANN-COMP-03` need
  matrix-second-realm / a real field announcer caller; (4) runner-team:
  `pnpm agent vitest lib -t` form broken.
