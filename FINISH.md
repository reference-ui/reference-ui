# FINISH — the last mile to production-ready

Status as of 2026-09-29, HEAD `b764ee519`, branch `reference-system`, tree `CLEAN`.

> Tracker role superseded by `FINALIZE.md`; retained for its component references.

This is the single closeout doc. Everything automated that could be
landed is landed; what follows is everything still needed before
anyone may say "production-ready" — split into agent-doable legs
(staff now), HQ/human-only items (never staff), and the post-HQ flip
wave (staff after rulings). One crew per leg, land each leg green
before the next touches the same component.

## What "finish line" means

Production-ready = ALL of these hold on one clean tree:

1. Automated gates green: unit + CT × React 17/18/19 + FF + WebKit
   for every touched component (five-leg gate, zero narrowing).
2. Axe scanner halves executed per component (`*-A11Y-01`), zero
   component-attributable violations (or scoped with rationale).
3. Browser breadth closed: 17/18 × FF/WebKit swept (today only
   Announcer has r17 FF/WebKit legs; everything else is r19-only).
4. Hermetic chain-t2 verdict known (today UNKNOWN — froze once).
5. Non-Chromium paint story settled: per-browser baselines adopted
   or explicitly deferred with HQ sign-off (today: no per-browser
   baselines, `--ignore-snapshots` everywhere off-Chromium).
6. React-17 shadow-composition anomaly root-fixed or permanently
   accepted as ordered-workaround with HQ sign-off.
7. HQ API/productionization read-through done; any flips re-verified
   in a final wave.
8. NF-MANUAL-01..04 executed by human hands on real platforms/
   devices, results recorded (Part D).
9. Consumer smoke gate exit 0 + compiler gates clean on the final
   tree (`agentrs c/v/q`, `agentneo run NEO-SITE-16`).

Items 1–6 + 9 are agent-doable now (Part B). Item 7 is HQ-only
(Part A) with an agent flip wave after (Part C) and one
staffable-now measurement leg feeding it (FINISH-07). Item 8 is
human-only (Part D).

## Landed — do not reopen (verified firsthand, committed)

If it's on this list, it's done. A crew that thinks one of these
is broken files a NEW finding with a repro — it does not relitigate
the arc. Provenance: `.agents/missions/landing-sequence/`.

- NumberField 144/148 AUTOMATED-COMPLETE (five-leg gate: unit
  131/131, CT 57/57 × 17/18/19, FF 57/57, WK 57/57).
- Sweep: 1710/1784 legs (95.9%), 68 findings F1–F68 all
  fixed/scoped/held — zero unowned. FIX-D2, SCOPE-1, SCOPE-2, F10
  all landed.
- FOCUS + FOCUS-FIX fully closed (Safari restore/trap hardening,
  D3 trigger, G1 skip-by-project, H1 chromium-only, RESTORE-10
  contention fix — product correct, 1-line spec fix).
- SPLIT cluster closed (79/79 ×3) + 4a executed (legacy
  `minSize`/`maxSize` deleted, `ca0d3486e`, smoke migrated).
