Status: LANDED — firsthand verify green, 4 arcs committed

# SEAM-4 LAND log

Captain re-ran the decisive suites + gates firsthand, then committed
one verified arc per commit. Proof before landing, always.

## Captain firsthand (2026-09-25)

- Rebuilt RS dist JS fresh (tsup+tsc); dist/diagnostics.* carry 0 VRS.
- agentrs c --crate diagnostics: PASS; v modules/diagnostics/js: PASS;
  q on both RS files: clean, zero violations.
- Neo vitest src/diagnostics + src/cli/output.test.ts: 8 files,
  136 tests, all pass (against fresh dist).
- agentneo q: 0 errors, 25 warnings, 295 files — identical to the
  pre-mission baseline; sole diagnostics warning (transport.ts:61
  cyclomatic 9) pre-existing, untouched lines.
- Repo-wide VRS grep over the seam scope: zero hits. hints.ts move
  byte-verbatim vs HEAD codes.ts. isWarningCode/isErrorCode: zero
  consumers repo-wide — safe deletion confirmed.
- SPEC.md VRS + ATM-I lines edited by captain per ruling (b)(c).

# SEAM-4 LANDING BRIEF (2026-09-25, child agent consolidation; suites NOT re-run)

Source logs: rule.md (oracle verdicts), rs-crew.md (DONE fallback), neo-crew.md (DONE fallback brief).
Prior results 1/2/3 arrived as bare summaries with no inspectable body (see Unresolved verbatim);
file lists below are corroborated by `git status --porcelain` + `git diff --name-status HEAD` (read-only,
no suite re-run). Proof commands/results are reported as the crews proved them.

## 1. Files changed per crew (uncommitted; crews never commit)

