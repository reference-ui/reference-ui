# Ruling — trivial: registry "Valid:" example cites orphan code

- Date: 2026-09-25 (UTC; night-0924 campaign carryover)
- Oracle: rule oracle trivial (red-team architecture adjudicator)
- Hunt log: `.agents/doom/logs/2026-09-24-night-r1-audit.md`
- Repro: `bash /tmp/doom-r1-audit-repro.sh /Users/ryn/Developer/reference-ui` — run unmodified, firsthand.

## 1. Repro confirmation (firsthand)

Ran the exact blind repro. Result: **confirmed**.

- Targeted vitest fails as filed: `expected [ 'ATL-W-UNRESOLVED-PROPS' ] to deeply equal []`.
- Exit 1 showing the orphan; planted test removed; touched path git-clean.
- Read-only cross-check: `packages/reference-rs/modules/diagnostics/REGISTRY.md:17`
  cites `` `ATL-W-UNRESOLVED-PROPS` `` under "Valid:", while the defined code is
  `ATL-W-UNRESOLVED-PROPS-TYPE` (atlas `codes.rs` table; registry inventory row 160).
  Bare-string sweep agrees the orphan occurs exactly once (the registry line itself).

## 2. Filed-break adjudication

**Verdict: BREAK** (severity: curiosity / doc integrity, minor user-facing edge).

- The orphan citation violates the registry's own header promise ("always present,
  always documented, and always traceable here") and inverts convention step 4
  ("a code with no row is unshipped") by presenting an unminted string as "Valid".
- Orphan reference is one of the brief's enumerated violation classes, and it sits
  in the normative contract document itself — not a will-never-work shape.
- User-facing edge (minor, as filed): a host author copy-pasting the example into a
  filter/suppression list builds a filter that silently never matches. No runtime
  manifestation: nothing emits, parses, or depends on the orphan string.
- Not a CURIO: the contract violation is crisp, mechanically demonstrated, and
  one line long. The exhaustive negative sweep (73 codes, emit sites, gates, unions,
  goldens, pairings — Appendix A) strengthens rather than dilutes it: this is the
  only integrity violation in a fully-audited surface.

## 3. L1–L7 triage (strict fold rule: same file AND one-line nature)

| Obs | Rule | Reason |
| --- | ---- | ------ |
| L1 — preamble overclaims repro coverage (`repro.test.ts` vs `repro-request.test.ts` + retired code) | **BANK-FOR-ARCHITECTS** | Same file, but NOT one-line nature: a prose-claim reword on a different clause (coverage promise, not shape example) requiring a wording decision ("reword, don't re-pin"). Does not fold. |
| L2 — Neo `codes.ts` "errors throw unchanged" imprecise | **CURIO** | Different file; comment-only, self-scoped to a warnings-only table, no normative weight. Verified harmless. |
| L3 — `message.rs` gate prose omits 2 of 8 members | **BANK-FOR-ARCHITECTS** | Verified real doc gap, but different file and different clause; gate itself exact on both sides. Small reword owed to architects, not this fortify. |
| L4 — parse-failure severity differs across modules (ATM-E vs TST-W) | **BANK-FOR-ARCHITECTS** | By-convention latitude per the finder ("not a violation"); a design note for architects, no action. |
| L5 — `RS-W-X`/`RS-E-X` fixtures outside `RS-*-EXAMPLE-*` reservation | **BANK-FOR-ARCHITECTS** | Test-only, shape-valid; the fix would be a normative wording call (preferred vs only legal fixtures) — architect decision, not a one-liner. |
| L6 — station/case IDs are a separate documented vocabulary | **CURIO** | Verified clean: none rides a diagnostic `code` field. No violation, nothing owed. |
| L7 — filter/glob fragments and intentional negative fixtures | **CURIO** | Every occurrence verified confined to tests/docs, none emitted. No violation, nothing owed. |

**Folded into fortify: none.** The fortify is the single break line, nothing else.

## 4. Fortify boundary

**May change (exactly one line):**

- `packages/reference-rs/modules/diagnostics/REGISTRY.md:17` — token swap only:
  `ATL-W-UNRESOLVED-PROPS` → `ATL-W-UNRESOLVED-PROPS-TYPE`.
  The rest of line 17 (the other two examples, punctuation, backticks) stays byte-identical.

**Must move together:** nothing. No L-item folds in.

**Sweep obligations (fortify crew must show all three):**

1. Re-run the blind repro unmodified → orphan list empty (the red assertion passes).
2. Bare-string sweep: `ATL-W-UNRESOLVED-PROPS` not followed by `-TYPE` occurs zero
   times across `packages/reference-rs` and `packages/reference-neo`.
3. No mint: the defined set is unchanged — the fix cites an existing code
   (inventory row 160), it does not add a row, emit site, union member, or golden.

**Stays untouched:**

- All five `codes.rs` `CODE_TABLE`s, all emit sites, all severity pairings.
- All three `DiagnosticCode` type unions; the Rust + JS suggestion gates;
  Neo's warning-hint table; all goldens, specs, case outputs, READMEs.
- Registry inventory rows, preamble, namespace/reservation clauses (L1, L5 wording
  explicitly out of scope).
- Every file named by L2–L7 (`codes.ts`, `message.rs`, ATM/TST parse sites,
  `diagnostics/js/index.test.ts`, station/case vocabularies, filter/glob sites).

**Pin owed (registry self-check test shape):**

- Commit a permanent test (hardened form of the repro's red test, not the planted
  temp file) that: (a) extracts every strict `NS-W/E-NAME` token cited in
  `REGISTRY.md`, excluding glob/reservation prefixes (`RS-W-EXAMPLE-*`,
  `RS-E-EXAMPLE-*` and any `*-` glob); (b) builds the defined set from the five
  module `CODE_TABLE`s plus the RS placeholders attested by the diagnostics
  crate's own goldens; (c) asserts the cited-minus-defined set is empty; (d) keeps
  a defined-size sanity floor (>70) so the test cannot pass vacuously.
- Suggested home: beside the diagnostics seam tests (RS side or Neo
  `src/diagnostics/`); exact path is the fortify crew's call, shape is not.

## 5. Bank ledger (for architects, no action in this fortify)

- L1: reword preamble repro-coverage claim (`repro-request.test.ts`, retired code).
- L3: complete `message.rs` gate prose to all 8 members.
- L4: parse-severity latitude note (ATM-E vs TST-W) — confirm deliberate.
- L5: clarify whether `RS-*-EXAMPLE-*` reservation is preferred vs only legal test strings.
