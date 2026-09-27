# Date crew log (Calendar + DateField)

Status: COMPLETE
Branch: reference-system (never switch; never commit — captain commits)

Scope: packages/reference-lib/src/components/{Calendar,DateField} (+ colocated tests/stories) ONLY.

Bugs: B-15, B-16, B-17, B-18, B-23, B-24, Calendar facet of B-36.

## Triage (from source doc + src read)

- B-15 (DateField zero validation): OPEN in src — `handleInputChange` publishes verbatim. Fix = PATCHES #1 engine (dirty session + ISO gate) per TESTS.md DF-EDT/DF-CMT.
- B-16 (DateField min/max ignored): picker path already gated (`handleDateSelect`); TYPING path open. Fix = same engine (DF-BND-01/03).
- B-17 (Calendar min/max ignored): APPEARS LANDED in src (FEATURES #6: isDateDisabled + nav coverage). Verify with CT; close as already-fixed if green.
- B-18 (Calendar keyboard): APPEARS LANDED in src (FEATURES #7: 2D keys + skip + pending focus). Verify with CT; close as already-fixed if green.
- B-23 (month/year dead grid): OPEN in src — `selectDate` handles only day/range; no Months/Years parts. Fix = FEATURES #10 per CA-VIEW-*/CA-MODE-* contract.
- B-24 (locale ignored): Calendar facet APPEARS LANDED (FEATURES #3: CLDR week start + headers). DateField facet OPEN (raw ISO display, no locale parse). Verify Calendar; fix DateField via PATCHES #1 (DF-FMT-*).
- B-36 Calendar facet: CONFLICTS with in-repo CA-SINGLE-03 triage amendment (uniform-request, deliberate). Mission contract outranks component triage note → implement identical-value suppression, update amendment + CT. FLAGGED FOR HQ (design reversal).

## Progress

- Claimed log; triage done.
- DateField engine (PATCHES #1) LANDED in `DateField.tsx`: dirty buffer +
  ISO-gated live/commit paths, locale display via `formatLocalDate`,
  min/max/unavailable rejection without clamp, managed invalid
  (constraint + failed boundary), `data-editing`/`data-empty`,
  composition suspension. No stepping (PATCHES #2, out of scope), no
  submit/reset observers (PATCHES #5, out of scope), no `invalid` prop
  (SPEC follow-up scope).
- DateField unit: 30/30 green. CT re-targeted to locale display + 21 new
  engine proofs (DF-FMT-01..05, DF-EDT-01..09, DF-CMT-01..07, DF-BND-01/03,
  DF-CAL-02, DF-COMP-01/03, B-15).
- DateField e2e React19: 44/44 green (2nd run; 1st run 34/44 — 10 timeout
  flakes under shared-daemon load with sibling crews active, all green on
  retry). 8 frozen snaps pass within 2% tolerance (text-only delta).
  FLAG FOR HQ: baselines still show pre-fix ISO text; consider a
  human-approved baseline refresh.
- Next: Calendar B-23 (FEATURES #10 view machine + Months/Years) + B-36
  (identical-value suppression), then final `agentct` for both + `--react all`.
- Calendar FEATURES #10 LANDED (`Calendar.tsx` +889): private view machine
  (`data-mode`/`data-view`), Month/Year drill-down, Months/Years collections
  (roving tabindex, 3-col arrows + RTL, whole-unit min/max + unavailable
  disabling, range paint), YYYY-MM/YYYY publishing, navigation-vs-selection.
  B-36: identical suppression in all modes (CA-SINGLE-03 no-emit restored).
- Calendar unit 63/63; e2e React19 50/50 (32 pre-existing + 18 new
  CA-VIEW/CA-MODE proofs); `--react all` 150/150. 7 frozen snaps pass
  unmodified (explicit-header fixtures unaffected).
- DateField final: unit 30/30; e2e React19 44/44; `--react all` 132/132.
  (One mid-flight mass-flake under shared-daemon load + 1 real DF-CAL-02
  header re-target, both resolved and re-verified.)
- tsc: Calendar + DateField files clean (1 pre-existing DateField.test
  cast fixed in-scope; package-wide redness is other crews' mid-flight
  work in Accordion/NumberField/Slot/ct.ts).
- FLAGS FOR HQ: (1) B-36 reverses the deliberate FEATURES #13
  uniform-request triage — mission contract outranked the note; needs HQ
  eyes. (2) DateField baselines still show pre-fix ISO text (pass within
  2%); consider human-approved refresh. (3) No hasAuthored
  part-defaulting (Calendar.md §variable-specificity stays aspirational;
  CA-VIEW-13 first fixture waits on HOLD #5 Day parts) — B-07/docs-crew
  territory. (4) Matrix date-field/calendar specs + `dist` rebuild
  (B-11) will need re-targeting outside this crew's scope.
