# READY Ask 7 — Names (D9): collision sweep at GO-time freshness

Date: 2026-09-20. Crew: PLUMB. Mission brief: `docs/missions/operation-jettison.md`.
Scope swept: `packages/reference-neo/docs/DOMAIN.md`, atomic `SPEC.md`
(`packages/reference-rs/modules/atomic/SPEC.md`), `tests/cases/` (atomic rs
stations + neo cases), and current identifiers repo-wide (`packages/`).
Method: `muse.search` regex sweeps + direct reads. Verdict first, challenges second.

## Verdict: all D9 names are free — with two challenges and three precision notes

Every identifier the Vocabulary proposes is unclaimed. No sweep hit contradicts
the 2026-09-20 "found none" claim. The challenges below are about the brief's
*own* claims (a wrong count, a phantom reservation) and one genuine word-sense
collision — not about availability.

## Sweep results (identifier by identifier)

| Proposed name | Hits in scope | Status |
|---|---|---|
| `NamerTables` | 0 | free |
| `LowerStep` | 0 | free |
| `lowerings` (identifier) | 0 as identifier; prose only (`conditions/README.md:13`, `values.rs:114`) | free |
| `rulesVersion` | 0 | free |
| `NAMER_RULES_VERSION` | 0 | free |
| `namer/` (dir) | no `js/namer/` (atomic `js/` holds `compile/ generated/ index.ts plans.ts README.md runtime.ts types.ts`); no `src/runtime/css/namer/` | free |
| `namer-goldens/` | 0; `atomic/tests/` has no golden/namer dir | free |
| `NAMER_UPDATE_GOLDENS` | 0 (pattern matches `TYPEGEN_UPDATE_GOLDENS` convention) | free |
| `resolve/lexical.rs` | 0; `src/resolve/` has no `lexical.rs` | free **but see Challenge 2** |
| `namer_goldens_are_fresh` | 0 | free |
| `ATM-SEAM-06..08` | 0 outside the brief | free **but see Challenge 1** |
| `ATM-NAME-08` | 0 (`ATM-NAME-01..07` taken, folders + SPEC prose) | free |
| `NEO-NAMER-*` | 0; no `tests/cases/namer/` group (groups: cond css global harness layer merge parity prim recipe resp site static sync token type) | free |
| group `namer` | 0 | free |

Station-ID ownership check:

- `ATM-SEAM-01..03`: SPEC.md prose + case folders. Taken, as expected.
- `ATM-SEAM-04`: **no case folder, no SPEC prose, no hit anywhere under
  `packages/` or `docs/missions/completed/operation-overmatch.md`.**
  It exists only as a citation: "Overmatch's minted ranges …
  `ATM-SEAM-04` … landed" (`docs/missions/completed/styletrace.md:317`)
  and the brief's own "Overmatch's" (`operation-jettison.md:402`).
  Reservation respected — but it is a phantom: nothing defines what it claims.
- `ATM-SEAM-05`: StyleTrace's — confirmed live. Case folder
  `tests/cases/ATM-SEAM-05/` (result carries `tracedJsxHosts`), cited from
  `js/types.ts:130` and `ATM-SITE-56/README.md`, claimed in
  `styletrace.md:324`. **But it has no SPEC.md prose entry** (SPEC lists
  SEAM-01..03 only; area table says SEAM total 3).

## Challenge 1 (brief's own count is wrong): "five `ATM-SEAM`" (§7)

The §7 pins table says SPEC has "seven `ATM-NAME`, five `ATM-SEAM`".
Actual: **seven NAME, three SEAM in SPEC prose** (01–03); SEAM-05 exists as
folder-only; SEAM-04 exists as citation-only. The brief overcounts by two and
under-documents by two. Recommendation: Slice 0/4 should (a) correct the count
in the brief, (b) add the missing `ATM-SEAM-05` SPEC prose (not Jettison's
station to write, but the table it extends should be truthful), and
(c) either cite Overmatch's definition of `ATM-SEAM-04` or mark it
"reserved, undefined" so a future reader does not go hunting as I did.

This does not block D9: 06..08 and NAME-08 are unambiguously free.

## Challenge 2 (real word-sense collision): `lexical` already means two things in atomic rs

