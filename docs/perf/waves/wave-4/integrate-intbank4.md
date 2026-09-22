# INTEGRATE.md — wave-4 intbank4: AUTHCSS + RECIPEPATH + SCALARJSON (swarm-intbank4)

Base pin verified FIRST: `git rev-parse HEAD` = `0939615d5c2730eb56bae5af47384d077266a78c` (match, proceed).
Tree clean at start and at filing (only this file, untracked, worktree root).
No commits, no pushes, never LOG.md — the captain lands (here: nothing to land).

Working verdict: **CUT with cause — member set empty, all three previously ruled.**
Final verdict line at the bottom of this file is authoritative.

## 1. Disposition summary (judge first)

All three briefed members were ruled BEFORE this dispatch by the certified
compile closeout (b8a75b0bd, HQ-ordered): "Unexplained-pending on sync ground:
ZERO. No integrator — member set empty." The dispatch (parent tip 1984163e2,
"the pending banks are compile-side") names three ruled members and cites no
new filed evidence. A dispatch cannot un-rule certified closeout entries;
re-litigating closed topics without new filed evidence is a protocol violation
(agent-perf §7). Per-member:

| Member | Banked claim | Disposition | Closed by |
|---|---|---|---|
| PERF-W2-AUTHCSS | −11.60/−1.12%, 8/8 | YIELD — all 6 hunks subsumed, no residuum | intclone race adjudication + landed ddce131e7 + closeout |
| PERF-W2-RECIPEPATH | −13.05/−1.30%, 7/8 | CUT stands — allocator lottery, three-tip sign flips | wave-3 re-proof + 3bc13d8a6 + closeout |
| PERF-W2-SCALARJSON | phase −2.1, 25/25 | SUPERSEDED — required merged shape already landed | scalarreproof in set-4/e360915f7 + closeout |

No candidate tree was assembled (nothing landable exists to assemble).
Improvement left on the table in banked compile work: 0 ms by receipt (closeout).

## 2. Per-member evidence (patch + report + LOG adjudication, all three read)

### 2a. PERF-W2-AUTHCSS → YIELD (subsumed, race-closed)

- Report (`docs/perf/waves/wave-2/report-swarm-authcss.md`, read in full):
  D-key lazy refusal key + D-col collapse gate + D-px resolvefmt filler,
  3 files +130/−13, base 0a5731681, 8-pair −11.60/−1.12% 8/8, sub-bar both
  prongs → correct BANK at filing.
- LOG adjudication: intclone ruled hunk-by-hunk with a dedicated count probe
  (`docs/perf/waves/wave-2/integrate-cloneplasma.md:163-232`): H1→R1, H2→R1,
  H3→U1 (probe: 502,127 values, gateonly=0 all 4 scales, :178-183), H4
  superseded test-only, H5→R3, H6→U1. "Disposition: authcss YIELDS" (:228);
  the sole off-load distinction (gate generality) is filed explicitly as
  "unmeasured follow-up material — not a LAND blocker and not a
  rebased-authcss claim today" (:234-241). Race rule already satisfied —
  nothing to re-adjudicate.
- Landed: cloneplasma ddce131e7 (ancestor of this base — in `git log`).
  Current-tree markers: lazy key `resolve/mod.rs:148`, Cow
  `resolve/normalize.rs:27,40`, exact-push `resolve/unit.rs:117`.
- Rebase record: `git apply --check authcss.patch` FAILS on all 3 files at
  this tip (`resolve/mod.rs:130`, `normalize.rs:120`, `unit.rs:111` — patch
  does not apply). Ground occupied; a rebase would require redesign, which
  the race ruling forbids. The brief's "extend adjacency" note is moot:
  extend LANDED in set-4 (e360915f7, ancestor) — no integrate order to file.
- Closeout: "AUTHCSS yielded-subsumed into landed cloneplasma (race rule)";
  index `overruledBy` mirrors it. No new filed evidence since.

### 2b. PERF-W2-RECIPEPATH → CUT stands (allocator lottery)

- Report (`docs/perf/waves/wave-2/report-swarm-recipepath.md`, read in full):
  escape-once, 2 files +60/−5, base 3dd32a6, 8-pair −13.05/−1.30% 7/8, with
  an explicit §5 allocator-second-order caveat.