- SMOKEREDS (Tabs false-fire + RovingFocus `.ref`), NAMER
  (comma-split), EXTRACT (#9 dataflow) — smoke gate exit 0.
- SITE-16 semantic (i) (`0267a8762`): resolve through same-file
  `const` object literals; opaque rebindings stay silent.
- REDS 3/4 (harvest-census re-pin, HINTS refresh, Announcer-17
  render-stable id; 4th was SITE-16, landed above).
- Compiler continuity (DECISIONS §6, ruled): any `Nr` computes
  (no closed table — both engines already compute arbitrary N);
  spacing tokens defined AS r-values; `--spacing-root:0.25rem`
  auto-defined, author overwrite wins; unscanned consumer gets the
  dead class, no runtime fallback, sync is blessed.
- B-36 silence (2a, ruled): no `onChange` when value identical.
- P2 chains: Select, Date (DateField/Calendar/Field), Disclosure
  (Tabs/Collapsible/Accordion), Menu/Menubar, primitives, Slider,
  Switch, RovingFocus, Portal/Overlay seam — scoreboards in
  REPORT.md §2.

## Carried — no action, by standing decision

- `playwright/ct.ts` type errors: pre-existing, involve none of the
  new types, T1 never gated on them. Still live, still harmless.
- Kill-leg flakes: load-sensitive noise, green on isolated re-run.
  Discipline stands (attribute, re-run isolated, full green).
- Neither is a finding. Do not staff, do not "fix while here."

## Change control (the posts stop here)

This file is the closed world. Anything not listed here is not
required for production-ready. If new work surfaces, the captain
appends it below with date + provenance + which Part it joins —
never silently, never by chat alone:

- 2026-09-29 (init): file created from landing-sequence closeout
  state. No additions yet.
- 2026-09-29 (adoption DEFERRED, was ADOPT-in-wave — item 5):
  two consecutive 90-min boxes (C-SNAPSHOT, C-SNAPSHOT-2) were
  consumed by larger-than-expected Chromium fallout (13 snap reds +
  39 abort-hidden + 31 orphans + unit triage + 4 daemon deaths);
  adoption never got a slot. Release-blocking value is zero (paint
  proven on Chromium @0.001; behavior proven all engines/majors;
  FF/WK paint was never proven pre-FINISH either — deferral loses
  nothing vs baseline). First follow-up with all vehicles preserved
  (FINISH-04 exact vehicle + SERIAL generation constraint +
  stale-candidate warning: F04 /tmp candidates are stale under the
  re-pinned Chromium). Reversible by veto.
- 2026-09-29 (captain rulings, autonomy directive — Part A RESOLVED,
  Part C triggered, all reversible by veto): C-NAME → 1a (house
  onChange everywhere); C-W02 → i-freeze (zero-anchor + endpoint
  preserve), ii-freeze (away-from-zero), iii-retain-and-report,
  iv-keep, v-keep, vi-keep [adopts NFLAST (a)(b)(c) + flagged
  interpolations]; C-NF-FLAGS → implement (b)(c) + Intl i–xvi per
  NumberField/DECISIONS.md (merged with C-W02: one NumberField crew);
  C-SNAPSHOT → 5a-modified (0.001 default per FINISH-07 + 25px
  locator rule + ≥0.01 TOL-ban) + P6 = explicit 19-only snapshots
  (snap() is r19-only by design) + per-browser r19 baselines ADOPT
  (FINISH-04 ruling), executed LAST among flips (rides the regen);
  C-SWITCH/SLIDER/DATE → VACUOUS (no written takes exist anywhere;
  only references to them). F30 note: F30 fixed by flushSync arc,
  not a ruling. Provenance: DECISIONS.md §§1–5 +
  NumberField/DECISIONS.md, surveyed firsthand by captain.

## Crew law (every FINISH leg)

- **One crew per component at a time.** Land each leg green before
  the next crew touches the same component (NEVER-AGAIN rule).
- **Boxes, never grind:** 60/75/90 min hard boxes, 15-min per-case
  caps. Stuck → scope with rationale, log repro, move on.
- **Crews never commit.** Captain verifies firsthand, then commits
  per-arc on `reference-system`. No merges to `main` without HQ.
- **Runner only:** `pnpm agent playwright` / `pnpm agent vitest` /
  `pnpm agentct`. Never raw `playwright test` / `vitest` in
  subshells (QoS jail, port 4173 orphans, no exit signaling).
- **Attribute every red by name**, re-run isolated, capture to file
  (`/tmp/<leg>-*.txt`), two-in-a-row discipline before claiming
  green. Transient reds under contention are expected — re-run on a
  quiet tree, do not absorb pre-existing reds.
- **Max 2 concurrent crews**, different components. Contention
  caused transient reds before (LB-VIRT-09, CB #1, Tree #1).
- **Objective logs** in `.agents/missions/finish-line/<LEG>.md`,
  15-min cadence, quoted proof, resume checklist at close.
- **Clear-and-clean:** fix only if proven; else scope with
  rationale. No legacy props, no runtime fallback, sync is blessed.

---

## Part A — HQ / human only (DO NOT STAFF)

**A1. API/productionization read-through (HQ).** Naming 1a, W-02
sub-rulings (i–vi), snapshot policy (5a/5b/5c + P6 pick), Switch /
Slider / Date takes, NumberField live-requests vs B-19. No crew
touches API surfaces until ruled. Source: `DECISIONS.md` §§1–5.

**A2. NumberField least-surprise flags (HQ confirm).** Engine
rulings (a) FREEZE lattice (zero-anchored, away-from-zero ties),
(b) RETAIN-AND-REPORT validate, (c) LIVE-REQUEST with dedupe
(re-pins B-19 unit titles; CT B-19 titles keep repro cores), plus
Intl parser record i–xvi in
`packages/reference-lib/src/components/NumberField/DECISIONS.md`.
Flips are cheap pre-release — but every flip triggers Part C.

**A3. Manual release gates (human + devices).** Part D. No crew can
automate these; do not staff them.

---

## Part B — Agent legs (STAFF NOW)

### FINISH-01 — Axe scanner halves (15 components)

**Why:** `playwright/axe.ts` infra landed (`expectNoAxeViolations`
+ report-only `scanAxe`, devDeps only, no API surface). Zero
scanner halves are implemented — every `*-A11Y-01` still carries
the "no axe in repo" comment, which is now stale.

**Scope (one component per crew, land each before next on same
component):** Accordion, Calendar, Combobox, Listbox, Menu,
Menubar, NumberField, Popover, Slider, Splitter, Switch, Tabs,
Toast, Tooltip, Tree.

**Per-component brief:**
- Implement the scanner half in the component's `__e2e__` spec
  using `expectNoAxeViolations(page)`; scope with `include` to the
  mounted story. Default-disabled rules (`landmark-one-main`,
  `page-has-heading-one`, `region`) stay disabled — page skeleton
  is application-owned. Prefer narrowing the case over broad
  `disableRules`; any extra disable needs a `// AXE:` comment.
- Known handoff: Combobox's open-popover story reports an
  unlabeled input — the Combobox scanner-half author owns that
  disposition (fix story labeling or scope with rationale).
- Out of scope: assertion halves (already landed), new axe rules,
  touching `playwright/axe.ts` without captain approval.

**Vehicle:** `pnpm agentct <Comp>` (+ `--e2e --react 17,18` for the
majors leg once green on 19).

**Proof per component:** full `agentct` suite green on 17/18/19,
quoted; axe scan output quoted (0 violations or scoped list).

**Done:** all 15 scanner halves green or explicitly scoped; each
landed per-arc. **Box:** 60 min per component, 15-min per-case cap.

### FINISH-02 — React 17/18 × FF/WebKit breadth

**Why:** the sweep proved r19 × FF/WebKit (1710/1784, 68 findings
all fixed/scoped/held) plus Announcer r17 × FF/WebKit. Every other
component's 17/18 legs are Chromium-only. Breadth gap stands.

**Scope:** for each component with a CT suite, run FF + WebKit
legs under `CT_REACT=17` and `CT_REACT=18`. Priority order:
NumberField, Combobox, Listbox, Tree, Calendar, DateField, Menu,
FocusLock, Splitter, then the rest. Findings are findings — this
crew scopes/fixes nothing beyond the DIAG discipline; new reds go
to a FINISH-02 findings table with repro lines, and fix crews
follow per the NEVER-AGAIN rule.

**Vehicle (throwaway config, never commit):**
`pnpm agent playwright --dir packages/reference-lib
--config=/tmp/sweep-ct.config.ts
'src/components/<C>/__e2e__/<C>.ct.spec.ts'
--project=react<major>-<firefox|webkit> --ignore-snapshots`
with `CT_REACT=<major>` prefix. Recreate `/tmp/sweep-ct.config.ts`
from the SWEEP.md P0 note if lost (mirrors CT config + two
projects per major). Verify major genuineness via the
`html[data-react-version]` probe (S2 method) before trusting r17
results — a stale r19 gallery on :3101 attaches silently.

**Proof:** per-component table (FF 17/18, WK 17/18, quoted
pass/fail + raw logs in `/tmp/finish02-*.txt`).

**Done:** breadth table complete; every red owned (fixed, scoped,
or held with rationale). **Box:** 90 min; stop adding targets at
75 min, write the table.

### FINISH-03 — Hermetic chain-t2 retry (UNKNOWN → verdict)

**Why:** S10 froze (zero bytes 11 min, terminated per the >15-min
fallback). Hermetic verdict is UNKNOWN — the sole `layers:` prover
+ install path never proved on this tree.

**Scope:** one clean `pnpm agent test
--packages=@matrix/chain-t2` (canonical fallback: `pnpm pipeline
test --packages=@matrix/chain-t2`). Quiet tree, nothing else
running. If it freezes again (>15 min no output), terminate own
process only, log the freeze point + partial log, and return
BLOCKED with a concrete next probe (not a third blind retry).

**Proof:** quoted exit + verdict line, or freeze-point log.

**Done:** verdict KNOWN (PASS/FAIL with cause, or BLOCKED with a
better probe). **Box:** 60 min all-in.

### FINISH-04 — Per-browser baselines (prep, human-gated)

**Why:** all FF/WebKit legs run `--ignore-snapshots` because
baselines are Chromium-raster (P0 probe: font-raster diffs only).
Non-Chromium paint drift is unproven either way.

**Scope:** generate CANDIDATE FF + WebKit baselines for the fully
green-both-engines set first (Field, Tabs, Collapsible, Menubar,
Presence, Portal), then the rest. Do NOT present them as truth:
deliver a diff table (per-snapshot Chromium-vs-FF vs Chromium-vs-WK
pixel ratios + classification: raster-only vs real drift). Commit
nothing; baselines land only with explicit human verification.

**Vehicle:** per-component CT snapshot update flow under the
FINISH-02 vehicle, captured to a scratch dir, never over the
pinned baselines.

**Done:** diff table + recommendation (adopt per-browser baselines
vs defer with sign-off). **Box:** 75 min.

### FINISH-05 — React-17 shadow-composition anomaly (root-cause)

**Why:** NFLAST-4 CompScienceFixture: programmatic staging (native
setter + input event) AFTER a shadow composition-invalidation
cycle is swallowed on React 17 only (DOM keeps controlled text;
18/19 + all engines fine). Worked around by ordering; all
assertions preserved; NOT investigated (15-min cap).

**Scope:** root-cause the swallow (suspect: fallout-swallow
interplay specific to 17's shadow event path). Repro: COMP-04
order with stage/reset after the composition block, `--react 17`
(`.agents/missions/landing-sequence/NFLAST4.md` ANOMALY section).
Fix if clean and 17/18/19 + FF/WK stay green on the five-leg
gate; otherwise prove the ordering workaround is behavior-neutral
and recommend permanent acceptance with rationale.

**Vehicle:** `pnpm agentct NumberField` + `--e2e --react 17,18` +
FF/WK vehicle. `NumberField/` dir only.

**Done:** root fix landed, or written acceptance rationale with
HQ sign-off line. **Box:** 75 min, 15-min per-hypothesis cap.

### FINISH-07 — Snapshot-tolerance measurement (feeds HQ item 5)

**Why:** HQ questioned 0.002 as "the extreme other end" and wants
the reasonable value found (DECISIONS §5 still open, config still
0.02). The sharp audit (`.agents/missions/sharp/tolerance.md`)
landed the problem statement + 20 regen'd baselines, but the
replacement number was never measured. HQ cannot rule without it.

**Scope:** measure, don't flip. Across the CT snapshot corpus,
report: per-snapshot pixel-diff distribution on repeat runs
(same machine, quiet tree) = noise floor; smallest KNOWN-GOOD
restyle diff (pick 2–3 landed visual changes with before/after
baselines) = signal floor; the FocusLock 0.15 trio and Tabs B-08
page snap as worked examples. Recommend one default + the
locator-pairing rule in concrete numbers. Change nothing —
config stays 0.02 until HQ rules (then C-SNAPSHOT executes).

**Done:** measurement table + one recommended number with
headroom math, handed to HQ. **Box:** 60 min.

### FINISH-06 — Final gates re-proof (quiet tree)

**Why:** the closeout proof (smoke exit 0, compiler gates clean)
must be re-observed on the exact tree that ships, after all other
FINISH legs land. Run LAST.

**Scope (in order, quoted — run after every other FINISH leg,
including 07):**
1. `pnpm --dir packages/reference-lib run smoke` → exit 0,
   `missRaceNoise=0`, zero-true-gap PASS.
2. `pnpm agentrs c atomic` + `pnpm agentrs v atomic` + `pnpm
   agentrs q` → clean, 0 violations.
3. `pnpm agentneo run NEO-SITE-16` → PASS.
4. `git status --porcelain` → empty (except this log while open).

**Done:** all four quoted green on the final HEAD. **Box:** 45 min.

---

## Part C — Post-HQ flip wave (STAFF ONLY AFTER RULINGS)

Trigger: HQ rules on any Part A item and the ruling flips shipped
behavior. Each flip gets ONE crew, one component at a time:

- **C-NAME:** handler naming 1a (strip Radix aliases, rename
  Menubar's prop) — tests + docs re-pinned, pre-release cheap.
- **C-W02:** W-02 sub-rulings i–vi — lattice anchor, tie direction,
  validate semantics, report precedence, stepper clamp, parser
  scope. Re-pin tests + docs per numeral.
- **C-SNAPSHOT:** snapshot policy 5a/5b (+ P6: per-major baselines
  or explicit 19-only acceptance) — config + regen same-commit.
  Evidence: FINISH-07 measurement (must exist before HQ rules).
- **C-SWITCH/SLIDER/DATE:** per HQ takes when written.
- **C-NF-FLAGS:** NumberField least-surprise flags i–xvi + (b)(c)
  flips — tests + docs, then the five-leg gate.

After every flip crew: re-run FINISH-06 on the new HEAD. No flip
ships without its own re-proof.

## Part D — Manual release gates (HUMAN ONLY, never staff)

From `NumberField/TESTS.md` Manual release gates — automation does
not substitute. Record platform + version + per-item outcomes.

- [ ] **NF-MANUAL-01** — Real VoiceOver (supported macOS/iOS) +
  NVDA (Windows/browser pairs): reach, name, edit, activate the
  frozen textbox/button anatomy without spinbutton recast.
  Navigation, focus, authored names, edit feedback, stepper
  activation.
- [ ] **NF-MANUAL-02** — Real OS IMEs (supported Pinyin, Japanese,
  Korean, Indic), incl. prop replacement mid-composition.
  Candidate window, selection, final text, callback, stale-event
  outcomes per IME.
- [ ] **NF-MANUAL-03** — Real iOS/Android keyboards per inputMode
  grammar (validate negatives, snap integer/fraction, exponent
  fixtures) + touch-stepper focus. Actual keys/layout/open/close
  per device.
- [ ] **NF-MANUAL-04** — Genuine browser autofill (supported
  browser/profile + saved numeric data): target, event order,
  visible text, callback, commit, payload. Hidden canonical input
  must not be targeted.

## Part E — Captain closeout checklist

- [x] Parts B + C legs all landed per-arc, `reference-system` clean
  (`193fa9a56` + closeout paperwork; 40+ landing commits, all
  firsthand-verified).
- [x] FINISH-06 re-proof quoted on the final HEAD (smoke PASS 0/0,
  agentrs 0 violations, NEO-SITE-16 PASS, tree clean — this wave).
- [x] Part D PARKED by user directive 2026-09-29 ("don't worry too
  much about device work") — steps preserved in Part D for
  hands-on runs; no owner/date (user to schedule post-release).
- [x] Sign-off lines present (captain-ruled, reversible): P6 =
  explicit 19-only (`DECISIONS.md` amendments); per-browser =
  DEFERRED with rationale (`FINISH-04.md`); anomaly ACCEPTED
  (`9d0f92684`, transient proven).
- [x] FINISH-07 measurement delivered before the item-5 ruling
  (`154599d2f` → 0.001 ruling cites it).
- [x] `REPORT.md` (superseded banner) + `DECISIONS.md` (closeout
  amendments) current; this file's boxes checked with HEAD refs.
- [x] WAIVERS (all pre-existing, proof-linked, reversible):
  Menubar majors 18 CLOSED by RED-MB (getNode seam, 46/46;
  FINISH-02 14/23 FF/WK legs fixed as bonus);
  Tooltip CLOSE-01/FOCUS-03 r19 pair CLOSED by RED-TT (`6048c4e97`;
  vehicle fix + ring baseline, F28/F29 superseded);
  NF-unit full-suite flakes CLOSED by RED-NF (PARSE-19 20s budget +
  signal.aborted guard; 956/956 two-in-a-row + captain re-proof);
  FINISH-03 hermetic infra (BLOCKED-infra-FINAL chain, `15b2c805b`).
- [ ] Declare production-ready, propose `main` merge — USER'S CALL
  (no merges to `main` without HQ; captain recommends READY
  modulo the waivers above).

## Appendix — vehicles (copy-paste)

```bash
# Component verification (Chromium × majors)
pnpm agentct <Comp>
pnpm agentct <Comp> --e2e --react 17,18

# FF / WebKit legs (throwaway config, behavioral signal only)
pnpm agent playwright --dir packages/reference-lib \
  --config=/tmp/sweep-ct.config.ts \
  'src/components/<C>/__e2e__/<C>.ct.spec.ts' \
  -g "<CASE-ID>" --project=react19-<firefox|webkit> --ignore-snapshots

# Compiler gates
pnpm agentrs c atomic && pnpm agentrs v atomic && pnpm agentrs q
pnpm agentneo run NEO-SITE-16

# Consumer smoke gate
pnpm --dir packages/reference-lib run smoke

# Tree hygiene
git status --porcelain; git log --oneline -5
```

Prior art: `.agents/missions/landing-sequence/SWEEP.md` (vehicle +
P0 rule + all 68 findings), `NFLAST4.md` (anomaly repro),
`REPORT.md` (live issues), `DECISIONS.md` (HQ pile).
