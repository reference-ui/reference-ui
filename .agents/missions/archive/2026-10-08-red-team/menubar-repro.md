# RED-TEAM STAGE 2 (Reproduce) — Menubar Hunt 1

Date: 2026-09-27. Branch: `reference-system` (never switched). No fixes, no commits.

Blind replay, exactly as documented, no reconstruction:

```bash
pnpm agent vt -c /tmp/menubar-red/vitest.red.config.ts
```

Repro path `/tmp/menubar-red/` present: `menubar-t1.red.test.tsx`, `vitest.red.config.ts`, `node_modules` symlink.

## Per-probe verdict

- T1-A (trigger-arrow switch after Up-on-open-trigger): **REPRODUCED** — observed landing `#red-edit-redo` (LAST item); expected SPEC-pinned container-or-first (`red-edit-undo`). Failure at test line 153, the final landing assertion only.
- T1-B (content-arrow switch after Up-on-open-trigger): **REPRODUCED** — observed landing `#red-edit-redo` (LAST item); expected container-or-first. Failure at test line 179, the final landing assertion only.
- T1-C (programmatic open after Up-on-open-trigger): **REPRODUCED** — observed landing `#red-edit-redo` (LAST item); expected container-or-first. Failure at test line 208, the final landing assertion only.

## Setup locks

Held. All intermediate assertions passed before each landing assertion failed: T1-A's Up-press lock (`seen == ['file']`, File menu still mounted) and switch lock (`seen == ['file','edit']`, File unmounted / Edit mounted) both green; T1-B/T1-C mount assertions green. The dedup holds; only the focus landing is wrong. Suite result: 3 failed / 3, exit 1.

## Overall verdict

**REPRODUCED.** All 3 probes land focus on the LAST item (`#red-edit-redo`) instead of the SPEC-pinned switch landing, with the setup locks holding, exactly matching Hunt 1's report.
