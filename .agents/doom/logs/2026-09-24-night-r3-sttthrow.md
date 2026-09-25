---
date: 2026-09-24
cycle: night-r3
module: styletrace/diagnostics
theories_spent: 0
verdict: clean-hunt
---

# Styletrace coded throws bury the code under prose prefixes (accepted divergence, no violated contract)

## Hypothesis

Gap pursued (carried from `2026-09-24-night-r1-trio.md`, not re-proved):
styletrace's coded throws reach the JS seam as
`Styletrace analysis failed: StyleTrace: STT-E-SCAN-FAILED: …`
while tasty and typegen throw code-first
(`TST-E-SCAN-FAILED: …`, `TGN-E-INVALID-BASE-SYSTEM: …`),
against the shared "coded throw mirroring the scan channel" contract
(`REGISTRY.md`).

Research (free, no theory spent) confirmed the shape divergence is real
and exactly as carried, then killed every candidate violated contract:

- Wire bytes observed live via repo tsx probes (`/tmp/doom-r3-sttthrow-probe.mjs`,
  `/tmp/doom-r3-sttthrow-probe2.mjs`): styletrace
  `"Styletrace analysis failed: StyleTrace: STT-E-SCAN-FAILED: failed to read …"`;
  tasty `"TST-E-SCAN-FAILED: failed to build glob walker: …"`;
  typegen `"TGN-E-INVALID-BASE-SYSTEM: invalid baseSystem spec: …"`.
  Composition chain: code-first helper (`diagnostics::scan_failed` /
  `unresolved_surface`, pinned code-first by Rust unit tests) →
  `StyleTraceError` Display adds `StyleTrace: ` (`resolver/error.rs:28-31`) →
  `native.rs` adds `Styletrace analysis failed: ` (all three fns). Tasty
  passes its helper string straight to `napi::Error::from_reason`
  (`tasty/native.rs:18`); typegen likewise (`typegen/native.rs:60`).
  JS wrappers are pass-through (`callNativeJson` never rewraps).
- Candidate "code-first parseability": no consumer parses codes out of
  thrown messages anywhere in src (no code-regex over messages; Neo CLI
  only prints `messageOf(err)`; atomic consumes typed
  `StyletraceDiagnostic` values, not throw strings). A red test asserting
  `startsWith`/anchored-parse would go red on shape but cite an invented
  norm — no stated contract demands it.
- Candidate "`rg -c` census": the buried code still matches substring
  censuses (`rg -c "STT-E-SCAN-FAILED"` hits); a red test asserting the
  census would pass. The census contract from r1-neo governs Neo verbose
  lines, not native throws.
- Candidate "cross-module throw-shape consistency" via REGISTRY.md
  "mirroring the tasty scan channel": the sentence's operative demand is
  the channel choice (throw coded vs. ride a payload), which styletrace
  satisfies — both refusals throw, and the module README's "Must not:
  Ride an error in the outcome payload" holds. "Coded throw" as the
  codebase's own test vocabulary defines it means code-IN-throw:
  all eight throw assertions across styletrace (`detailed.test.ts`),
  tasty/typegen seam tests, Neo `repro.test.ts`, and Neo DIAG cases
  51/57/58 use substring matching and pass on the buried shape.
- Acceptance evidence: same-night r1-neo cites `STT-E-*` throws as
  conforming "coded" precedent; same-night r1-audit's exhaustive sweep
  lists both as "coded throw | throw test" with no flag. The `StyleTrace: `
  prefix is deliberate heritage prose explicitly blessed byte-identical in
  REGISTRY.md; the napi wrapper follows the file's uniform contextual
  pattern (matching typegen's own internal-error prefixes).

No red test was written: the shape was already proven by code reading
plus live observation, and each candidate red test either passes
(census) or goes red without a violated contract to file (parseability,
byte parity). Spending a theory to demonstrate a known, contractless
shape would be theater; per the brief, a CURIO reports clean.

## Verdict

`clean-hunt`. No repro: no break, no violated contract, nothing to
reproduce. Tree untouched (this log file is the only tree write;
observation probes live at `/tmp/doom-r3-sttthrow-probe.mjs` and
`/tmp/doom-r3-sttthrow-probe2.mjs`).

Carried observation (CURIO, for architects, not a break): byte parity
with the tasty scan channel would require a Display bypass for coded
`StyleTraceError`s or a native.rs passthrough for already-coded
messages — but no consumer needs it today, every assertion passes on
the buried shape, and the legacy prose is deliberately preserved. If a
future consumer ever anchored-parses thrown codes (`^STT-E-`), this
divergence becomes a real break at that consumer's citation; until
then the divergence is accepted. Severity if ever filed: curiosity
(cosmetic wire inconsistency, zero user-facing manifestation — the code
is present, findable, and thrown at the correct severity).
