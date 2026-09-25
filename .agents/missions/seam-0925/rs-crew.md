Status: DONE (fallback; ruling body unavailable)

# SEAM-2 RS-CREW log

Scope: VRS drop from the RS template (code.rs + js/index.ts +
dist/pins if affected), proved with agentrs gates.

## 2026-09-25 — VRS drop (fallback path)

- Prior result 1 carried no ruling body (summary only: "structured
  result submitted"), so the fallback applied: drop `VRS` from
  `REGISTERED_NAMESPACES`.
- `modules/diagnostics/src/code.rs`: `[&str; 10]` -> `[&str; 9]`,
  removed `"VRS"`. Now matches `REGISTRY.md` (9 namespaces, no VRS).
- `modules/diagnostics/js/index.ts`: removed `'VRS'` entry.
- Repo-wide `VRS` grep: only other copies are in
  `packages/reference-neo` (`src/diagnostics/codes.ts`,
  `tests/cases/diag/SPEC.md`) — out of scope, untouched. No goldens,
  pins, or registry tests pin the namespace list or its length.
- `dist/`: gitignored, no `dist/` dir exists under
  `modules/diagnostics/`, nothing tracked — no rebuild.
- Verify (all via `pnpm agentrs`):
  - `pnpm agentrs c --crate diagnostics` -> `cargo test -p
    diagnostics`: 37 passed, 0 failed. (Note: bare `c diagnostics`
    is NOT crate-scoped — `diagnostics` is absent from the runner's
    known-crate set, so it ran workspace-wide with a name filter;
    `--crate` is the correct scoping.)
  - `pnpm agentrs v modules/diagnostics/js` -> 2 files, 25 tests,
    all passed.
  - `pnpm agentrs q` on both edited files -> passed, zero
    complexity/allow violations.
- `packages/reference-neo` untouched. No commits.
