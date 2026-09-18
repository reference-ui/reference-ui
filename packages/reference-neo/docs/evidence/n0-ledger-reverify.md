# N0 oracle: Neo-side ledger re-verify

Question: is the Neo-side ledger still accurate — 12 blocked rows with owned
RS cites, 5 cited probes, 152-entry census union fully grounded?

Verdict: **yes, accurate**. Re-verified from scratch 2026-09-17: all 12
blocked rows with owned RS cites, all 5 probe cites with existing RS lane
rows, all 152 union entries grounded case-sensitively. Three prose-only
drifts (two stale count comments, one PLAN unblocks cell); zero data drift.

## 1. Executive summary

- 12 `| NEO-… |` blocked rows, each citing its RS owner, confirmed by
  `rg -n "^\| NEO-.*blocked-on-rs" tests/cases/*/TESTS.md`: cond 4
  (`tests/cases/cond/TESTS.md:10,15,19,20`), site 5
  (`tests/cases/site/TESTS.md:5-7,17-18`), recipe 1
  (`tests/cases/recipe/TESTS.md:13`), global 1
  (`tests/cases/global/TESTS.md:10`), token 1
  (`tests/cases/token/TESTS.md:18`).
- Every cited RS (RS-5/11/12/14/15/16/17/18/19) has a PLAN §5.3 row
  (`PLAN.md:407,414-419,421-422`, all `in-progress`) plus per-group lane
  text, except RS-5 which is PLAN-owned only (finding N1).
- 5 cited probes verify: P4→RS-25, P5→RS-15, P8→RS-24, P14→RS-22,
  P15→RS-23 (`tests/cases/parity/NEO-PARITY-01/README.md:13-15`,
  `tests/cases/parity/TESTS.md:5,9-12`, probe RS rows `PLAN.md:415,425-428`).
- Union is 152, three ways: SPEC table `n` cells sum 71+80=151 across 13
  groups +1 parity-owned (`tests/cases/parity/SPEC.md:53-72`, every `n`
  cell matches its `·` counts); `UNION` holds 152 ids, 71 approved + 80
  oos + 1 parity; labels match verbatim both directions (0 fails, 0 leftovers).
- All 152 grounding keys land **case-sensitively** in their owning SPECs
  (0 fails, 0 case-insensitive-only); the census asserts case-insensitively
  (`census.spec.ts:106-122`), so this is strictly stronger.
- Census self-enforces the ledger: 152==152 transcription, per-group
  counts, grounding, 43 families, 12 still-blocked rows with RS owners
  (`census.spec.ts:83-162`; `BLOCKED` at `census-families.ts:191-204`).
- Zero `open`/`in-progress` rows; no case folders exist for any blocked row.
- DRIFT (prose only): stale "151" comments in `census-union.ts:2` and
  `census.spec.ts:82`; `PLAN.md:419` RS-12 unblocks cell omits COND-10.

## 2. Inventory table

| Ledger item | Result |
| --- | --- |
| 12 blocked NEO rows w/ RS cites (COND-05/10→RS-12, COND-14→RS-17, COND-15→RS-15, SITE-01/02/03→RS-14, SITE-13→RS-19, SITE-14→RS-5, RECIPE-07→RS-18, GLOBAL-06→RS-11, TOKEN-13→RS-16) | verified |
| RS lane text for RS-11/12/14/15/16/17/18/19 (cond/site/recipe/global/token TESTS) | verified |
| RS-5 ownership (PLAN §5.3 one-liner, no per-group lane) | verified w/ note N1 |
| 5 cited probes P4/P5/P8/P14/P15 → RS-25/15/24/22/23 rows exist, in-progress | verified |
| Probe cites in PARITY-01 README + TESTS + probes/sheet specs | verified |
| UNION array = 152 (71 approved + 80 oos + 1 parity) | verified |
| SPEC union table parses; every `n` cell matches `·` counts; 71+80=151 +1 = 152 | verified |
| Labels verbatim UNION↔SPEC both directions | verified |
| All 152 grounding keys land case-sensitively in owning SPEC | verified |
| Census spec self-enforcement (152==152, counts, grounding, 43 fams, 12 blocked) | verified |
| BLOCKED table = the 12 rows w/ correct RS | verified |
| Zero open/in-progress; no blocked case folders | verified |
| `census-union.ts:2` "151-entry (150 group + P-DELTA-4)" header | DRIFT (stale comment; data is 152) |
| `census.spec.ts:82` "151 entries total" comment | DRIFT (stale comment; asserts 152) |
| `PLAN.md:419` RS-12 unblocks `NEO-COND-05` only | DRIFT (omits COND-10; lane covers both) |

Commands (from `packages/reference-neo`): `rg -n "^\| NEO-.*blocked-on-rs"
tests/cases/*/TESTS.md`; `rg -n "blocked-on-rs" tests/cases/*/TESTS.md`;
`rg -n "^\| RS-" PLAN.md`; `rg -n "RS-<n>\b" tests/cases/*/TESTS.md
PLAN.md` per cited RS; `rg -n "\| open \||\| in-progress \|"
tests/cases/*/TESTS.md` (no matches, exit 1); `rg -c "id: '"
tests/cases/parity/NEO-PARITY-02/specs/census-union.ts` (152);
`rg -n "151-entry\|150 group\|151 entries total\|152" <census files>`;
directory-existence loop over the 12 blocked ids (all absent); `node
/tmp/n0-reverify.mjs` — independent re-parse of the SPEC `‖`/`·` table,
regex UNION count, label-verbatim multiset diff, and case-sensitive
key-grounding loop over all 152 entries.

