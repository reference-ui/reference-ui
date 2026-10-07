Status: RULED — verdicts (a)(b)(c) in log; crews executed on matching fallback

# SEAM-1 RULE log

Scope: (a) per-export disposition of Neo `src/diagnostics/codes.ts`
against `@reference-ui/rust/diagnostics`; (b) VRS disposition across
code.rs, RS js, Neo; (c) ATM-I ruling (do the codes emit? is the
I-rejection wrong on all three sides?).

HQ law: Neo diagnostics formats a known shape, nothing more.

RULED — SEAM-1 oracle verdicts (2026-09-25). HQ law applied: Neo diagnostics formats a known shape, nothing more.

## (a) Neo codes.ts per-export disposition vs @reference-ui/rust/diagnostics

Import path exists and is live: reference-rs/package.json:62-65 exports `./diagnostics`;
tsup.config.ts:37 builds it from `modules/diagnostics/js/index.ts` (the file ruled against);
dist/diagnostics.mjs + .d.ts present. Neo already depends on `workspace:*`
(reference-neo/package.json:33) and imports `@reference-ui/rust/contracts`
(neo native/contract.ts:6-9). No production consumer outside diagnostics/ touches
codes.ts exports (neo native/diagnostics.ts:7-16, cli/output.ts:13-20,
reference/bridge/build-report.ts:8, run.ts:54 import only report/format/transport
names); internal consumers are transport.ts:6 (DiagnosticParseError, codeSeverityTag,
parseCode) and format.ts:5 (warningHintFor). transport.test.ts pins codes behavior and
moves with the import swap.

| Neo export (codes.ts) | RS mirror | Disposition | Reason |
|---|---|---|---|
| TEMPLATE_NAMESPACE (:6) | js/index.ts:27, code.rs:13 | DELETE | byte-identical 'RS'; single owner RS |
| REGISTERED_NAMESPACES (:12-23) | js/index.ts:33-44, code.rs:17-19 | DELETE | identical 10-list; RS mirrors the REGISTRY.md gate |
| DiagnosticParseError (:29-31) | js/index.ts:50-52 | DELETE | identical name+shape; TS error contract lives in the RS js mirror (code.rs CodeError is Rust-side only) |
| parseCode (:34-48) | js/index.ts:55-70, code.rs:33-45 | DELETE | identical logic incl. the I-rejection sentence; pinned in all three suites |
| codeNamespace (:51-53) | js/index.ts:73-75, code.rs:53-55 | DELETE | same semantics; see `??` vs `!` ruling |
| codeSeverityTag (:56-58) | js/index.ts:78-80, code.rs:58-64 | DELETE | identical W/E mapping incl. default-W |
| isWarningCode/isErrorCode (:61-68) | none (RS has isWarning/isError over Diagnostic objects, js/index.ts:217-224) | DELETE | no production consumer (only transport.test.ts:30-33 + barrel); dead convenience — if revived, RS owns it |
| isRegisteredNamespace (:71-73) | js/index.ts:83-85, code.rs:83-85 | DELETE | identical advisory check |
| WARNING_HINTS + warningHintFor (:78-136) | none — RS has only message-pattern helpers + SUGGESTION_CODES gate (js/index.ts:248-302); grep for HINTS in modules/diagnostics finds only a message.rs doc mention | KEEP in Neo, RELOCATE | presentation copy, warnings-only, consumed solely by format.ts:94 verbose tail. Formatting is Neo's job per HQ law. Move into format.ts (or sibling hints.ts) so codes.ts deletes cleanly; do NOT add to RS (RS serves all consumers; hint copy is Neo-CLI-specific) |

`?? code` vs `!`: RS `!` wins. String.split always yields >=1 element, so `[0]` is
never undefined; `!` (js/index.ts:74) documents totality with zero runtime effect.
Neo `?? code` (codes.ts:52) is a dead fallback whose value would be wrong (whole code
as namespace) on an impossible path. Moot post-DELETE; RS keeps `!`, no change needed.

Net: delete Neo codes.ts entirely; transport.ts + barrel import the eight names from
`@reference-ui/rust/diagnostics`; WARNING_HINTS/warningHintFor move to Neo
presentation; the transport.test.ts parseCode block follows the import.