- LOG adjudication chain: INT-W2-SET4 LOO +5.42 (2/8) + replicated +7.80
  (1/8) → captain HELD it as a replicated directional contra and stated the
  subset-confirm rule (subset-confirm, not a free ride); INT-W2-SET4B
  SUBSET-without-recipepath −19.25 8/8 beat FULL-with-it −14.07 → subset
  landed e360915f7 ("Recipepath HELD" in the commit message, ancestor).
  Wave-3 re-proof (`docs/perf/waves/wave-3/report-swarm-recipeproof.md`, read
  in full): three-tip sign lottery −13.05 → +5.42/+7.80 → −12.67 (:165-169)
  against a ~1–3 ms first-order mechanism ceiling (:67-73) → CUT (HELD→CUT),
  committed 3bc13d8a6 (ancestor). Bank conditions for ANY re-open (:192-204):
  (a) non-ident class-name load, or (b) sign reproduces across ≥2 compositions
  on the same tip. The brief cites neither; none is filed anywhere.
- Current-tree ground: diet deliberately ABSENT — `emitter/mod.rs` holds only
  the pre-diet per-atom `recipe_selector` (:250, called :159); no
  `escaped_base_selector` / `recipe_selector_from_base` anywhere.
  `git apply --check recipepath.patch` is CLEAN — but applicability is not
  landability: applying it now would reintroduce a CUT diet against the
  wave-3 CUT + certified closeout. Forbidden.
- Closeout: "RECIPEPATH HELD→CUT (allocator lottery, PERF-W3-RECIPEPROOF)";
  index `overruledBy` mirrors it. Sortshape bar (zero order changes) is
  satisfied by the patch but irrelevant to a CUT member.

### 2c. PERF-W2-SCALARJSON → SUPERSEDED (merged shape already in tree)

- Report (`docs/perf/waves/wave-2/report-swarm-scalarjson.md`, read in full):
  scalar fast frame, `serializer.rs` +230/−9 + new parity suite, base
  5844b24a8; phase −2.1 vs legacy (25/25 ×2), +0.28 marginal vs diet shape;
  whole-sync −14.59 carried an explicit 7×-mechanism noise disclaimer (no-LAND).
  Collision notes (:197-210) specify the merged shape the brief requires:
  generic signature + fast frame for scalars + keys2's borrowed-when tuple,
  combined expectation ≈1.9 ms NOT the sum.
- LOG adjudication: scalarreproof re-proved exactly that merged shape
  (WhenSteps step-iteration trait, 3 impls, landed diet body verbatim in
  fallback) and LANDED in set-4/e360915f7 (ancestor; message: "WhenSteps
  generic frame"; stat: `serializer.rs` +240). keys2 (set-1/810b8b5b4,
  ancestor) is in the tree as briefed.
- Current-tree markers — the brief's REQUIRED merged shape, verbatim:
  `LookupKey<'a, W>` (`runtime/serializer.rs:37`), `WhenSteps` + 3 impls
  (:65,69,75,81), generic `serialize_lookup_key<W: Serialize + WhenSteps>`
  (:91), scalar fast frame `write_scalar_tuple` (:120).
