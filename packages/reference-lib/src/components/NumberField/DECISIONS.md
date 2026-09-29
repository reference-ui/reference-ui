# NumberField decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: uncontrolled spinbutton input with live clamp, steppers, optional bounds.

## Landed (context, 2-4 lines)

Quarantine-landing ported 7 current-API stability wins P1–P7 (handler chaining
fixing dead typing, native modified-arrows, primary-button steppers, verbatim
cleanFloat, managed authority, numeric validation throws), added 15 unit + 11
CT assertion-only titles (16 CT total), and reached SPEC 24/148 with 14
snapshots untouched and green. UX verdict APPROVE (self-review; nested spawn
pool-full twice). Crew log:
`.agents/missions/quarantine-landing/number-field.md`; landing commit
`9aa967526` (verified via `git log`).

## Candidate features (quarantine-sourced) — MOVED

Full text now lives in PATCHES.md (mechanical, test-pinnable) and FEATURES.md
(needs a design call). Titles preserved; original verdicts in parentheses.

### 1. Controlled-only state + required locale (was OPEN)

→ Moved to FEATURES.md §1 — breaking rewrite needing HQ's migration + required-locale product call.

### 2. Dirty edit session + commit boundaries (was DEFERRED)

→ Moved to PATCHES.md §1 — fully specified commit engine, queues behind the FEATURES.md §1 release.

### 3. Intl parse/format + grammar-derived inputMode (was DEFERRED)

→ Moved to PATCHES.md §2 — fully specified Intl surface plus a declared ICU matrix and the seeded round-trip proof.

### 4. Zero-anchored step lattice + snap/validate math (was DEFERRED)

→ Moved to PATCHES.md §3 — fully specified behavior, no new props, lands with PATCHES.md §1.

### 5. Group part + Field-surface host (was DEFERRED)

→ Moved to PATCHES.md §4 — fully specified new part plus the Field-crew bezel handshake.

### 6. Hidden canonical form pipeline (was DEFERRED)

→ Moved to PATCHES.md §5 — fully specified form props and hidden-input wiring, lands after PATCHES.md §1.

### 7. Required stepper accessible names (was DEFERRED)

→ Moved to PATCHES.md §6 — fully specified type + diagnostic change, ships in the FEATURES.md §1 major bump.

### 8. Hold-repeat + touch/pointer session semantics (was DEFERRED)

→ Moved to PATCHES.md §7 — fully specified timed behavior, separable as a standalone PR.

### 9. Textbox exposure (spinbutton removal) (was DEFERRED)

→ Moved to PATCHES.md §8 — fully specified semantics swap behind an HQ-verified snapshot rebaseline.

### 10. Redundant onChange suppression at bounds (was OPEN)

→ Moved to FEATURES.md §2 — needs HQ's scope ruling (bounds-only vs any-no-change) before a test can pin it.

## Suspected gaps (no quarantine source)

### 1. Wheel pass-through proof (was OPEN)

→ Moved to PATCHES.md §9 — behavior already holds; one assertion-only CT title closes it.

### 2. Book Default story accessible name (was OPEN)

→ Moved to PATCHES.md §10 — demo hygiene for the next story touch.

### 3. smallStep / largeStep / Alt-modified stepping — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left", NumberField.md
  "Deliberately left", and freeze decision 6 (one lattice, fixed
  `10 * step` Shift delta, Alt native). A catalog walker will ask for
  fine/coarse steps.
- **API sketch:** what HQ would be asking for: `smallStep`/`largeStep`
  props, configurable coarse deltas, Alt+Arrow stepping amounts.
- **Why not landed:** killer reason — one public lattice keeps every
  interaction's values valid under every other step; a second lattice can
  manufacture step-invalid values, and Alt must stay native (P2 landed
  that half: `NF-KEY-03`).
- **Revisit when:** a consumer shows a stepping need the fixed `10 * step`
  Shift delta cannot serve — none has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 4. Wheel stepping — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left", NumberField.md
  "Deliberately left", and freeze decision 6 ("no wheel"); `NF-EDIT-19`
  (suspected gap §1) proves the absence.
- **API sketch:** what HQ would be asking for: `allowWheel`-style opt-in
  (already type-rejected per `NF-TYPE-03`) or default wheel-to-step.
- **Why not landed:** killer reason — accidental changes are high-risk,
  and React's passive delegated wheel listener cannot reconcile
  consumer-first cancellation with reliable scroll prevention without a
  second event system.
