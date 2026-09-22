IN PROGRESS — C-Obj 2: same-run phase boundaries + reconciled decomposition
=====================================================================

Mission: Operation Flamegraph Correct (`docs/missions/operation-flamegraph-correct.md`), issue 2.
Acceptance: common same-run boundaries (startup, scanning/evaluation,
native compilation, publishing) across all legs; a reconciled
decomposition replacing recon §2, with the JS-self caveat stated.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- phase-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (check `git status` first — Fasthull and
  neo-report dirt belongs to another session).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind C-Obj 1.
- 2026-09-21 captain: C-Obj 1 COMPLETE and committed; C-Obj 2 opened, crew dispatched.