## 3. Findings

1. **Blocked ledger exact.** The 12 `| NEO-… | … | blocked-on-rs … |`
   rows are COND-05→RS-12, COND-10→RS-12, COND-14→RS-17, COND-15→RS-15,
   SITE-01/02/03→RS-14, SITE-13→RS-19, SITE-14→RS-5, RECIPE-07→RS-18,
   GLOBAL-06→RS-11, TOKEN-13→RS-16. Each RS has full input/expected-CSS/
   waiting-case lane text in its group TESTS (cond table rows :21-23,
   site `**RS-14**`/ `**RS-19**` §§, recipe `**RS-18**` §, global `## RS-11`
   §, token row :19, parity rows :9-12 for probe RS-22–25). The parity
   SPEC proof-basis (§"Proof basis") lists the same 12 `(b)` rows.
2. **N1 — RS-5 note (not drift).** SITE-14 cites RS-5, whose only text is
   the PLAN §5.3 one-liner (`PLAN.md:407`, ATM-SITE-13 open station).
   Unlike every other cited RS it has no per-group lane section. This is
   consistent with its probe-era origin, but the N2 liaison should confirm
   the SITE-14 diagnostic contract is citable from the atomic side
   (`docs/evidence/atomic-claims.md` SITE-13) before drafting the station.
3. **Probes exact.** PARITY-01 README :13-15 names all five cites with
   reasons; parity TESTS :5 repeats them; `probes.spec.ts:156` and
   `sheet.spec.ts:96-107` pin the avoided source shapes per probe (plus
   RS-11/RS-17 avoidance guards). P5's RS-15 lane correctly lives in cond
   TESTS, not parity TESTS (matches charter N2 "RS-15 → COND-15 (+P5)").
   All five RS rows exist and read `in-progress` (`PLAN.md:415,425-428`).
4. **Union exact, three ways.** Independent re-parse: SPEC table `n` cells
   all match their `·` counts, summing to 71+80=151 across 13 groups, +1
   parity-owned = 152, matching the prose at SPEC :70-72; `UNION` holds
   152 ids with identical per-group approved/oos counts; label multiset
   diff is empty both directions. (The `rg kind: 'approved'` count shows
   72 because the `UnionEntry` interface line matches; entry lines are 71.)
5. **Grounding exact, case-sensitive.** All 152 keys land in the owning
   SPEC with case-sensitive `includes`, including the double-quoted
   `site-o4` key and multiline `parity-p1` — 0 fails, 0
   case-insensitive-only. Strictly stronger than the census's own check.
6. **DRIFT D1/D2 — stale count comments.** `census-union.ts:2` ("151-entry
   union (150 group entries plus P-DELTA-4)") and `census.spec.ts:82`
   ("151 entries total") predate the capital-W absence ruling that took
   the union 151→152. Data (`UNION`), assertions (`152`), and the SPEC
   table are all 152-correct; only the two comments lag. One-line fixes,
   captain-owned files.
7. **DRIFT D3 — PLAN RS-12 unblocks cell.** `PLAN.md:419` names only
   `NEO-COND-05`, but the cond RS-12 lane (`TESTS.md:21`), the ledger row
   (`TESTS.md:15`), and the census BLOCKED table all show COND-10 blocked
   on the same RS-12 gap. The charter N1 line ("RS-12 → resume
   COND-05/10", `PLAN.md:1220`) is already correct; only the §5.3 cell lags.
8. **Census is self-guarding.** `census.spec.ts` asserts UNION==152, SPEC
   table==152, transcription multiset equality, per-group counts, keyword
   grounding, 43 families, and 12 still-blocked rows with RS owners — so
   any ledger edit that forgets a counterpart fails PARITY-02 rather than
   drifting silently. `census-families.ts:191-204` BLOCKED matches the 12
   rows exactly, COND-14 citing relabeled RS-17 per the captain ruling.

## 4. Implications for the N1 wave

- **Sail as chartered.** N1 order RS-14 → SITE-01/02/03, RS-11 →
  GLOBAL-06, RS-12 → COND-05/10 (`PLAN.md:1219-1220`) is fully grounded:
  every waiting row and its lane text verified above. No ledger fix gates N1.
- **Resume = TESTS flip + BLOCKED shrink, same landing.** `checkBlocked`
  asserts all 12 rows still read `blocked-on-rs` and `BLOCKED.length ==
  12`, so flipping a row to `done` without removing it from
  `census-families.ts` turns PARITY-02 red. Each N1 resume must update the
  group TESTS row and the BLOCKED table together (and the FAMILIES
  `blocked` cites that point at the row).
- **Fold the three prose drifts opportunistically.** D1/D2/D3 are
  comment/cell-only and need no dedicated slice; the captain can absorb
  them with the first N1 merge (files are captain-owned anyway).
- **RS-12 covers two resumes.** Whoever takes RS-12 owns both COND-05 and
  COND-10 proof rungs (shared lane text, distinct worlds/specs).

## 5. Out of scope

- Engine-side reproduction (do the RS gaps still reproduce against current
  Atomic?): other N0 scouts' question; this report covers the Neo ledger only.
- Re-running `agentneo`/`agentrs` suites or re-proving any green case.
- RS-13 (golden drift) and RS-6 (docs hygiene): no Neo TESTS row cites
  them; untouched.
- Voyage Two scope beyond N1 (N2/N3 sequencing, `SWITCH-READINESS.md`
  revisit) except as noted in §4.
- The `/tmp` R1 probe scripts cited in lane text (e.g.
  `/tmp/cond-batch4-r1/probe.mjs`): paths recorded, contents not audited.
