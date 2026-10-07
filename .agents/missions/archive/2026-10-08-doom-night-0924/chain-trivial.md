# Chain verdict — trivial: registry orphan-code fortify

- Date: 2026-09-25 (UTC; night-0924 campaign carryover)
- Oracle: chain oracle trivial (firsthand re-verification, nothing taken on word)
- Ruling: `.agents/missions/doom-night-0924/ruling-trivial.md`
- Hunt log: `.agents/doom/logs/2026-09-24-night-r1-audit.md`
- Repro: `bash /tmp/doom-r1-audit-repro.sh /Users/ryn/Developer/reference-ui` (unmodified)

## Verdict: VERIFIED

The fortify arc holds end to end: exactly the ruled one-line token swap, all
seven L-sites provably unfixed, blind repro green, a permanent pin with the
ruling's hardened shape green, all three sweeps shown firsthand, quality gate
clean. Commit-ready within its boundary.

## 1. Boundary: the one-line change (firsthand)

`packages/reference-rs/modules/diagnostics/REGISTRY.md:17` reads:

```
Valid: `ATM-W-UNKNOWN-PROPERTY`, `ATL-W-UNRESOLVED-PROPS-TYPE`, `RS-E-EXAMPLE-BOOM`.
```

- Middle token is `ATL-W-UNRESOLVED-PROPS-TYPE` (was the orphan
  `ATL-W-UNRESOLVED-PROPS` per hunt log + ruling §1). The other two examples,
  punctuation, backticks, and `Valid:` prefix are byte-identical to the ruled
  shape. Exactly the swap, nothing else on the line.
- Baseline note: the whole `modules/diagnostics/` dir is untracked
  voyage-new (`??` in `git status`), so there is no git-diff baseline for this
  file; verification is by content against the ruling and the hunt-time
  description. Inventory row 160 still carries the defined code
  (`REGISTRY.md:160`, via package-wide sweep), so the fix cites the existing
  row — no row added by this arc.
- The only other trivial-attributable file is the new pin
  `packages/reference-neo/src/diagnostics/registry.test.ts` (untracked, new;
  beside the diagnostics seam tests as the ruling suggested). No second pin or
  stray fortify file found.

## 2. L1–L7: none touched (each checked firsthand)

| Obs | Site | Expected (still as filed) | Actual |
| --- | ---- | ---- | ------ |
| L1 | `REGISTRY.md:96-98` preamble | overclaim intact, not reworded | intact: "every warn/err code parses in the template and pins a whole-compiler repro in Neo's `repro.test.ts`" |
| L2 | `packages/reference-neo/src/diagnostics/codes.ts:76` | "errors throw unchanged" comment intact | intact, verbatim |
| L3 | `packages/reference-rs/modules/diagnostics/src/message.rs:30-34` | gate prose still lists 6, omits 2 | intact: "Unknown properties, breakpoints, conditions, token paths, colors, and token categories" |
| L4 | TST `modules/tasty/src/diagnostics/mod.rs:17-23` | `parse_error` still `Diagnostic::warning` | intact, "keeping the recoverable shells" |
| L4 | ATM `modules/atomic/src/stream.rs:208` | `Diagnostic::error(ParseError)` | intact; the tracked M-hunk on this file only appends a `with_span` call (rendering-layer voyage work), constructor untouched |
| L5 | `modules/diagnostics/js/index.test.ts:160,177,190,193` | `RS-W-X` / `RS-E-X` fixtures still present | intact, all four lines |
| L6 | wire `code` fields, both packages | zero station/case IDs ride `code` | clean: `grep -l` for `"code": "ATM-SITE…"/"NEO-DIAG…"/"TST-RXP…"` across `*.json/*.ts/*.rs` returns nothing |
| L7 | globs + negative fixtures | still present, still confined | intact: `ATM-W-DYNAMIC-*` globs in `ATM-DIAG-07/11` READMEs; `ATM-W-FROM-THE-FUTURE` confined to `packages/reference-neo/src/cli/output.test.ts:294-295` |