- Rebase record: `git apply --check scalarjson.patch` FAILS
  (`serializer.rs:60` context mismatch + `tests/serializer_parity.rs` already
  exists — scalarreproof's 247-line suite occupies the path). Nothing to
  assemble, no HOLD to file: the successor is landed; the original patch is a
  retained record (closeout's words).
- Closeout: "SCALARJSON superseded by landed SCALARREPROOF (set-4...)";
  index `overruledBy` mirrors it. The brief's HOLD fallback never triggers —
  HOLD is for unlanded ground needing design; this ground is landed.

## 3. Collision analysis (file:line evidence)

Member-vs-member: the three patches touch DISJOINT files — authcss
`resolve/{mod,normalize,unit}.rs`, recipepath `stylesheet/emitter/{mod,
emitter_ordering_tests}.rs`, scalarjson `runtime/serializer.rs` +
`tests/serializer_parity.rs`. Zero member-vs-member textual overlap (file
lists from index entries + patch headers). Irrelevant in outcome: no two
landable members exist to collide.

Member-vs-landed-tree (sets 1–5 + cloneplasma + T1, all ancestors of base):

- authcss vs landed cloneplasma (ddce131e7): 3 diet files are a STRICT SUBSET
  of cloneplasma's 5; every hunk subsumed per the intclone map (§2a). Current
  tree carries R1/U1/R3 at the cited lines. Overlap = 100%, adjudicated.
- recipepath vs landed tree: disjoint from all landed diets (emitter ground
  untouched by sets 1–5; sysprefix landed in `name/*` + `cascade/*`, per the
  crew's verified §6). Ground deliberately EMPTY (§2b) — the CUT, not a
  collision, bars landing.
- scalarjson vs landed scalarreproof (set-4/e360915f7): same two files;
  landed WhenSteps shape occupies the exact region (§2c). Overlap = 100%,
  superseded.
- T1's landed scan diet (1e4e3a0b5 `perf(neo)`): different package
  (`packages/reference-neo`) from all three members (`packages/reference-rs`)
  — zero file overlap by construction.
- Fences honored, none touched: `atomic/native.rs`, `atomic/src/scan.rs`,
  `atomic/src/types.rs`, neo `fragments/lib/scanner.ts` — no member patch
  lists any fence file, and this integrator modified zero files.

Doctrine applications (already spent, not re-spendable): the RACE rule was
discharged by intclone's hunk-by-hunk + count-probe adjudication; the
SUBSET-CONFIRM rule was discharged by the captain at set-4 (recipepath earned
its subset-confirm, then its CUT). Invoking either again on the same evidence
would be re-litigation, not diligence.

## 4. Proof (documentary + tree — no timed runs; cause below)

- Base pin: `git rev-parse HEAD` = brief pin exactly (§0). Parent tip
  1984163e2 is the dispatch commit itself; nothing postdates it.
- Landed-SHA chain in `git log` (all ancestors): 810b8b5b4 set-1 (keys2),
  0a5731681 set-2, 3dd32a6 set-3, ddce131e7 cloneplasma, e360915f7 set-4
  subset (scalarreproof/sysprefix/extend), 6c3909506 set-5, 3bc13d8a6
  recipeproof CUT, f116cfca0 wave-2 closeout, 1e1ad31d9 wave-3 closeout,
  b8a75b0bd compile closeout (the ruling), 1e4e3a0b5 T1.
- Rebase checks (read-only, this tip): authcss FAILS 3/3 files, recipepath
  clean (CUT-barred), scalarjson FAILS (file + occupied test path).
- Tree markers verified by grep: mod.rs:148, normalize.rs:27,40,
  unit.rs:117, serializer.rs:37,65,69,75,81,91,120, emitter/mod.rs:159,250
  (pre-diet shape, diet absent).
- Index: 100 entries, built 2026-09-22T14:03Z (post-closeout, pre-dispatch);
  all three members carry `overruledBy`; wave-4's 7 entries are scan-side
  only (zero compile-side re-open evidence); substring-AND search over the
  three grounds returns only the closeout carrier. No new filed evidence
  exists for any member.
- Bench lock: never taken; claims file untouched (no holds → no claims lines
  required). No foreign processes contacted. No binaries built — nothing
  timed anything.

## 5. WHAT-WAS-NOT-DONE (mandatory)

- No candidate tree assembled: every member is previously ruled (yielded /
  CUT / superseded); there is no landable content to compose, so no 8-pair
  SUM-confirm and no per-member LOO bisect were run. Running timed sets on an
  unchanged tree would manufacture theater, not proof; timing a CUT or
  subsumed diet without new filed evidence would re-litigate closed topics.
- No 4-scale byte-identity, determinism, suites-vs-tip, or `agentrs q` runs:
  all are comparisons of a candidate against tip — with no candidate they
  have no object. Tip hygiene was certified firsthand at every landing commit
  and reconciled by the closeout; re-running those gates here would prove
  nothing about the members.
- No rebase attempted beyond read-only `--check`: authcss/scalarjson fail to
  apply (ground occupied) and forcing them would require redesign — forbidden
  for an integrator ("never rewrite to force") and barred by the race /
  supersession rulings. Recipepath was NOT applied despite checking clean —
  landing a CUT diet is forbidden.
- No HOLD filed for scalarjson: HOLD is for unlanded ground needing design;
  its merged shape is landed via scalarreproof. No subset exists to confirm:
  the landable subset of {yielded, CUT, superseded} is empty.
- No bench-lock rotations consumed, no suites run, no toolchain provisioned:
  judgment closed the set before execution could begin. That is the correct
  shape of this outcome.

## Verdict

**CUT with cause — land nothing: AUTHCSS yielded-subsumed into landed
cloneplasma (race-adjudicated, no residuum), RECIPEPATH CUT stands (allocator
lottery, bank conditions unmet, no new evidence), SCALARJSON superseded by
landed scalarreproof (required merged shape verbatim in tree); member set
empty per certified closeout b8a75b0bd, 0 ms left on the table; no candidate
assembled, no timed runs, tree untouched.**
