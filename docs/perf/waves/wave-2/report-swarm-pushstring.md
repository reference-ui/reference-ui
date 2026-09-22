# REPORT: swarm-pushstring — push_string_want non-positional remainder census

## Verdict

**CUT (diet-addressable sum ≈ 0.1–0.3 ms fantasy clears neither the ≥8 ms SUM
bar nor the 5 ms per-phase floor; the ≈9–14 ms gross remainder is ~100%
necessary owned-box mallocs plus fenced ground — nothing in the brief's diet
class exists to build)**

One line: site-tagged census of all 82,582 push_wants (×3 identical runs,
line_col excluded by construction) proves every non-positional alloc is a
necessary `Box<str>` under `Want`'s current repr, all 15 non-literal push
sites are dead on the bench, growth is realloc's fenced ground, and the only
CPU (important-scans) is already minimal — the buildable prize rounds to zero.

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified `git rev-parse
  HEAD` first act and after revert; post cloneplasma-LAND tip).
- Census `.node` sha256: `5216513d8ef6281ee3a61412745968ccdc07b67632161001cb4ce6863cd35310`
  (counts only, never timed; release build, 18 pre-existing warnings, zero new).
- Census instrumentation: `#[track_caller]`-tagged env-gated (`SWARM_PUSHSTRING_DUMP`)
  per-want dump in `ExpressionWalk::push_want` (+58 lines, one file, zero call-site
  edits) — **fully reverted** (`git checkout`; tree == HEAD, verified).
- Raw dumps: `/tmp/swarm-pushstring-count{1,2,3}.err` (+`.json` run envelopes);
  aggregator `/tmp/swarm-pushstring-agg.py`. Bench-report byproducts reverted.
- Bench lock: one held block (setup + 3 count runs), two-step release; no foreign
  PIDs touched; install/build/JS-wrapper setup all inside the held block.

## Census method (line_col excluded by construction)

The dump records ONLY push_want construction fields per call: direct call site
(file:line via `Location::caller`), value variant + bytes, when len/bytes/spill,
prop bytes, origin none/some + bytes + value, file bytes + value, important flags,
span none/some, wants-vec growth event. No instrumentation inside
`span_position` / `line_col` / `LineIndex::line_col` / `for_source` — T1
(swarm-lineindex)'s live-then-BANKED ground is untouched and unmeasured here.

Determinism: 82,582 records ×3 runs; normalized sha (harness `neo-bench-XXXXXX`
tmpdir stripped — fresh `mkdtemp` per run, same length, path bytes differ)
**order-sensitive identical ×3** (`1dbd54a2…`; sorted-multiset `3ffacbed…` ×3).
Count-run bundle bytes pin-exact (css 2,867,925 / data 214,466) → output-clean.

## Exact remainder census (enterprise, pin stream, n=82,582)

| site (direct push_want callers) | calls |
| --- | --- |
| `extract/expressions/literal.rs:23` (`push_string_want`) | **82,582 (100%)** |
| other 15 sites (number/bool/template/branch/member/leaf/call/responsive/entries/call_lower) | **0** |

| construction field | count | bytes | note |
| --- | --- | --- | --- |
| value boxes (`AtomValue::String`, all `s`) | 82,582 | 478,019 (avg 5.79) | owned, necessary |
| when element boxes | 62,612 | 302,891 | len 0: 34,718 / 1: 35,614 / 2: 9,752 / 3: 2,498 |
| when SmallVec spills (len>2) | 2,498 | — | heap vec, necessary under inline-2 repr |
| prop boxes | 82,582 | 699,397 (avg 8.47) | **46 distinct** |
| origin boxes (always `Some`) | 82,582 | 349,794 | **2 distinct: `css` 48,566 / `recipe` 34,016** |
| file boxes | 82,582 | 7,235,667 (avg 87.62) | **3,120 distinct; ~66 B/want is bench-tmpdir prefix (≈75% artifact — real-path avg ≈22 B, real-shape ≈1.8 MB)** |
| important (param / ctx) | 0 / 0 | — | `split_important_flag` never hits |
| span `Some` (→ line_col runs) | 82,582 / 82,582 | — | T1's slice, 100% of wants |
| wants-vec growth events | 19,852 | — | **realloc ground — count-only, yielded** |
| **total construction box mallocs** | **395,438** | **payload 9,065,768 B** | positional excluded |

Cross-checks: T1 lineindex's 82,582 line_col queries ≡ these 82,582 push_wants
(span always `Some`) — the T1/T2 split is exact and disjoint. Resolve-side bridge:
82,582 pushed + 7,322 harvest-minted (by subtraction vs intclone's pin-stream
89,904 resolve total; mint constructs `Want` directly, harvest CUT fence stands).

## The losing math (fantasy at validated rates)

Rate: 20–33 ns per malloc-pair (33 ns = cloneplasma's Euclid rate validated on
this box: 700k pairs → measured −23.07 ms); memcpy ≈ 20 GB/s.