The ask confirms the Neo side: `lexical` in `packages/reference-neo` is
prose-only ("mirrors that lexical rule", `split.ts:39`; "reads through it
lexically" in a forge evidence file). No identifier, no collision with
**primitives** / JSX hosts. The earlier draft's `primitives.ts` mistake is not
repeated. Confirmed.

But inside the atomic crate, `lexical` is already taken twice with a
*scope/identity* sense:

- `src/extract/scope/table.rs:23`: "One lexical scope…"
- `src/extract/resolver/source.rs:4,20,80,181`: "lexical keys", "lexical key",
  `sources_canonicalize_to_their_lexical_key`

The proposed `resolve/lexical.rs` ("a text or number operation the class stem
passes through") is a *character/text* sense — the same English word, a
different concept, one crate apart from the other two. A reader grepping
`lexical` in `modules/atomic` will find three unrelated meanings.

Options, cheapest first: (a) accept — the file path (`resolve/lexical.rs` vs
`extract/scope/`, `extract/resolver/`) disambiguates, and Rust module paths are
the real namespace; (b) name the file for what it does: `resolve/text.rs` /
`resolve/stem.rs`. I lean (a): the five functions (`is_structural_whitespace`,
`trim_structural`, `parse_finite_decimal`, `render_decimal`, `ascii_lower`)
are self-describing, and "lexical function" as a Vocabulary term has no
identifier rival. But the collision is real and HQ should pick knowingly —
this is the one D9 term that reuses a word already loaded in the same crate.

## Confirmed reuses (brief's "reused, not re-coined" claim holds)

- **namer**: prose everywhere ("one namer", "no second namer" in
  `stylesheet/name/README.md`, `runtime/README.md`, `atom/README.md`;
  `docs/ATOMIC.md` "Two artefacts, one namer"). `stylesheet::name` is the
  current code spelling; `@reference-ui/rust/namer` extends the family.
- **want / atom / slot / when / canonical**: live identifiers across the crate.
- **lower / expand**: `lower_when`, `lower_macro`, `lower_font` (rs);
  `lowerResponsiveStyles.ts` (neo). `LowerStep` / `lowerings` join an
  established verb family — good reuse.
- **miss**: `reportStyleMisses` (`neo/src/runtime/css/css.ts:72,202`). **ghost**:
  `ATM-GHOST-*` family. **seam**: `ATM-SEAM-*`. **station / case / group**:
  per DOMAIN.md campaign entries.
- **golden**: acceptable, with the exact boundary the brief draws. Neo retires
  the word for *its own* proof (`tests/README.md:21`: "cases and snapshots, no
  goldens, no `--update-goldens`") — but neo case docs already say "typegen
  golden", "engine golden", "ATM-COND-16's golden" for rs-side files without
  confusion. A Rust-generated `input → output` file the JS side reads is
  precisely the existing "rs golden" usage. `namer golden` fits; it does not
  reopen the retired "neo proves with goldens" sense.

## Precision notes (no collision; terms that earn their keep unevenly)

1. **`procedure`** is the vaguest word in the Vocabulary. It is free (zero
   identifier hits) and it is never spelled in code (each procedure keeps its
   own fn name), so the cost is only conceptual: nine unrelated functions
   (whitespace collapse, decimal render, slot join…) share one bland noun.
   It earns its keep as the *complement* of "table-shaped" (data vs code is
   the D7 cut), not as a description. Keep, but never use it unqualified
   outside the Vocabulary table — always "naming procedure" or "§9 procedure".
2. **`differential`** (free, zero hits) is the right word for NEO-NAMER-01's
   *gate* but will collide conversationally with "diff" (golden diffs, spec
   diffs). The brief already uses both senses ("the differential over every
   declaration" vs "Rust regenerates it and diffs"). Recommend: in SPEC prose,
   always "the differential gate" / "differential corpus", never bare
   "differential" where "diff" could misread.
3. **`rulesVersion` vs `schemaVersion`** will be two coexisting integers with
   different bump rules (naming-rule change vs artifact-shape change), checked
   at the same site (`registerRuntimeData`). Both free, both needed — but the
   Slice 4 README prose must state the bump rule for each in one place, or
   authors will bump the wrong one. Minor: consider `namerRulesVersion` on the
   wire for grep-ability; `rulesVersion` nested under `namer:` is already
   unambiguous (`namer.rulesVersion`), so this is optional.

## R15 spot-check

`rg -i jettison` over `packages/` (covers SPEC.md, DOMAIN.md, tests/cases):
**zero hits**. The only in-repo mention outside `docs/missions/` is the
citation link at `docs/ATOMIC.md:346`, which is outside R15's listed paths
and matches the existing mission-index convention. Holds.

## D9 recommendation

Accept the Vocabulary as written, with: (1) brief §7 SEAM count corrected and
SEAM-04 marked reserved-undefined (or cited); (2) `lexical` third-sense
acknowledged by HQ (recommend accept-with-path-disambiguation);
(3) the three precision notes folded into Slice 4 prose.
