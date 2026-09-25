# Oracle ruling: Neo TS cluster (night 2026-09-24)

Oracle: rule oracle neo. All three repros run blind, unmodified, from the repo
root, one at a time. Each exited 1 with the finder's predicted output; the
tree showed no writes of mine between runs (observed diffs were fellow
hunters' concurrent add/remove churn in `packages/reference-rs` and
`.agents/missions`). Read-only on source; no fixes applied.

Contract-quote verification: every cited contract below was re-located in
the tree by the oracle before ruling.

---

## A. Sync error throws drop stable codes — BREAK (confirmed)

Hunt log: `.agents/doom/logs/2026-09-24-night-r1-neo.md`
Repro: `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-r1-neo-red.mjs`
Oracle replay: exit 1. Engine minted `ATM-E-UNKNOWN-TOKEN`; throw read
`native compile failed:\n- unknown token reference \`{colors.nope}\`
(…/theme/bad.ts:3:33)` — 0 of 1 codes named. Matches the log exactly.

### Adjudication

Genuine BREAK. Three contracts verified, all genuinely violated:

- `packages/reference-rs/modules/diagnostics/REGISTRY.md:4-5` — "A code is
  always present, always documented, and always traceable here" (oracle
  note: the registry lives in reference-rs, not Neo; the citation is valid,
  the path in the log underspecified).
- `packages/reference-neo/src/diagnostics/report.ts:97-98` — "The stable
  codes ride the verbose lines so censuses count by `rg -c`, not by prose."
  Errors ride no lines at all: `reportSyncDiagnostics` prints warnings
  only, and the throw carries no code segment.
- `packages/reference-neo/src/diagnostics/README.md:25-27` — "Every error
  code earns one repro test that … asserts the code with its severity."
  The platform mints, validates, and suite-pins codes the sole error
  presentation then drops.

No alternate error surface exists: `reportedSyncEntries` filters to
warnings (`report.ts:83-91`), and both CLI failure lines print
`messageOf(err)` from this same throw (`src/cli/sync.ts:70`; watch-runner
equivalent). The throw shape is pinned nowhere — oracle verified the
string `native compile failed` occurs only in `report.ts` — so the
omission is oversight, not design.

### Severity: confirmed user-facing, with one calibration