**Gross non-positional remainder:** 395,438 × 20–33 ns (7.9–13.0 ms) + 9.07 MB
memcpy (≈0.5) + important-scans (≈0.25) + struct init/moves (≈0.4) ≈ **9.0–14.2 ms
fantasy** — order-coherent with the flame remainder (push_want 18/15 incl minus
line_col 9/5 self ≈ 9–10 wt) at the low-rate end. The remainder EXISTS; it is
just not dietable:

| candidate (brief's diet class) | prize | ruling |
| --- | --- | --- |
| important-scan diet | saves ~half of 0.25 ≈ **0.1 ms** | already short-circuits (`checked_sub`+10 B tail compare); sub-noise |
| number/bool/template/other-site diets | **0.0 ms** (0 calls) | dead on bench |
| SmallVec inline 2→3 (kill 2,498 spills ≈ 0.08 ms) | **≤0 net** | +16 B per `Want` move × clone traffic — wash or negative |
| wants-vec growth (19,852 events) | fenced | **realloc ground — yield** (unknowable per-file cardinality anyway) |
| file/prop/origin interning (245,578 mallocs + ~8 MB) | repr-locked | `Want` owns `Box<str>`; needs repr surgery — **filler, not a diet** (below) |
| **diet-addressable SUM** | **≈0.1–0.3 ms** | **« 8 ms SUM bar; « 5 ms per-phase floor** |

No diet needs T1's slice because no diet exists: every box is necessary under the
current repr (all fields live or proof-observable — origin/file/line/col surface
under `proof=true`; resolve reads line/col per want per lineindex's lazy-dead
audit). CUT at both bars, fast, per the explicit falsification bar.

## Filler (filed sketch for a future crew, resolvefmt-style)

**Interned-`Want` repr (file/prop/origin → `Rc<str>` or intern IDs):** prize =
(82,582−3,120) + (82,582−46) + (82,582−2) = **245,578 mallocs ≈ 4.9–8.1 ms
fantasy** (20–33 ns) + ~8 MB memcpy ≈ 0.4 ms → **≈5–8.5 ms fantasy, realistic
≈3–5 ms** after FxHash probe tax (~15 ns × 82,582 ≈ 1.2 ms) + `Rc` traffic on
resolve-side clones. Fences: **wantctx LIVE** (coordinate any `Want`-ownership
change — their ground is the 79,431 session.when clones, adjacent not overlapping,
but the repr is shared); resolve readers (`Want::location()`, session, serde wire
compat); lineindex's lazy-dead audit (never re-propose lazy line/col); proof-mode
observability (origin/file/line/col must survive under `proof=true`); file-memcpy
is 75% bench-tmpdir inflation (real-path prize smaller on bytes, same on count).
Non-test `Want.origin` readers today: zero (only writer + harvest-mint setter +
test filter) — the field is diagnostic-dead on the default path, proof-live.

## Scope / fences (all respected)

- T1 swarm-lineindex (line_col + for_source): census excludes by construction;
  their BANK (ASCII-tail SWAR) cited, never touched; query counts corroborate
  (82,582 ≡ 82,582).
- Cloneplasma E1 (`when_strings` move-last, landed): cited, never redone; this
  remainder sits around it (extract-stream push path vs their resolve/builder sites).
- Realloc w:stage/w:want + collect-path reserves (banked): growth counted
  (19,852 events) but yielded — no reserve lines touched.
- Extract's landed `JsxHosts` union, sortshape bar (zero order changes — no diet,
  nothing to reorder), wantctx's live resolve-side borrow ground: all untouched.
- Builder-stream wants (32,281 intclone split) and harvest-minted wants: outside
  T2's literal→want scope; noted only for the count bridge.

## Rule checks

1. Counts-first: exact site-tagged census (3/3 identical, line_col excluded by
   construction) BEFORE any diet consideration; diet-without-census void — and
   the census voids the diet (SUM ≈ 0.1–0.3 « 8).
2. No 8-pair / identity / determinism timing: CUT by ceiling — no diet exists to
   time (sibling ceiling-CUT precedent: modgraph, lowermemo, rhythm, asmfmt,
   btreeset). Count-run outputs were pin-exact on bundle bytes regardless.
3. No suites / `pnpm agentrs q`: zero production diff (one-file instrumentation
   fully reverted; `git status` clean except this REPORT; HEAD still the pin).
4. Tree = REPORT.md only (untracked); no commits, no pushes — captain lands.
   Never wrote LOG.md (captain-only). Bench-lock protocol honored (one held
   count block, two-step release, no foreign PIDs).

## Process notes (disclosure)

- Queued behind scalarreproof → lineindex (both finished before my take); won a
  clean race on the free lock (`mkdir` atomic, no steal); wantctx/analysisb/
  recordaudit still queued at my release — my block was setup-heavy (fresh
  worktree: install + JS wrappers + release build ≈ 1 min total on warm caches)
  plus 3 count runs, then immediate release.
- Census `.node` build reproduced zero new warnings (18 pre-existing, matching
  cloneplasma's filed count); `cargo check` green pre-build.
- Raw evidence preserved: `/tmp/swarm-pushstring-count{1,2,3}.{err,json}`,
  `/tmp/swarm-pushstring-agg.py`.
