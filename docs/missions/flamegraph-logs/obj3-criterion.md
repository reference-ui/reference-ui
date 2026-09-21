IN PROGRESS — Obj 3: criterion micro-benches for top hot functions
=============================================================

Mission: Operation Flamegraph (`docs/missions/operation-flamegraph.md`).
Acceptance: criterion benches for ≥5 hot functions (resolve, plan build,
census, line index, ladder match, …), green in CI-adjacent runs
(`pnpm agentrs c` family). Lanes must prove a win at unit scale before
paying for full bench runs.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- bench-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (known-dirty: operation-fasthull.md — other session
  actively working it — plus neo benchmark latest/ report).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind Obj 2.
- 2026-09-21 captain: Obj 2 COMPLETE and committed; Obj 3 opened, crew dispatched.
