Status: LANDED — ARC-1 + ARC-2 verified firsthand, 7 commits total

# HINTS-3 LAND log

## Captain firsthand ARC-2 (2026-09-25)

- Goldens: independent line-set check over all 47 — 0 removed lines
  lost, every addition a help string/key or JSON punctuation.
  ONLY-ADDED-HELP corroborated (5th independent check).
- `pnpm agentrs c` (full workspace cargo): PASS.
- `pnpm agentrs v` (full module vitest): PASS.
- `pnpm agentrs q` (smart, 49 changed RS files): 0 violations,
  22 soft warnings (length-soft + pre-existing).
- Neo vitest diagnostics + output: 141/141 (136 + 5 new).
- `agentneo q`: 0 errors, 26 warnings (baseline 25; delta is
  output.test.ts length soft-warns from the 5 required new cases —
  warn-only, non-failing, accepted). format.ts: zero warnings.
- tsc clean; dist rebuilt; native verified fresh (darwin-x64).
- verboseTail matches the ruled render order exactly (help join
  '; ' > static > none; one tail; trim-filter fallback).
- Peer quarantine files untouched; named-only commits throughout.

# HINTS-3 LAND log (original)

Captain re-runs the decisive suites + gates firsthand (fresh RS dist),
commits ARC-1, then dispatches the ARC-2 exec wave per the rule.

---
## HINTS-3 landing brief (2026-09-25, read-only consolidation)

Sources: `.agents/missions/hints-0925/arc1-crew.md` (ARC-1 crew) +
`.agents/missions/hints-0925/arc2-rule.md` (ARC-2 oracle cell).
No suites re-run; proof below is crew-reported. Files-changed list
verified against `git status --porcelain` / `git diff --stat` this turn.

### ARC-1 — files changed (captain commits these 5, named only)
- `packages/reference-rs/modules/diagnostics/js/index.ts` (M: WARNING_HINTS + warningHintFor inlined beside SUGGESTION_CODES)
- `packages/reference-rs/modules/diagnostics/js/hints.test.ts` (new: coverage over 5 codes.rs tables)
- `packages/reference-neo/src/diagnostics/format.ts` (M: import from `@reference-ui/rust/diagnostics`)
- `packages/reference-neo/src/diagnostics/index.ts` (M: re-export warningHintFor from RS)
- `packages/reference-neo/src/diagnostics/hints.ts` (D: deleted; Neo owns no hint table)
- NOTE: working tree also holds unrelated quarantine-landing changes
  (Accordion/DateField/Menu + mission logs); do NOT sweep into ARC-1 commit.

### ARC-1 — proof commands/results (crew-reported)
RS first:
- Coverage audit: 52 minted warnings (ATM 35, TST 5, ATL 4, STT 1, TGN 8
  after excluding five `*-W-NOPE` fixtures); 50 already hinted, 2 gaps
  (`ATL-W-PACKAGE-SCAN-FAILED`, `TGN-W-DUPLICATE-RECIPE-STEM`) got real
  hints; EXEMPT_CODES stays empty.
- `pnpm agentrs q` on both touched files: 0 violations, 1 soft warning.
- `pnpm agentrs v modules/diagnostics/js/hints.test.ts`: 3/3 pass.
- `pnpm agentrs v modules/diagnostics/js/index.test.ts`: 16/16 pass.
Then Neo:
- `pnpm --dir packages/reference-rs run build:js`: success, dist carries
  new export (diagnostics.mjs + chunk .d.ts).
- `vitest run src/diagnostics src/cli/output.test.ts`: 8 files, 136/136 pass.
- `pnpm agentneo q`: 0 errors package-wide; touched files 0/0.
- `tsc --noEmit`: zero errors in src/; rest pre-existing case-spec issues.

### ARC-1 — residual risks
- `index.ts` 407 lines > 365 soft limit from inlined table (quality-gate
  soft warning only).
- `tsc --noEmit` case-spec errors (missing repro-world.ts, implicit any)
  remain; crew states untouched/pre-existing — captain confirms firsthand.