Adjacent tracked modifications are voyage template-alignment, not this arc,
and none alter the ruled boundary: `atlas/js/types.ts` (stub → template
union, still includes the `-TYPE` code), `atlas/src/resolver.rs` (emit sites
refactored to `crate::diagnostics::…` constructors, same conditions/codes),
`atomic/.../codes.rs` (diff appends two tests only, zero table-row changes).

## 3. Blind repro: now PASSES (unmodified, repo root)

```
bash /tmp/doom-r1-audit-repro.sh /Users/ryn/Developer/reference-ui
→ vitest 1 passed (src/diagnostics/doom-r1-audit.test.ts), exit 0
→ "touched path clean (planted test removed, git status empty on it)"
```

Cited-minus-defined is empty; the red assertion is green.

## 4. New pin: hardened shape, green, no tautology

Read `packages/reference-neo/src/diagnostics/registry.test.ts` (65 lines) in
full. It implements the ruling's shape without dilution:

- (a) strict `NS-W/E-NAME` extraction over `REGISTRY.md`, skipping any match
  continued with `-*` (covers `RS-W-EXAMPLE-*`, `RS-E-EXAMPLE-*`, any glob);
- (b) defined set from the five module `CODE_TABLE`s plus the RS
  placeholders attested by the diagnostics crate's own goldens
  (`transport.rs`, `code.rs`);
- (c) asserts cited-minus-defined `toEqual([])`;
- (d) defined-size floor `>70` plus a cited-size guard `>60` against a
  vacuous extractor.

Not a tautology: extractor and defined set are independent (regex over the
registry vs. string literals over five tables + golden files), and both size
floors are live. Run: `pnpm agent vt
packages/reference-neo/src/diagnostics/registry.test.ts` → 1 passed.
Fail-without-fix stands on the evidence chain (red witnessed by hunter +
reproducer + ruler); the tree was not stashed, reverted, or mutated.

## 5. Sweeps (firsthand)

**(a) Bare-string sweep — zero source occurrences.** `ATL-W-UNRESOLVED-PROPS`
across `packages/reference-rs` + `packages/reference-neo`: 28 match lines,
every one carrying the `-TYPE` suffix (registry lines 17 + 160, atlas table /
union / tests / goldens / READMEs, Neo hints / repro / NEO-DIAG-52 case). Bare
orphan count: **0**. Binaries: `strings -a` over the shipped `.node` /
`.dylib` artifacts extracts fine (9171 strings in the arm64 `.node`) but
contains **zero** diagnostic code strings of any kind — the artifacts predate
the whole diagnostics surface (stale). Bare orphan in binaries: **0**; full
code likewise absent (honestly reported, not "only the full code").

**(b) No mint by this arc.** `ATL-W-UNRESOLVED-PROPS-TYPE` is minted by the
real atlas table (`codes.rs:33-37`, `UnresolvedPropsType` row) and predates
the arc (the hunt log cites this same table + inventory row 160 as the
definition). Two post-hunt defined-set additions exist —
`ATL-W-PACKAGE-SCAN-FAILED` and `TGN-W-DUPLICATE-RECIPE-STEM` — each with
8-point voyage-scale integration (table row, emit site, union member,
registry row, README/SPEC, dedicated tests). That breadth, plus no mention in
any doom ruling, attributes them to ambient voyage-landing evolution, not a
1-line fortify. The fix itself adds no row, emit site, union member, or
golden.

**(c) No L-item file modified** — per the table in §2.

**Gates:** `pnpm agentneo q
packages/reference-neo/src/diagnostics/registry.test.ts` → 0 errors,
0 warnings. `pnpm agentrs q` not applicable (this arc touches no Rust;
`REGISTRY.md` is docs).

## 6. Notes for the landing captain (non-blocking)

- The defined set has grown since the hunt (73 → 75+: the two codes above),
  so ruling sweep 3 ("defined set is unchanged") holds for the *fix* but not
  for the ambient tree. Both additions resolve cited ⊆ defined (pin green).
- Shipped native binaries are stale relative to the diagnostics surface;
  a rebuild will pick up the current tables. No action for this arc.