The finder claims "every failed sync across every author hides the failure
class." Confirmed against the new boot-block output: the just-committed
CLI-UX change (`360b003f1`) prints the boot block on success paths only
(`reportOneShotSuccess`, `sync.ts:85-93`; "Errors stay with their commands
— loud, full cause, unchanged," `output.ts:176-178`). The failure line is
byte-identical in shape to before, still fed by the codeless throw. The
boot block mitigates nothing here. Calibration: this is
debuggability-severity, not correctness-severity — syncs fail correctly,
authors just cannot name the failure class. Prose-match debugging across
`ATM-E-*` refusals is the real cost; identical prose across distinct
classes is indistinguishable. No downgrade to curio.

### Fix-shape ruling against the new output

- **Coded throw (adopt):** add the `CODE: ` segment to the throw lines in
  `throwOnErrorDiagnostics`, mirroring the `formatVerboseWarningLine`
  convention (`location CODE: message`). This is the only shape that works:
  the throw is the sole carrier into the failure lines.
- **Coded stderr line at the CLI (reject):** the catch sites hold only
  `messageOf(err)` — an unstructured string. Codes cannot be added there
  without structured errors, which is a larger contract change than the
  break needs.
- **JSON inclusion of error entries (reject for this fix):** `--json`
  failures deliberately print the cause on stderr with empty stdout
  (`sync.ts:32-33`: "so agents never JSON-parse a cause line"). Putting
  error entries into the JSON array would reverse that pinned contract.
  Separable expansion; requires its own pin updates, not part of this
  fortify.

Codeless-degrade rule: `entry.code` is optional (`format.ts:85-96` prints
legacy codeless items without a code segment). The throw fix must degrade
the same way — never print `undefined:`.

### Fortify boundary

- **May change:** `packages/reference-neo/src/diagnostics/report.ts`
  (`throwOnErrorDiagnostics` line format only). Doc touch if the header
  comment's "errors throw with their locations" line needs the code
  mention — same file, same hunk neighborhood.
- **Must move together:** `packages/reference-neo/src/diagnostics/README.md`
  only if it describes the throw shape verbatim (it currently says
  "locations" — a code-mention update keeps prose honest; optional but
  coupled). Nothing else: `src/native/diagnostics.ts` is a pure re-export
  compat layer and must not gain logic.
- **Sweep obligations (pins asserting current shapes):**
  - `src/diagnostics/*test.ts` (repro, transport, resolve, json suites) —
    rerun; none pin the throw today, but they pin the code surface the
    throw will newly quote.
  - `src/sync/sync-diagnostics.test.ts` — rerun (pins sync-side report
    behavior; note: currently has uncommitted campaign modifications —
    fortify diffs against HEAD, not the worktree).
  - `src/cli/output.test.ts` + NEO-CLI-01/CLI-02 cases — rerun; failure
    lines are unpinned today, boot block is pinned verbatim and must not
    move.
- **Stay untouched:** `src/cli/sync.ts` (failure-line shape), `src/cli/output.ts`
  (the committed boot-block contract moves only with its pins),
  `src/cli/watch.ts`, `reportedSyncEntries` (JSON array contract),
  `src/native/diagnostics.ts` (re-export only).
- **Pins owed:** a regression test driving a real bad-token world through
  real `compileWorld` + `throwOnErrorDiagnostics` asserting each minted
  code appears in the throw (promote `/tmp/doom-r1-neo-red.mjs`), plus a
  codeless-entry unit case asserting the degrade (no `undefined` segment).
  Fail-without-fix proof: run both against the pre-fix throw and show red.

---

## B. Extends `@layer` statement raw while blocks escape — BREAK (confirmed)

Hunt log: `.agents/doom/logs/2026-09-24-night-g1-frag.md`
Repro: `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-frag-red.mjs`
Oracle replay: exit 1. Scoped case: statement `@layer @scope/pkg, app;`
vs block `@layer \@scope\/pkg {`. Comma case: statement `@layer a,b, app;`
declares three layers while blocks define two (`a\,b`, `app`). Both
assertions red. Matches the log exactly.

### Adjudication

Genuine BREAK. Contracts verified:

- `src/config/validate.ts:33` — names are promised "safe for CSS @layer
  and [data-layer]" with only `"`/newlines rejected. `@scope/pkg` and
  `a,b` pass validation, then the merge emits `@layer`-unsafe statements
  for them. (Oracle note: the promise is arguably over-broad — it is the
  escape machinery, not the validator, that makes arbitrary names safe —
  but the statement path skips that machinery, so the violation is real
  under either reading.)
- The module's own escape machinery (`escapeSelector`, `wrapPackageLayer`,
  `streams.ts:60-75`) plus the pinned escape tests: escaping is owed for
  exactly these names; the statement path at line 159 was missed.
- Served-output validity: `styles.css` is the served sheet
  (`sync/index.ts:192` feeds `extends` ∪ `layers` into the merge).

Coverage-gap claim verified: the escape tests drive only the no-upstream
path (`mergeStreams([], …)`, `streams.test.ts:279,284`), where no
statement is emitted; the golden corpus uses plain identifier names
(`extend-library`, …) that escape to themselves, so no golden covers the
statement-with-special-chars path either.

### Severity: confirmed minor, as filed

The finder already graded honestly and the oracle agrees: scoped/digit
names (realistic inputs — e.g. extending an org base `@acme/ds`) emit an
invalid at-rule prelude that parsers drop while block order preserves
paint — validator/devtools noise. Comma names flip cascade order but are
contrived (legal yet bizarre). No severity challenge; minor stands.

Boundary condition the finder did not stress: the statement prints
`entry.name` while blocks print `entry.package ?? ''` (`streams.ts:79-81`
vs `:102-112`). The fix is escaping, not field-switching — see below.

### Fortify boundary

- **May change:** `packages/reference-neo/src/system/base/streams.ts`,
  statement assembly only (line 159 join / `collectEntryNames` return
  path), using the existing `escapeSelector`. Escape at print time, after
  dedupe: the `seen` set must keep keying on the raw `entry.name`, or two
  distinct names with a shared escaped form would collapse and drop a
  layer from the statement.
- **Must move together:** nothing in source. The fix is one call-site
  hunk. Corpus/parser files (`streams-corpus.ts`, including its
  `BLOCK_OPEN`/`PREAMBLE_LINE` regexes) parse block and preamble lines,
  not the ordering statement — they do not move.
- **Must NOT move with it:** the statement's field (`entry.name`) stays;
  switching the statement to `entry.package` is a different change with
  different semantics (absent/empty package stays flat in blocks but is
  still named in the statement; diamond-dedupe keys on name). If
  name-vs-package correspondence is ever suspect, that is a separate hunt
  with its own red test.
- **Sweep obligations:**
  - `src/system/base/streams.test.ts` + `streams-goldens.test.ts` — rerun;
    plain-name goldens must stay byte-identical (escape is a fixed point
    on `[A-Za-z0-9_-]` without leading digit/dash — assert this, and
    check no corpus name leads with a digit before landing).
  - `src/config/validate.test.ts` — rerun, untouched expected.
  - Extends/layers sync cases (NEO-LAYER-*, NEO-SYNC-* extends legs) —
    rerun the merge-adjacent set.
- **Stay untouched:** `src/config/validate.ts` (validator promise is the
  contract, not the bug), `src/sync/index.ts` merge call site,
  `wrapPackageLayer`/`escapeSelector` (correct as-is), corpus literals.
- **Pins owed:** unit pins driving the real `mergeStreams` with an
  upstream + own where the upstream name carries scope chars
  (`@scope/pkg`) and a comma case, asserting the statement names exactly
  the escaped layers the blocks define (promote
  `/tmp/doom-g1-frag-red.mjs`, both legs). Pins must construct entries in
  the engine-realistic shape (name == package with the special chars).
  Fail-without-fix proof: run against the pre-fix merge and show both
  legs red.

---

## C. Watch freezes trigger scope at boot — BREAK (confirmed)

Hunt log: `.agents/doom/logs/2026-09-24-night-g1-sync.md`
Repro: `packages/reference-neo/node_modules/.bin/tsx /tmp/doom-g1-sync-watch-include.mjs`
Oracle replay: exit 1. Config-widen resync observed
(`events=[add:ui.config.ts]`, setup proof good); then `extra/new.ts` added
under the newly-added glob: `onChange=false resync=false` over the
window, sheet lacks the ink fill, while the one-shot control on the
identical tree compiles the ink fill in. World removed, tree untouched.
Matches the log exactly.

### Adjudication

Genuine BREAK. Contracts verified:

- `src/lib/watch/index.ts:1-9` module header — "Scope is the config
  include globs plus the config file's own dependencies," with "every
  matched add/change/unlink" resyncing. After an include-widen, adds under
  the config's globs are matched-by-config yet never resync; the scope is
  the boot-time include, not the config's.
- `tests/cases/sync/NEO-SYNC-14/README.md:13` — "re-scans the include
  globs from disk, so all three nouns ride the same serial sync." The
  compile side re-scans (each resync's `sync()` reloads config fresh);
  the trigger side (`state.isMatch`, built once at `watch/index.ts:324`
  and captured by the parcel handler) never does. Watch output diverges
  from one-shot output on the same tree — the repro's control leg proves
  it directly.

Mechanism confirmed in source: `state` (`:322-327`) and `roots` (`:328-332`)
are built once; the resync closure (`:335-344`) calls `sync()` but never
rebuilds the matcher, `dependencyFiles`, or subscriptions; `toWatchChange`
(`:170-175`) tests the stale matcher. The inverse symptom (narrowing keeps
waking) follows by the same mechanism and needs no separate hunt.

Coverage-gap claim verified: `NEO-SYNC-14/specs/watch.spec.ts` contains
zero config/include lines (only an `events.includes` substring hit), so
post-boot trigger-scope refresh is unpinned anywhere, consistent with the
log's SYNC-14/WATCH-01/CLI-02 survey.

The finder's carried-but-unspent foreign-cwd item (phantom dependency
paths via `normalizeConfigDependencyPaths` when cwd ≠ world dir) is
**not adjudicated** — observed in-harness only, real-bin crash unrun,
needs its own red test. It must not ride this fortify.

### Severity: confirmed user-facing, as filed

Widening `include` under `ref sync --watch` silently stops delivering new
files with no signal; the served sheet goes stale while one-shot reports
the truth; only a watcher restart recovers and nothing says one is owed.
Silent-stale-output is correctly graded user-facing. No challenge.

### Fortify boundary

- **May change:** `packages/reference-neo/src/lib/watch/index.ts`, the
  resync path only: after each resync's fresh config load, rebuild the
  trigger scope from the same loaded config the compile used —
  `state.isMatch` (picomatch over current `include`),
  `state.dependencyFiles` (current dependency paths), and the parcel
  subscriptions when `deriveWatchRoots` output changes (unsubscribe /
  resubscribe only on root-set change; a widen that adds no new root
  must not churn subscriptions). `WatchState` fields are mutable
  properties on a captured object — the rebuild writes through the same
  `state` the parcel handler already closes over; no handler rewire.
- **Must move together:** `deriveWatchRoots` (`:85-93`, exported) if the
  fix needs a root-diff helper — same file, and its current rooting /
  collapsing semantics stay pinned. `src/config/load.ts` only if the
  resync path needs the loaded config returned rather than re-read (it
  already re-reads inside `sync()`; prefer threading over double-load —
  whichever shape, the compile and the trigger must consume the same
  load, never two).
- **Sweep obligations:**
  - NEO-SYNC-14 (`watch.spec.ts`) + WATCH-01 — rerun; the self-declared
    watch-behavior home must stay green, and the new include-widen leg
    belongs beside it.
  - NEO-CLI-02 (`watch-flag.spec.ts`) — rerun; watch boot/resync/debug
    lines and the committed boot-block watch row must not move.
  - SYNC-06 (byte-identical re-sync), SYNC-15 (discovery + second sync),
    CLI-01 (lifecycle/clean-restore) — rerun the pipeline-behavior set.
  - Debounce/serialization behavior (`createResyncScheduler`,
    trailing-edge, poke-drain) — no pin may change timing expectations;
    the scope rebuild rides inside the existing serial resync, never as
    a parallel path.
- **Stay untouched:** `src/sync/index.ts` (compile side already correct),
  `src/config/bundle.ts` (`normalizeConfigDependencyPaths` — the
  foreign-cwd item is a separate hunt), parcel `subscribe` options /
  ignore-glob machinery (`getIgnoreGlobs`, `STATIC_IGNORE`), session
  lock + SIGUSR2 poke wiring, all CLI output shapes.
- **Pins owed:** a case-level regression pin: baseline sync with narrow
  `include`, start `watchSync`, widen the config, assert the widen
  resync is observed (setup proof), then add a file under the newly-added
  glob and assert resync + sheet contents converge with one-shot
  (promote `/tmp/doom-g1-sync-watch-include.mjs`, including its
  one-shot-control leg). A narrowing leg (removed globs stop waking)
  rides the same pin file. Fail-without-fix proof: run against the
  pre-fix watcher and show the widen leg red with the control green.

---

## Oracle summary

| Break | Verdict | Severity | Fix shape |
|---|---|---|---|
| A. throws drop codes | BREAK | user-facing (debuggability) | coded throw in `report.ts`; CLI-catch and JSON-inclusion shapes rejected |
| B. `@layer` statement raw | BREAK | minor (as filed) | escape statement names at print time, dedupe key stays raw |
| C. watch scope frozen at boot | BREAK | user-facing (silent-stale) | rebuild matcher + deps + roots on the resync path from the same config load |

Cross-cutting: the three fortifies touch disjoint files (`report.ts`,
`streams.ts`, `watch/index.ts`) and may land independently. The committed
CLI contract (boot block, failure lines, `--json` empty-stdout-on-failure)
moves in none of them. No fix work was performed; no further writes made.