- **Revisit when:** never through this component — a wheel-stepping need is
  a Slider composition question, not a NumberField prop.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 5. ScrubArea / drag-to-change — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left" and NumberField.md
  "Deliberately left"; Zag ScrubArea is documented contrast, not source.
- **API sketch:** what HQ would be asking for: `NumberField.ScrubArea`,
  pointer lock, acceleration, virtual cursor.
- **Why not landed:** killer reason — continuous-pointer dragging with
  geometry is Slider's territory; it duplicates that component for no
  frozen composition.
- **Revisit when:** a frozen composition needs pointer-drag numeric entry
  that a Slider+NumberField pairing cannot express — none exists.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 6. Custom parser/formatter props + raw-text/commit callbacks — verdict: DECLINED

- **Evidence:** refused by freeze decision 4 (no raw text callback or
  controlled text prop), `NF-TYPE-02` (rejects parser functions, commit
  callbacks, reason/detail params), TESTS.md "Deliberately left", and the
  vendor-closure notes (Base UI reason objects/`cancel()`, Stately
  setters, and uncontrolled mirrors deliberately left).
- **API sketch:** what HQ would be asking for: `parse`/`format` function
  props, `onTextChange`, `onCommit`, reason/detail callback args,
  imperative methods.
- **Why not landed:** killer reason — a custom parser or text callback is
  a second numeric authority beside the single `onChange` request channel;
  `locale` + `formatOptions` is the customization surface, and Intl is the
  parser.
- **Revisit when:** a supported-locale need proves inexpressible via
  `Intl.NumberFormatOptions` — that reopens the Intl-allowlist decision
  (§3), never a function-prop escape hatch.
- **Open questions:** none — hard DECLINED (the one-line killer above).

## Non-decisions (rejected outright)

- Mechanical port of quarantine's 2382-line `.tsx` rewrite — SUSPECT per
  crew-log triage; any freeze is clean manufacture from TESTS.md, never a
  lift (the contract question itself is candidate §1).
- Visual/styling/chrome edits riding in the quarantine `.tsx` — rejected
  in crew-log triage; 14 frozen snapshots green unmodified.
- `defaultValue` deletion as an isolated drive-by (breaking, without the
  freeze + migration) — recon §4 exhibit 1, crew-log SUSPECT; the contract
  version is candidate §1.
- Lattice / null-step / snap fragments cherry-picked onto the live-clamp
  engine — rejected in crew-log triage; coherent only as candidate §4
  inside the freeze.
- Quarantine's required-finite-bounds validation shape (`±Infinity`
  rejected) — adapted at landing (P7): current unbounded sentinels kept;
  SPEC re-target note.

## NFLAST engine rulings (HQ-delegated, 2026-09-28)