## (b) ATM-I: EMITTED on the legacy/native compiler channel — NOT latent

All four I-codes emit with info severity onto opt-in `compilerDiagnostics`
(`logs: ['compiler']`); none rides typed template transport:

- DeadBranch (`ATM-I-DEAD-BRANCH`): 5 push sites via ctx.info (walk/branch.rs:92-101,
  extract/css/mod.rs:135, harvest/sinks.rs:147, object/spread.rs:221,
  object/condition.rs:103). ctx.info pushes location.info + session fact
  (extract/mod.rs:220-235). ExtractNote→Compiler (policy/mod.rs:49-50,66); partition
  renders onto the compiler channel (channels/mod.rs:106-108). Pinned:
  ATM-DIAG-07/spec.ts:13-20,37-48.
- HarvestSink: Policy::render_harvest builds location.info (policy/harvest.rs:10-25);
  pushed + fact-reported in mint (harvest/mint/mod.rs:98-100). HarvestOutcome→Compiler
  (policy/mod.rs:46-48). Pinned: ATM-DIAG-07 + harvest-census histogram count 32
  (harvest-census.test.ts:120-125,255-268).
- ExpectedLookup/DynamicSlot: location.info renders (policy/analysis.rs:13-41);
  fresh-rendered onto the compiler channel only when requested
  (channels/render.rs:32-44; channels/mod.rs:391-414 test). Pinned:
  ATM-ATOM-06/spec.ts:43-51 + harvest-census histogram counts 135/33.
- Bridge: atomic Diagnostic has Info severity, serde lowercase
  (atomic diagnostics/mod.rs:38-44,95-107); Neo NativeDiagnostic admits 'info' +
  `ATM-I-*` (neo native/contract.ts:55-60); compilerDiagnostics present only when
  requested (contract.ts:84-91).
- Neo keeps infos off typed paths: partitionTyped routes info to legacy
  (transport.ts:118-145); reportSyncDiagnostics counts raw compiler entries incl. info
  (report.ts:105-121) and prints them under `[compiler]` verbose — intended.
- All three template parsers reject `-I-` BY DESIGN per REGISTRY.md:71-77 ("Severity
  and the reserved tag"): Neo codes.ts:39-43 (+transport.test.ts:38 pin), RS js
  index.ts:61-65 (+index.test.ts:64-82 pin), code.rs validate_tag:106-117 (+tests:209,246).

FIX RULED (no parser change): keep I-rejection in all three mirrors plus pins. The
defect is documentary: reference-neo/tests/cases/diag/SPEC.md "Approved absences"
claims ATM-I has "No transport, no case" — false for the native/legacy compiler
channel. Fix = reword to "no TYPED transport; legacy/native compiler channel only,
pinned by RS stations (ATM-DIAG-07, ATM-ATOM-06, harvest-census)". No code change
required; Neo must never feed compiler infos into parseTypedDiagnostic (already true
— do not "fix" by widening parsers).

## (c) VRS: dropped from registry; remove from all three lists + SPEC.md

- REGISTRY.md namespace table (lines 26-38) carries 9 rows: RS,ATM,ATL,TST,STT,TGN,
  CAN,BSS,MGP. VRS has no row (full-file read; zero occurrences). Per REGISTRY.md
  Rules (lines 45-47) the REGISTERED_NAMESPACES constants mirror this table — all
  three are stale: code.rs:17-19 (`[&str; 10]` incl 'VRS'), js/index.ts:33-44
  (incl 'VRS'), Neo codes.ts:12-23 (incl 'VRS').
- No `VRS-*` code ever minted: repo-wide grep hits only the three constant lists +
  the SPEC.md:55 reserved line. Nothing to retire; "never rename or remove" covers
  shipped codes, and VRS shipped nothing.
- Disposition: RS-crew removes 'VRS' from code.rs (array becomes `[&str; 9]`) and
  js/index.ts (advisory-only; parsing is shape-open so zero wire risk; the
  codes.rs:227-236 registry test still passes); Neo removal is moot post-DELETE (Neo
  deletes its list per (a)); SPEC.md:55 reserved line drops VRS (`CAN / BSS / MGP`).
  No test changes needed (no VRS pins anywhere).
