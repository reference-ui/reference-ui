# Shot 2 information question — REPORT

Crew: swarm-shot2 (wave-2 reserve probe). Base pin verified:
`5844b24a81a528ace14fab63e908793a6829a874`. No production code changed.
Bench lock never taken: no timed validation was needed — every count below
is a static proof from the seeder + gate code, double-agreed with filed
evidence (census 15,122 = static 15,122 = alloc "Files: 15122").

Question: what SOUND fact identifies a file as dead (its open contributes
nothing to the compile) BEFORE its content is opened, on arbitrary repos?

## Prize arithmetic (filed)

- Scan opens: 15,122 files; scan-phase open 239.42 ms
  (`docs/evidence/counters/enterprise-counters3/summary.md`).
- Per-open 15.87 us warm avg (`census-net.json`); 250/251 `__open` weight
  via `uv__fs_work [node]`, i.e. the JS scan's `readFileSync`
  (`docs/evidence/flamegraph/enterprise-flame3/callers.md`).
- Dead files: 12,000 of 15,122 (Warpdrive §2; LOG rooms).
- Dead-open prize: 12,000 x 15.87 us = **~190 ms**
  (239.42 x 12,000/15,122 = 190.0 ms). Count-only; per-op is floor.

## Core finding (the whole answer in five points)

1. On seed-7, **dead = the 12,000 `src/util/util{i}.ts` files**
   (`deadFile` template: `export const FACTOR_{i}` + combiner, ~125-135 B,
   no import/css/recipe/`<`/quote bytes). Static: include
   `['src/**/*.{ts,tsx}', 'theme/**/*.ts']` matches exactly
   3000 ui + 120 recipes + 12000 util + 2 theme = **15,122** = census.
2. All 12,000 dead files are **streaming candidates**: `styling_skip`
   (no `import`/`css`/`recipe`/`<`) AND `string_skip` (no quote/backtick)
   are both true by template inspection
   (`packages/reference-rs/modules/atomic/src/lib.rs:376-395`).
   The W1 post-read byte gates already identify 100% of seed deadness —
   after the open.
3. `streamed` is a **content property** (needle absence). It is undecidable
   pre-open: live and dead seed files share every path/stat class
   (`.ts`, kept dirs, overlapping sizes — see the size-trap kill below).
4. Worse: even needle-absence does not imply dead. The engine's own
   `failed_needle_free_entries_keep_their_warning` test
   (`hosts/entries.rs:112-125`) proves a needle-free file
   (`export function Broken( {`) must keep its entry when its parse
   failed, so the re-parse fails identically and the located warning
   survives (C1 keep-alive; three sites: extract, resolver, hosts trace).
   The keep-alive needs the parse outcome; the parse needs the bytes;
   the bytes need the open.
5. Therefore **no sound pre-open signal identifies any seed dead file**.
   Maximum sound pre-open identification on seed-7: **0/12,000 (0.0 ms)**.

## What "contributes to the compile" (liveness channels, one file)

A pre-open skip must prove absence through ALL of these (all content-fed):

1. Fragment match -> bundle -> spec (`scanner.ts splitScan`; discovery
   needs content; dotfiles/`d.ts` excluded from matches but COMPILED).
2. Exported constants consumed cross-file (`stream.rs
   merge_constants_ordered` runs over every source incl. streamed;
   `ValueGraph` resolves cross-file).
3. Resolver/identity records (`StreamedSource::collect` for every file).
4. Extract wants/recipes/diagnostics/authored/sinks (gated by
   `styling_skip` — post-read).