RS-CREW (packages/reference-rs only):
- M packages/reference-rs/modules/diagnostics/src/code.rs — `[&str; 10]` -> `[&str; 9]`, removed `"VRS"`.
- M packages/reference-rs/modules/diagnostics/js/index.ts — removed `'VRS'` entry.
- Untouched by design: packages/reference-neo/*, dist/ (gitignored; no dist/ dir under modules/diagnostics, nothing tracked, no rebuild).

NEO-CREW (packages/reference-neo only):
- A (untracked) packages/reference-neo/src/diagnostics/hints.ts — WARNING_HINTS + warningHintFor moved here verbatim from codes.ts; sole importer format.ts.
- M packages/reference-neo/src/diagnostics/transport.ts — DiagnosticParseError, codeSeverityTag, parseCode now imported from `@reference-ui/rust/diagnostics`.
- M packages/reference-neo/src/diagnostics/format.ts — warningHintFor now imported from ./hints.ts.
- M packages/reference-neo/src/diagnostics/index.ts — code template symbols (DiagnosticParseError, REGISTERED_NAMESPACES, TEMPLATE_NAMESPACE, codeNamespace, codeSeverityTag, isRegisteredNamespace, parseCode) + `type DiagnosticCode` re-exported from `@reference-ui/rust/diagnostics`; warningHintFor re-exported from ./hints.ts. isWarningCode/isErrorCode dropped (RS exports no such helpers; only consumer was transport.test.ts).
- D packages/reference-neo/src/diagnostics/codes.ts — deleted; mirror fully evacuated.
- M packages/reference-neo/src/diagnostics/tests/transport.test.ts — header reworded (native code template); isWarningCode/isErrorCode imports/assertions replaced with codeSeverityTag checks.
- Diff stat (tracked only): 7 files, +12/-154; hints.ts extra (untracked, must be named in land commit).

RULE CELL (oracle): no source files changed; verdicts live in rule.md only (Status line still reads IN PROGRESS — oracle cell ruling; verdicts dated 2026-09-25 present).

## 2. Proof commands and their results (as crews reported; NOT re-verified here)

RS-CREW via `pnpm agentrs`:
- `pnpm agentrs c --crate diagnostics` -> `cargo test -p diagnostics`: 37 passed, 0 failed. Caveat logged by crew: bare `c diagnostics` is NOT crate-scoped (diagnostics absent from runner known-crate set, runs workspace-wide with name filter); `--crate` is the correct scoping.
- `pnpm agentrs v modules/diagnostics/js`: 2 files, 25 tests, all passed.
- `pnpm agentrs q` on both edited files: passed, zero complexity/allow violations.
- Repo-wide VRS grep at crew time: only other copies in packages/reference-neo (src/diagnostics/codes.ts, tests/cases/diag/SPEC.md) — out of scope, untouched. No goldens/pins/registry tests pin the namespace list or length (per crew).

NEO-CREW:
- `cd packages/reference-neo && npx vitest run src/diagnostics/`: 7 files, 101 tests, all passed.
- `cd packages/reference-neo && npx vitest run src/cli/output.test.ts`: 35 passed (format.ts importer check).
- `pnpm agentneo q`: 0 errors, 25 warnings, 295 files. Single diagnostics warning (transport.ts toCanonicalRecord cyclomatic 9) claimed pre-existing and warn-only; no warning touches new/rewritten lines (per crew).
- Type drift: none existed in Neo (no local DiagnosticCode declaration); barrel re-exports the Rust string-alias type.

RULE CELL (evidence, not a suite): per-export disposition table (8 DELETE + WARNING_HINTS KEEP-in-Neo/RELOCATE), `??` vs `!` ruling (RS `!` wins, moot post-DELETE), ATM-I EMITTED-on-legacy/native-compiler-channel ruling (FIX = doc reword only, no parser change), VRS drop ruling (code.rs -> [9], js/index.ts drop, SPEC.md:55 drop, Neo moot post-DELETE). Full pins in rule.md sections (a)/(b)/(c).

## 3. Residual risks for the captain's firsthand verify + commit

1. SPEC.md:55 still reads "`CAN` / `BSS` / `VRS` / `MGP` — reserved, unminted" — ruled drop of VRS not executed by any crew (rs-crew: out of scope; neo-crew: untouched). VRS grep now hits ONLY this line (verified read-only this turn). Needs a doc edit + land decision (which arc owns it).
2. SPEC.md Approved-absences ATM-I line still reads "No transport, no case" — ruled false for the native/legacy compiler channel; ruled fix ("no TYPED transport; legacy/native compiler channel only, pinned by RS stations (ATM-DIAG-07, ATM-ATOM-06, harvest-census)") not executed. Doc-only; no code change wanted (parsers must keep rejecting -I-).
3. Neo barrel breaking change: isWarningCode/isErrorCode deleted outright. Crews assert no production consumer (only transport.test.ts + barrel); captain must confirm no external consumer before landing.
4. agentneo q carries 25 warnings (0 errors). Captain's gate must confirm the transport.ts cyclomatic-9 warning is pre-existing and that none of the 25 touches new/rewritten lines.
5. agentrs c scoping caveat (see proof section): captain re-run must use `pnpm agentrs c --crate diagnostics`, not bare `c diagnostics`.
6. Both exec crews ran FALLBACK briefs without a live ruling body (ruling payload carried no inspected content); rule.md status line still says IN PROGRESS. Fallback edits match the ruled disposition on file inspection, but the captain must sum-confirm ruling-vs-fallback before committing.
7. dist/ deliberately not rebuilt (gitignored, no dir). Captain to confirm no pinned artifact needs regen.
8. hints.ts is untracked; "named files only" land commits must list it explicitly or it will be left behind.
9. RS crew claims no test pins the namespace list/length; captain re-run of the decisive suites is the backstop.

Suggested land arcs (captain decides): ARC-1 RS VRS drop (2 files) after `pnpm agentrs c --crate diagnostics` + `v` + `q` firsthand; ARC-2 Neo rewire (delete codes.ts + hints.ts + 4 modified) after diagnostics suite + output.test + `agentneo q` firsthand; ARC-3 SPEC.md doc fixes (VRS line + ATM-I reword) as a separate docs commit.

## 4. Unresolved items carried verbatim

- prior result 1 summary: "structured result submitted" (no body; rs-crew log: "Prior result 1 carried no ruling body (summary only: \"structured result submitted\"), so the fallback applied: drop `VRS` from `REGISTERED_NAMESPACES`.")
- prior result 2 summary: "structured result submitted" (no body)
- prior result 3 summary: "structured result submitted" (no body)
- neo-crew log verbatim: "Ruling/prior results arrived as bare \"structured result submitted\" with no usable content, so executed the fallback brief verbatim."
- No crew log lists any further explicit unresolved items; the SPEC.md VRS + ATM-I doc edits above are ruled-but-unexecuted work, not crew-declared unresolveds.