- RS dist freshness: captain rebuilds before own Neo verify (standing rule).

### ARC-2 — specs location
- Full per-site help specs + Neo render rule + per-module verification:
  `.agents/missions/hints-0925/arc2-rule.md` (53 `-W-` rows, 52 minted;
  ATM-W-TOKEN-CATEGORY-MISMATCH retired, zero emit sites).
- Render rule: `formatVerboseWarningLine` tail order = engine help
  (`help.join('; ')`) > static `warningHintFor` > no tail; exactly one
  tail, never both; static table RETAINED as fallback.

### ARC-2 — recommended exec split (from rule; sequential shared checkout)
- Crew 1 — atomic kernel: policy/{extract,resolve,proof,hosts}.rs,
  resolve/*, runtime/values.rs, static_css.rs, stylesheet/global/*,
  channels/render.rs note re-attach, lines.rs identity check, resolve
  suggestion threading, station re-bless + diff review.
- Crew 2 — atomic extract notes: all `ctx.warn` sites in extract/*,
  fold/token.rs reason help, adapters/extract.rs help field, `warn_help`
  on 3 ctx types (no `warn_default` variant).
- Crew 3 — satellites: atlas + tasty + styletrace + typegen
  `diagnostics/mod.rs` constructors + wire-byte test updates.
- Crew 4 — neo render: format.ts rule, output.test.ts additions,
  diagnostics tests, diag case-spec sweep, agentneo q + tsc.
- Order: Crews 1–3 in one wave (disjoint files), RS build:js, station
  re-bless review, then Crew 4. Captain commits per standing rules.

### Unresolved items — verbatim
- Prior workflow child payloads: summaries only ("structured result
  submitted"); no inspected unresolved text available to quote.
- ARC-1 crew log: "No commits, per brief."
- ARC-1 crew log: "(index.ts 407 lines > 365 soft limit — expected from the inlined table)."
- ARC-1 crew log: "remaining errors are pre-existing case-spec issues (missing repro-world.ts, implicit any), untouched."
- ARC-2 rule open threads for exec (see rule for full FLAG text):
  UNFOLDABLE-KEY key-snippet stretch; MISSING-CONTAINER-ROOT prop-name
  stretch; UNKNOWN-CONDITION proof-carried static fallback; TST
  PARSE-ERROR first-error stretch; ATL did-you-mean SUGGESTION_CODES
  amendment stretch (NOT in ARC-2); import-residue marker context.

---
## HINTS-4 landing brief (ARC-2, 2026-09-25, read-only consolidation)

Sources: `.agents/missions/hints-0925/arc2-exec.md` (Crews 1-4
sections) + prior workflow child payloads (summaries only, no
inspected text). No suites re-run; proof below is crew-reported.
Files-changed lists verified against `git status --porcelain` /
`git diff --stat` this turn; golden diff character re-verified
firsthand this turn (parsed-JSON compare, read-only).

### ARC-2 — files changed (corroborated; captain commits these, named only)

Crew 1 — atomic kernel (20 M + 1 new + 35 goldens, all confirmed):
- New (untracked): `packages/reference-rs/modules/atomic/src/resolve/suggest.rs`
- M: `diagnostics/policy/{extract,resolve,proof,hosts,mod}.rs`,
  `diagnostics/{facts,adapters/extract,adapters/resolve,channels/render}.rs`,
  `resolve/mod.rs`, `resolve/conditions/mod.rs`,
  `runtime/values.rs`, `diagnostics/proof/rejects.rs`,
  `static_css.rs`, `stylesheet/global/{value,walker}.rs`,
  tests: `channels/mod.rs`, `proof/{lines,render}.rs`, `resolve/tests.rs`
- 35 atomic `diagnostics.json` goldens (39 in tree minus Crew 2's 4 new).

Crew 2 — atomic extract notes (18 M + 1 new + 4 goldens, all confirmed):
- New (untracked): `packages/reference-rs/modules/atomic/src/extract/suggest.rs`
- M: `extract/mod.rs`, `expressions/walk/mod.rs`,
  `expressions/object/mod.rs` (warn_help), `fold/token.rs`,
  `walk/{leaf,member,call}.rs`, `responsive.rs`,
  `object/{keys,entries,lower,condition,attrs,spread}.rs`,
  `css/mod.rs`, `jsx/mod.rs`, `fold/call_lower.rs`,
  `resolver/values.rs`
- 4 goldens: `ATM-DIAG-05`, `ATM-DIAG-07`, `ATM-SITE-49`,
  `ATM-SITE-83` (all present in tree).

Crew 3 — satellites (4 M + 8 goldens, all confirmed):
- M: `atlas|tasty|styletrace|typegen` `src/diagnostics/mod.rs`
- 8 goldens: 3 atlas `diagnostics.json` (BAR-01, PROP-01, TYPE-01)
  + 5 tasty `manifest.js` (COL-01, DUP-01, RXP-02, STY-03, TMP-02).

Crew 4 — neo render (2 M, both confirmed):
- M: `packages/reference-neo/src/diagnostics/format.ts`,
  `packages/reference-neo/src/cli/output.test.ts`

ARC-2 totals in tree: 44 M source + 2 new source + 47 goldens
(39 atomic + 3 atlas + 5 tasty). Goldens untracked: none (all M).
- NOTE: working tree also holds unrelated quarantine-landing changes
  (20 M lib files: Accordion/Combobox/DateField/Menu + 6 new lib
  files + 4 quarantine mission logs); do NOT sweep into ARC-2 commit.
- NOTE: `.agents/missions/hints-0925/` (5 files incl. this log) is
  untracked; captain commits per standing rules.

### ARC-2 — proof commands/results (crew-reported)

Crew 1:
- `pnpm agentrs c atomic` -> ok: 686+1+1+7+5 passed, 0 failed
- `pnpm agentrs b` -> Native addon ready (19 pre-existing warnings)
- `pnpm agentrs v atomic` pre-bless -> 35 failed / 267 passed
  (golden stage only); `UPDATE_GOLDENS=1` -> 13 files / 302 passed;
  post-bless unflagged -> PASSED (302/302)
- `pnpm agentrs q` on 22 touched files -> 0 violations, 9 soft warns
- `pnpm agentrs q --clippy` on suggest.rs + policy/ -> 0 in new code

Crew 2:
- `pnpm agentrs c atomic` -> ok: 724+1+1+7+5 passed, 0 failed
  (38 new: 686 -> 724 lib)
- `pnpm agentrs b` -> Native addon ready (19 pre-existing warnings)
- `pnpm agentrs v atomic` pre-bless -> 6 failed / 296 passed
  (DIAG-05/07/14, SITE-20/49/83 goldens); re-bless -> PASSED;
  post-bless unflagged -> PASSED (302/302)
- `pnpm agentrs q modules/atomic/src/extract` -> 0 violations, soft-only
- `pnpm agentrs q --clippy` on suggest.rs -> 0 in new code

Crew 3:
- `pnpm agentrs c atlas|tasty|styletrace|typegen` -> 24+82+58+65
  passed, 0 failed
- `pnpm agentrs q` on 4 files -> 0 violations, 0 warnings;
  `--clippy` -> 0 in crew files (5 needless_question_mark fixed in exec)
- `pnpm agentrs b` -> Native addon ready (19 pre-existing warnings)
- `pnpm agentrs v` pre-bless -> atlas 3 failed / 58 passed, tasty 5
  failed (golden stage); styletrace 31/31 + typegen 48/48 PASSED
  unflagged; re-bless -> PASSED; post-bless -> 61/61, 83/83, 31/31,
  48/48 PASSED

Crew 4:
- `pnpm agentrs b` -> Native addon ready (binary reused)
- `verify:native` -> Verified 1 native binary: darwin-x64 (fresh)
- `build:js` -> ESM success (12 bundles incl. diagnostics.mjs)
- Engine-help probe (DIAG-01 world) -> ATM-W-UNKNOWN-PROPERTY
  carries `help: ["remove 'notAStyleProp' or check its spelling"]`
- `vitest run src/diagnostics src/cli/output.test.ts` -> 8 files /
  141 passed, 0 failed (136 baseline + 5 new)
- `pnpm agentneo q` -> 0 errors, 26 pre-existing warnings; scoped 2
  files -> 0 errors, 2 soft warns (non-failing)
- `tsc --noEmit` -> clean, exit 0
- Render probe: `ATM-W-UNKNOWN-PROPERTY: Unknown property in
  staticCss: "notAStyleProp" - remove 'notAStyleProp' or check its
  spelling`
- Diag sweep: 0 pinned tails in case.json; NEO-DIAG-01/50/31 PASS

### ARC-2 — station re-bless diff character (help-keys-only? YES)

Crew verdicts: all three re-bless crews report ONLY-ADDED-HELP via
kept `/tmp/crew{1,2,3}-golden-check` scripts (Crew 1: 35 files,
+269/-64 punctuation-only deletions; Crew 2: 39 files, 74 lines
gained help; Crew 3: 8 files, 13 warnings gained help; TST-ERR-01
parse-error golden untouched).
Firsthand re-verification this turn (parsed-JSON HEAD-vs-tree
compare over all 47 goldens, read-only): counts identical, every
non-help key byte-identical, no pre-existing help changed/removed,
87 lines gained help (74 atomic + 13 satellites = crew sums
exactly), top-level non-diagnostic keys identical, 0 failures.
VERDICT: ONLY-ADDED-HELP, corroborated.

### ARC-2 — residual risks

- Soft-length warnings (non-failing): Crew 1 files (8 soft incl. 2
  pre-existing overs; resolve/tests.rs +403 lines) + 1 five-arg
  `extract_note_with_help` ctor; Crew 2 extract files newly over 365
  soft (hard 1500); Crew 4 output.test.ts 2 soft warns.
- 19 pre-existing clippy warnings; crews report none in new code.
- Deliberate static-wins (no engine help, by rule/flag):
  UnfoldableKey x2, TaggedTemplateSite, generic UnfoldableSpread
  variants, rootless spread-miss, ContainerRoot advisory,
  reason-carrying proof lines (rewritten message preserves pushed
  help), proof-carried UNKNOWN-CONDITION (no system in reach),
  tasty PARSE-ERROR, styletrace SKIPPED-FILE (message byte-identical),
  TOKEN-CATEGORY-MISMATCH retired, responsive LEAF-11.
- Crew 2 deliberate deviation: `r`-path NonObjectCondition help names
  the authored sub key, not `when.last()` (which would echo internal
  `@container` syntax); rule intent preserved, wording corrected.
- Spread DYNAMIC-EXPRESSION drops the rule's `for '{prop}'` (no prop
  in scope).
- No commits, per brief (crews never commit).
- RS dist freshness: captain rebuilds before own Neo verify
  (standing rule); Crew 4's build:js already done this wave.
- Crew golden-check scripts live in /tmp (outside repo, kept for
  re-run, not committable); this brief's independent check above
  corroborates without them.

### Unresolved items — verbatim

- Prior workflow child payloads: summaries only ("structured result
  submitted"); no inspected unresolved text available to quote.
- Crew 1 -> Crew 2: "`extract_note_with_help(location, sev, code,
  message, help)` is ready; wire `warn_help` on the 3 ctx types
  through it." (Crew 2 reports done.)
- Crew 1 -> Crew 4: "engine help rides the existing wire `help`
  field - no contract change" (Crew 4 confirms via probe.)
- Crew 2 -> Crew 4: "Crew 2 helps ride the same wire `help` field"
  (Crew 4 confirms.)
- Crew 2 note: "`r`-path NonObjectCondition help names the authored
  sub key (`md`), not the pushed `@container` query - deliberate
  deviation from the rule's `when.last()` note, see design calls."
- Crew 3 -> Crew 4: "satellite helps ride the existing wire `help`
  field - no contract change" (Crew 4 confirms via NEO-DIAG-50.)
- Crew 4: "None. ARC-2 exec complete: engine help minted (Crews
  1-3), rendered (Crew 4), static fallback retained throughout."
