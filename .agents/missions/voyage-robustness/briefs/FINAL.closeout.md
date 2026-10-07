# Oracle FINAL closeout review — voyage-robustness (FINAL.closeout)

STEP: FINAL.closeout
PIN: the closeout commit (fill in when dispatched). Read
`.agents/missions/voyage-robustness/CLOSEOUT.md` in full, plus `GATES.md`,
`FINALIZE.md`, and the per-wave reports it cites.

## Mandate

This is the last gate before the body is declared concluded. Verify the closeout
is **honest and complete**, per the `CONCLUSION.oracle` §1 shape and §3
checklist:

1. **Every LAND** has a bar, a command, and a result in the report/captain
   attestation (dist provenance, documented package-cwd syncs, `verify-pins`,
   named suites, the full consumer smoke for WAVE5). Flag any LAND asserted but
   not evidenced.
2. **Pin re-baselines** — each diff shows *only* the claimed lines, and the
   final `verify-pins` is PASS **from documented package-cwd syncs**. Note the
   runtime-mission attribution correctly.
3. **Residual + CUT ledger** — content-class residual, the full CUT list, and the
   open advisories (`LIB_DIST_ATOMIC_BUILD`, `normalizeConfigDependencyPaths`,
   mcp tripwire) each present with a pointer.
4. **Known pre-existing reds** — enumerated with "scope-untouched" (`git`
   file-scope) arguments, not re-litigation.
5. **Nothing silently dropped** — cross-check `FINALIZE.md` open items against
   the closeout; every one is either in the closeout or explicitly carried.
6. **Dev-server cleanliness** — the WAVE5 acceptance (plain
   `import("./tasty/runtime.js")`, `dist/tasty/` present, unmodified smoke PASS,
   no Vite analyze warning, **sync time flat**) actually holds.

End with a verdict: **CONCLUDED** or **HOLD** (exact missing evidence).

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line, evidence, recommendation. P4 for non-repair observations.
