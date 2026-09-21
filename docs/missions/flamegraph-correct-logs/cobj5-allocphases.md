IN PROGRESS — C-Obj 5: alloc counts by compiler phase
==============================================

Mission: Operation Flamegraph Correct (`docs/missions/operation-flamegraph-correct.md`), issue 6.
Acceptance: allocation counts attributed by compiler phase (beyond
the current totals/size-classes census), targeting reserve/arena work.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- phasealloc-crew (lead): dispatched 2026-09-21. Owns this objective. May fan
  nested workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (check `git status` first — Fasthull dirt belongs
  to another session; volatile reports/latest scratch gets file-copy
  backup/restore around any bench E2E, never git checkout).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind C-Obj 4.
- 2026-09-21 captain: C-Obj 4 COMPLETE and committed; C-Obj 5 opened, crew dispatched.
