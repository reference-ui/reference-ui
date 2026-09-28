# RED-TEAM STAGE 5 (Chain review oracle) — Menubar Hunt 1

Date: 2026-09-27. Branch: `reference-system` (never switched). READ-ONLY:
no source modified, no commits. Record: `menubar.md` Hunt 1,
`menubar-repro.md`, `menubar-rule.md`, `menubar-fortify.md`.

## Verdict: VERIFIED (commit-ready)

Every check below was re-run firsthand by this oracle, including a
read-only fail-without-fix proof (detached worktree at HEAD source +
the committed pin files; worktree removed afterward, main tree untouched).

## Check table

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| 1 | Blind repro unmodified is green | `pnpm agent vt -c /tmp/menubar-red/vitest.red.config.ts` → 3/3 passed (repro files untouched; path present with test + config + node_modules symlink) | PASS |
| 2a | Pins P1–P4 pass with fix | Name-filtered runs: `Menubar.test.tsx > P1/P2/P3` ✓✓✓, `Menu.test.tsx > P4` ✓ | PASS |
| 2b | Full Menu suite (React 19, styles synced) | `pnpm --dir packages/reference-lib sync` green; `pnpm agentct Menu` → Unit 43 passed, E2E 60/60 | PASS |
| 2c | Full Menubar suite (React 19) | `pnpm agentct Menubar` → Unit 20 passed, E2E 23/23 | PASS |
| 3a | Fix inside ruling boundary (a) | `Menu.tsx:58` (`const isOpen`), `:63-65` (why-comment), `:68`/`:72` (`if (!isOpen)` gates), `:76` (deps `[overlay, isOpen]`) — all within plant site `Menu.tsx:56-73`; no consume-site change, matching the ruling's "prefer (a)" with (b)-not-needed | PASS |
| 3b | Must-move-together held | Four plant keys, `preventDefault` on all four, unconditional `overlay.setIsOpen(true)`, pointer `onClick` clear (`Menu.tsx:82`) all byte-identical; `Menu.md:137` gains the required pairing sentence | PASS |
| 3c | Nothing in UNTOUCHABLE list | `git status`: `Menubar.tsx`, `use-open-state.ts`, `Popover.tsx`, RovingFocus, `menubar-nav.ts` unmodified; no snapshot/golden files touched (only other crews' Listbox/Tabs edits coexist, not this fortify's) | PASS |
| 4 | No weakened tests, no blanket goldens | Test diffs purely additive except one harness signature line (`Menubar.test.tsx:20-22`, optional `control` + `if (control)` guard; all 8 pre-existing callers pass no `control` → identical behavior); zero `expect`/`it` lines removed or altered; zero golden updates | PASS |
| 5 | Contracts held | Genuine-open legs inside P4 (Down→first, Up→last) pass pre- and post-fix; P1 asserts `seen == ['file','edit']` (dedup + "Never redundant" intact); SPEC MB-KEY-03/06 landing now container-or-first per probes; docs describe fixed behavior | PASS |
| + | Fail-without-fix proved firsthand | Detached worktree at HEAD (unfixed plant site verified: unconditional `setMenuEntryIntent`, deps `[overlay]`) + copied pin files → P1/P2/P3 + P4 all FAIL with exact break mode: `switch landed on #mb-pin-edit-redo`, `programmatic reopen landed on #pin-item-2` | PASS |

## Notes for the orchestrator

- The fortify's own stash-cycle attestation is corroborated, not just
  inherited: the worktree experiment above reproduces the red side
  without touching the working tree.
- Commit scope for this arc: `Menu/Menu.tsx`, `Menu/Menu.md`,
  `Menu/Menu.test.tsx`, `Menubar/Menubar.test.tsx` only. The
  Listbox/Tabs working-tree edits belong to other crews — exclude them.
- No gaps. No follow-ups owed by this arc.