5. Harvest pool strings — position-free whole-AST walk, including
   type-position literals (`harvest/literals.rs`: "Position is
   irrelevant").
6. Host-trace entries (gated by `trace_skip` — post-read — plus
   failure keep-alive).
7. Analysis expectations (content-gated post-read).
8. **Parse errors/panics -> diagnostics** (`report_parse_errors` covers
   ALL sources incl. streamed). ANY file can carry a syntax error that
   becomes an error diagnostic and throws the sync. This channel alone
   kills every content-blind file-class skip.
9. Partition catalog (inert unless facts reference the file).

Compilation is scan-based, not graph-based: `sources::collect` takes all
in-scope files and every one extracts independently (cf.
`include_scopes_virtual_files`: unimported files emit). There is no entry
concept; reachability from entries is meaningless to the engine.

## Per-candidate verdicts

### 1. Engine-gate mirror pre-read (path-only) — SOUND, 0/12,000, 0.0 ms

Mechanism: the JS scan reads every glob candidate, THEN applies the
native IGNORE-dir + extension gates to build retention (GAPS-2
match-before-filter, `scanner.ts:174-206`). Apply the retention half to
candidate paths before `readFileSync`, keeping reads for every matchable
(non-dot, non-`d.ts`) file.

Soundness: sound. A file is skipped pre-read iff unmatchable
(dot-segment or `.d.ts`, pure-string predicate, no divergence possible)
AND mirror-unretained (ignored dir or non-source ext). Matches are
bit-identical (unmatchable files never match regardless of content);
retention is bit-identical (native's union walk only re-adds paths
passing its own kept/ext gates, so a dropped path stays dropped
exactly when native would never read it — and any mirror bug on the
retention half self-heals via the union backstop, costing perf, never
correctness). Unreadable-but-retained files still attempt reads, so
failure semantics are unchanged.

Counts: on seed-7, every one of the 15,122 candidates is a non-dot,
non-`d.ts`, source-ext file in a kept dir. Pre-drop set = **0 files**,
**0.0 ms**. Arbitrary-repo value is limited to
(dot-or-`d.ts`) AND (ignored-or-non-source) files under loose globs.

Shape (if ever wanted): in `scanFragmentSources`, partition `candidates`
with the existing `hasDotSegment`/`isDeclarationFile`/`hasIgnoredDir`/
`hasSourceExtension` helpers before `readAllOrdered`; read only
(matchable OR retained). No native change. Not a lane (no ms); fold-or-
drop hygiene at most.

### 2. Zero-byte stat gate — sound-argued, 0/12,000, NEGATIVE value

Mechanism: `stat` each candidate (`fg stats:true`); skip the open when
size is 0.

Soundness: `""` parses clean (empty module), carries no needles (all
four content gates skip), no constants/imports/strings/matches, and no
facts (catalog inert). Argued sound; moot (see counts).

Counts: seed has zero empty files (`deadFile` emits ~125-135 B).
**0 files, 0.0 ms** — while ADDING one stat (~2.56 us avg per census)
to each of the 15,122 files (~+39 ms) and needing a matching native-side
gate (else the union walk re-opens the dropped path). KILL on value.

### 3. Basename conventions (`*.test.*`, `*.stories.*`, `__tests__/`) — KILL

Mechanism: skip test/story/fixture-shaped paths pre-open.
Soundness: UNSOUND. Counterexample: `Button.test.tsx` containing
`import { css } from '@reference-ui/react'; export const x = css(...)` —
in scope, source ext, kept dir: the engine extracts wants from it today.
Skipping changes stylesheet bytes. Warpdrive §9: filename conventions
fail on sight. Counts: 0 sound. No shape.

### 4. Extension narrowing beyond the engine gate — KILL

Mechanism: compile only a subset of `{tsx,ts,jsx,js}` (e.g. skip `.js`).
Soundness: UNSOUND. `is_supported_extension` (`sources.rs:210-215`) is
the engine's contract; a `.js` file with `css()` calls is live today.
Counts: 0 sound. No shape. (The engine's own ext gate is candidate 1.)

### 5. Directory allowlists beyond IGNORE+include — KILL

Mechanism: engine-side allowlist (e.g. only `src/`, `components/`).
Soundness: UNSOUND. User `include` globs already ARE the allowlist and
are honored; any further engine-side list changes file semantics
(out of bounds, Warpdrive §3). Counterexample: styles under `lib/`,
`app/`, any non-listed dir on an arbitrary repo. Counts: 0 sound.

### 6. Seed-shape traps (`src/util/`, `FACTOR_*`, size threshold) — KILL

Mechanism (the tempting one): dead files live in `src/util/`, are named
`util{i}.ts`, contain `FACTOR_*`, and are ~125-135 B while live files
are ~300 B+. A `src/util/**` rule, a name rule, or a <200 B size rule
each separates seed dead/live near-perfectly.
Soundness: KILL TWICE. (a) Out of bounds on sight: special-casing
benchmark paths, `FACTOR_*` names, or the locked fixture's shape
(Warpdrive §3). (b) UNSOUND on arbitrary repos: `src/util/` routinely
holds styles; and a 69-byte file
`import{css}from'@reference-ui/react';export const a=css({color:'red'})`
is live. The size threshold is the most dangerous false signal in this
report — perfect on seed, catastrophic anywhere else. Counts: 0 sound.

### 7. Package-manifest reachability — KILL

Mechanism: only open files reachable from `package.json` entries/exports.
Soundness: UNSOUND. The engine has no manifest/entry concept (§"liveness"
above: orphan file with live `css()` emits today). Counterexample:
unimported `orphan.ts` with a `css()` call — dropped by the signal,
present in output today. Plus: monorepos, multiple manifests, no
manifest. Counts: 0 sound. No shape.

### 8. Import-graph reachability from entries — KILL (double)

Mechanism: build the import graph, open only what entries reach.
Soundness: UNSOUND twice. First, same as 7 (no-entry scan semantics;
constants/harvest/JSX-only providers reachable from nothing). Second,
chicken-and-egg: the graph's edges ARE content — building it requires
opening the files it would skip. Counts: 0 sound. No shape.

### 9. Cached manifests / prior-run cache — KILL (out of bounds)

Mechanism: persist per-file deadness across runs; skip known-dead opens.
Soundness: n/a — out of bounds. Warpdrive §3/§9: a persistent cache or
caller-provided truth is warm/incremental product work under today's
cold `sync(cwd)` contract, explicitly excluded ("file such a need as a
product decision"). Counts: not a Shot 2 lane. Shape: none here; if HQ
wants it, it is a public manifest/cache contract proposal, not this
track.

### 10. Content-gate-before-open — KILL (incoherent)

Mechanism: apply the needle gates without opening.
Soundness: incoherent as stated — content requires the open, and there
is exactly one open per file (1.02/file; C3 single read already shares
it between scan and compile; no second open exists to gate). Variants:
page-residency (`mincore`) proves nothing about content; block-level
tricks don't read bytes. The only coherent reading ("cheap stat before
expensive open") is candidate 2. Counts: 0. No shape.

### 11. Discovery-match as compile filter — KILL (falsified by seed itself)

Mechanism: compile only files matching fragment discovery
(`importFrom: @reference-ui/neo, ...`).
Soundness: UNSOUND — match-fail does not imply dead, in four ways:
(i) constants providers (no stylable import, consumed cross-file);
(ii) harvest-only files (strings, no styling needles — the engine keeps
a separate `string_skip` gate precisely because these are live);
(iii) JSX/style files importing any module other than the five
discovery IDs; (iv) `d.ts`/dotfiles, which never match yet ARE compiled
(pinned by `disk_scan_pins_the_tricky_set`). Decisively: on the seed
load itself the 3000 live components import `@reference-ui/react` and
match NO discovery pattern — this signal drops every live file.
Counts: 0 sound (naive seed "identification" 15,120/15,122 — all of it
false-dead). No shape.

### 12. Retention as match pre-filter — KILL

Mechanism: skip fragment-matching reads for unretained files.
Soundness: UNSOUND. Matches cover every readable candidate (GAPS-2
match-before-filter is pinned semantics with tests,
`scan-retention.test.ts`); a discovery-matching file under `dist/` is in
`matches` today and feeds the portable bundle. Dropping it changes the
artifact. No backstop (unlike retention). Counts: 0 sound.

### 13. `.d.ts` skip — KILL

Mechanism: never open declaration files.
Soundness: UNSOUND. Counterexample A (bulletproof): `broken.d.ts` with
a syntax error emits a `ParseError` diagnostic today (channel 8 covers
all sources); skipping loses it and can un-throw the sync.
Counterexample B: `type Tone = "red"` — harvest's position-free
whole-AST walk collects type-position string literals into the pool,
where `mint` crosses them with kind-compatible sinks into wants.
Counts: 0 sound (seed has 0 `d.ts` under include anyway).

### 14. Dotfile skip — KILL

Mechanism: never open dot-segment paths.
Soundness: UNSOUND. Dotfiles are full sources; the tricky-set test pins
`src/.hidden.ts` as compiled. A dotfile with `css()` is live. KILL on
sight. Counts: 0 sound.

### 15. mtime/size incremental — KILL (out of bounds)

Mechanism: skip files unchanged since a baseline.
Soundness: a cache by another name — no baseline exists under cold
`sync(cwd)`; out of bounds per candidate 9. Counts: not a lane.

### 16. `access()` pre-check / inode dedup — KILL (no prize)

Mechanism: `access(2)` to predict read failure; shared-inode single open.
Soundness/value: `access`+`open` costs more than `open`-fails on the
rare failure; dedup saves nothing (1.02 opens/file — no dup opens) and
would corrupt path-keyed diagnostics/ordering (same inode at two paths
compiles as two sources). Counts: 0 ms. No shape.

### 17. Native union-walk elimination — not an open-saver

Note (not a candidate): `collect_candidate_paths` re-walks dirs but
performs zero reads (paths only; the ~1.0 extra opens/file beyond scan
are config/bundle/publish traffic, not union backfill — the JS list is
already complete). Eliminating it cannot move the 190 ms. Out of scope.

## Ranked table (sound identification on seed-7 enterprise)

| signal | sound fraction | attributable ms | soundness |
| --- | --- | --- | --- |
| engine-gate mirror pre-read | 0/12,000 | 0.0 | SOUND, prize-less |
| zero-byte stat gate | 0/12,000 | 0.0 (net negative) | argued, moot |
| basename conventions | 0 | 0.0 | KILL unsound |
| extension narrowing | 0 | 0.0 | KILL unsound |
| dir allowlists | 0 | 0.0 | KILL unsound |
| seed-shape (util/FACTOR/size) | 0 | 0.0 | KILL OOB + unsound |
| manifest reachability | 0 | 0.0 | KILL unsound |
| import-graph reachability | 0 | 0.0 | KILL unsound (x2) |
| cached manifests | — | — | KILL out of bounds |
| content-gate-before-open | 0 | 0.0 | KILL incoherent |
| discovery-match filter | 0 | 0.0 | KILL unsound (seed-falsified) |
| retention-as-match-filter | 0 | 0.0 | KILL unsound |
| `.d.ts` skip | 0 | 0.0 | KILL unsound |
| dotfile skip | 0 | 0.0 | KILL unsound |
| mtime incremental | — | — | KILL out of bounds |
| access/inode tricks | 0 | 0.0 | KILL no prize |

## Confirmation protocol / falsification criteria

There is no winning signal to confirm. The KILL stands unless one of
these resurrection criteria is met (any one reopens the track):

- R1: a pre-open predicate P is filed with (a) a zero-false-dead proof
  over arbitrary repos covering all nine liveness channels above
  (explicitly: constants providers, importers/re-exports, harvest-only
  files, JSX-only files, diagnostics incl. parse failures, dotfiles,
  `d.ts`, symlinks, races, deterministic order), (b) a measured seed-7
  count >0 with byte-identical output + identical diagnostics/order,
  4-scale. The standing falsifier for any P: `export function Broken( {`
  (needle-free, must keep its warning) and the 69-byte live file above.
- R2: HQ admits a persistent-cache / caller-manifest product contract
  (candidate 9 graduates to a product lane outside this voyage's bounds).
- R3 (micro-slice, optional hygiene): candidate 1's confirmation is a
  loose-glob fixture (dot/`d.ts` files under `dist/` + outside include)
  asserting byte-identical matches/retention/output with fewer opens.
  Prize ~0 on seed; run only if folded into unrelated scan hygiene.

Falsification of the counts: regenerate seed-7 enterprise
(`pnpm bench:neo -- --scale enterprise --keep`), `find` the kept repo
for dotfiles / `d.ts` / empty / non-`.ts` files under include, and diff
against the static claim (0/0/0/0). No instrumented build required.

Note on prize leakage: the 190 ms cannot leak parse-side either.
Streamed files MUST still parse transiently (constants + C1 keep-alive
+ resolver staging), and parse-validity is unprovable without bytes —
so dead files keep their transient-parse cost under every outcome here.
That cost belongs to the parse/oxc room (swarm-parse), not this track.

## Kill clause — replacement milliseconds (heavy-track rule)

Shot 2 (heavy track #1, ~190 ms) is dead: no sound pre-open signal
identifies any of the 12,000 dead opens. Its milliseconds are replaced
from LOG rooms as follows (weights ≈ ms at the instrumented profile
rate; scale x0.96 to the ~1186 base):

- **Heavy track #2, parallel compile, file-level 100-140 ms** (LOG rooms;
  Shot 3 memo): the primary replacement — the only remaining room
  shaped like the lost prize.
- **Diagnostics/proof diet, 76 wt incl room** (LOG rooms, unworked;
  swarm-diag active): the balance — 100-140 + up to 76 = 176-216 ⊇ 190.
- Backstop: canon remainder (~83 wt - ~37 banked ≈ 46 wt), parse/oxc
  visit-less (110 wt), serializer/module-graph remainder (40-60 wt
  less banked ladder share), emission remainder (~20 wt).

Honest caveat: these are room SIZES, not promised captures; capture
ratios belong to their crews. Standing consequence (LOG): single-thread
diet cannot reach ~700 ms alone, and now carries +190 ms more weight —
parallel compile is MANDATORY to finish, not a hedge.

## Verdict line

**KILL** (replacement ms named: parallel-compile file-level 100-140 +
diagnostics/proof diet room 76 wt = 176-216 covering the lost ~190;
canon/parse/serializer/emission remainders as backstop).