HQ delegated the three open engine calls to the NFLAST mission (rule the
obvious answers, least-surprise the rest). Root `DECISIONS.md` §3 shows HQ
never ruled the six W-02 sub-items ("ruling after the write-up"), and
WANTS.md W-02 signs off only the prop/policy level ("snap coerces to the
nearest step", "validate rejects off-step values") — never the lattice
anchor, tie direction, endpoint, retain, or publish-timing math. Each
ruling below cites its evidence; flips re-pin tests + docs per the
pre-release-cheap doctrine (root `DECISIONS.md` §3: "Anything flipped gets
re-pinned (tests + docs, pre-release cheap)").

### Ruling (a): snap lattice — ADOPT FREEZE (least-surprise: no flag, obvious)

Zero-anchored lattice `k*step`; away-from-zero midpoint ties; exact and
exceeded non-grid bounds preserved as endpoints; order
endpoint-preservation → nearest-lattice → authored rounding → final clamp.

- **Evidence:** TESTS.md freeze decision 7 ("Snap preserves exact/exceeded
  non-grid bounds, otherwise snaps before ordinary clamp, uses
  away-from-zero midpoint ties, applies explicit Intl rounding, then
  final-clamps") plus `NF-MATH-03` (zero-anchored), `NF-MATH-09`
  (away-from-zero), `NF-MATH-10`/`11` (endpoint preservation),
  `NF-MATH-12` (order). SPEC.md "Gaps & incoherence" confirms the engine
  (min-anchored, half-up, lattice-clamped max) contradicts the freeze.
- **Why obvious:** nothing HQ-signed pins the RAC math — W-02 signs off
  the policy, and the six sub-rulings were left open. Typing `max` must
  commit to `max` (RAC's 10→9 clamp-down is the surprise); symmetric ties
  are least-surprise (half-up is sign-asymmetric: -2.5→-2 but 2.5→3).
- **Re-pin:** W-02 snap unit titles asserting min-anchor
  (`NumberField.test.tsx` "lattice anchors at a finite min"), half-up
  ties ("midpoint ties round half up"), and lattice-clamped max
  ("out-of-range commits coerce to the lattice within bounds") are
  rewritten to `NF-MATH-03`/`04`/`09`/`10`/`11`/`12` freeze titles.
  Steppers/keys keep clamp-step-then-lattice behavior per freeze
  decision 6 (`NF-MATH-04` directional stepping, `NF-MATH-06` endpoint
  stability).

### Ruling (b): validate mode — RETAIN-AND-REPORT (freeze; one least-surprise flag)

Committing a finite underflow, overflow, or off-step candidate requests
the rounded raw candidate via `onChange` (no snap, no clamp); the
accepted text stays controlled; managed invalid state (bounds union
step) reports each applicable constraint and blocks submit; native
range/step flags stay false; no `setCustomValidity`.

- **Evidence:** TESTS.md freeze decision 7 ("Validate mode never snaps or
  clamps") plus `NF-MATH-13` (rounded raw candidate requested),
  `NF-MATH-15` (endpoint/step-mismatch validity display — already proven
  against controlled values), `NF-COMMIT-06`, `NF-FORM-05`,
  `NF-COMP-04` ("accept off-step invalid value"). Prior art: native
  `stepMismatch` (never coerces, blocks submit) and RAC
  publish-and-mark-invalid (root `DECISIONS.md` §3 prior art).
- **Why obvious:** the engine already computes owned invalid state for
  retained controlled values (`NF-MATH-15` green) — reject-at-commit
  makes that state reachable only programmatically, which is incoherent.
  W-02's "validate rejects off-step values" (WANTS.md) is read as
  rejects-as-valid (marks invalid, blocks submit): the value flows,
  validity rejects. ⚠ LEAST-SURPRISE FLAG: that reading is ours, not
  HQ-signed; if HQ meant revert, this ruling flips back cheaply.
- **Re-pin:** W-02 validate unit titles ("revert with onInvalidCommit and
  no onChange", "report out-of-range, winning over step", "rejection
  without onInvalidCommit stays silent") are rewritten to
  `NF-MATH-13`/`NF-COMMIT-06` retain titles.
- **Least-surprise interpolation (flagged):** `onInvalidCommit` stays
  (API shape untouchable) and becomes advisory — it fires alongside the
  `onChange` request when a validate-mode commit violates constraints
  (reason `out-of-range` wins over `off-step`, keeping today's
  range-first order per root §3 item (iv)). The prop still means "an
  invalid commit happened"; it adds reason metadata, never a second
  numeric channel.

### Ruling (c): publish timing — LIVE-REQUEST with dedupe (freeze; re-pins B-19)

Newly parseable live edits request their numeric meaning immediately
(raw parsed number — no clamp/snap/round until the commit boundary);
repeated numeric meanings dedupe (one request per meaning); incomplete
grammar (sign-only, trailing decimal, malformed groups) never publishes;
accepted latest echoes preserve dirty text/caret until an explicit
commit/revert; stale/unrelated replacements end the session with zero
callback.

- **Evidence:** `NF-EDIT-03` (ordered deduped numeric requests),
  `NF-EDIT-04` (clearing requests null once),
  `NF-EDIT-05` (dedupe across `1`/`1.`/`1.0`),
  `NF-EDIT-14` (rejection authority — meaningless without live
  requests), `NF-COMMIT-01`/`04` (commit retry while prop differs),
  `NF-COMMIT-08` (accepted echoes preserve dirty text),
  `NF-COMMIT-11` + `NF-DYNAMIC-01` (stale/unrelated replacement),
  `NF-COMMIT-05` ("no intermediate clamp/snap/round callback" — live
  callbacks are raw). `NF-KEY-06`/`NF-STEP-12` ("reject the live
  request") are already proven with B-19-adapted titles.
- **Why obvious:** B-19's root fix is the verbatim dirty draft (no
  mid-keystroke coerce) — preserved by the session architecture, not by
  commit-only publishing. Only the "never mid-keystroke" clauses in the
  pinned B-19 titles are over-broad and get re-pinned. Controlled
  text-input parity (publish parseable meanings like any `onChange`) is
  least-surprise; rejection authority exists only with live requests.
- **Re-pin:** B-19 unit titles ("publish once at commit, never
  mid-keystroke", "clamp happens at commit, not while typing") and the
  CT B-19 titles keep their repro cores (bounded "2.5" typeable verbatim
  through "2.", final 2.5) with intermediate live requests (`[2, 2.5]`)
  instead of silence.
- **Least-surprise interpolation (flagged):** live requests carry the
  raw parsed number unclamped/unsnapped (commit policy is
  commit-time-only) — inferred from `NF-COMMIT-05`'s "no intermediate
  clamp/snap/round callback", not pinned verbatim by any freeze line.

## NFLAST-2 Intl parser record (2026-09-28, SPEC'd, no HQ call needed)

Declared supported matrix (NF-PARSE-15/16, NumberField.md restates the
rule): a locale/formatOptions pair is editable iff (1) every requested
numbering system resolves exactly (refused `-u-nu-` / `numberingSystem`
requests throw — Intl's silent latn fallback would be a fallback
editor), (2) the resolved system exposes ten distinct single-glyph
positional digits via `formatToParts`, (3) notation is not compact, (4)
`signDisplay` is not `never`. Refusals throw render-time errors naming
the offending prop (`"locale"` / `"formatOptions"`), matching the
NF-MATH-02 fail-fast precedent — "fail before accepting edits" means no
markup and no callback, never a dev-only warning.

Least-surprise interpolations (flagged for HQ): (i) an explicit
`numberingSystem` option wins over a conflicting locale `-u-nu-` tag per
Intl precedence, no diagnostic; (ii) "hidden-sign formats" reads as
`signDisplay: "never"` only — `exceptZero` still writes negatives and
stays editable; (iii) ASCII digits always parse alongside the one active
set (NumberField.md-pinned); hanidec glyphs are named explicitly because
CJK ideographs are `\p{Lo}`, not `\p{Nd}`; (iv) "documented width sign
variants" reads as fullwidth U+FF0B/U+FF0D + small-form U+FE62/U+FE63,
accepted globally — figure/en/em dashes stay sign-like punctuation and
reject everywhere; (v) accounting parens wrap an unsigned paren-free
core only (`(-$5)`, `((5))` reject — never double negation, never
silent stripping); (vi) digit-less plural outputs (ar dual يومان)
stay silent instead of inventing a number; (vii) U+0609 joins U+2030
as a percent-style permille mark; (viii) orphan-group discard covers
the pinned leading shape only (`,024`→24 at commit, live stays
silent) — other orphans keep stable rejection; (ix) invalid
composition finals restore pre-composition text at compositionend,
but empty finals keep the buffer (commit null at the boundary);
(x) composition fallout swallow is one input event — a genuinely new
keystroke arriving first after an invalidated composition is consumed
once (fresh compositionstart supersedes).

## Walkthrough notes for HQ

- Most important: FEATURES.md §1 controlled-only + required locale — the
  flag-day decision behind all eight PATCHES.md freeze items (§1–§8). Feel
  it in Book: the Default story (42) works fully uncontrolled today — type,
  step, clear — and §1 deletes exactly that; weigh the major bump plus the
  Field-story/Showcase/book migration before anything else sequences.
- Second: FEATURES.md §2 redundant onChange at bounds — the only unblocked
  behavior wart in the shipped engine. Feel it in Book: open the WithBounds
  story, step past one bound, and watch `onChange` re-fire with the
  unchanged value; the ruling (bounds-only vs any-no-change suppression)
  is the cheapest decision on this page.
- Third: PATCHES.md §8 textbox vs spinbutton — the snapshot/AT tension.
  Feel it in Book: inspect `role=spinbutton` + `aria-valuenow` on the
  Default Input, then read the VoiceOver rationale in NumberField.md; the
  rebaseline needs HQ eyes whenever FEATURES.md §1 schedules it.
- The eight PATCHES.md freeze items (§1–§8) need no HQ product input —
  TESTS.md declares no unresolved API decision, so they are crew-routing
  slips that auto-sequence behind FEATURES.md §1 plus the noted Field-crew
  (PATCHES.md §4) and ICU-matrix (PATCHES.md §2) handshakes. PATCHES.md
  §9–§10 (§9 wheel proof, §10 story naming) close independently of the
  freeze on any CT pass or story touch.
