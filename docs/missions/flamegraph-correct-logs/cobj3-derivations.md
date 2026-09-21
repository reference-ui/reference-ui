IN PROGRESS — C-Obj 3: counters derivations fix
==========================================

Mission: Operation Flamegraph Correct (`docs/missions/operation-flamegraph-correct.md`), issues 3 + 5.
Acceptance: stall ceiling withdrawn (width assumption no longer
presented as measurement); thread birth/death handled in the
parallelism metric (unmatched threads attributed, share bounded).

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- deriv-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (check `git status` first — Fasthull and
  neo-report dirt belongs to another session).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind C-Obj 2.
- 2026-09-21 captain: C-Obj 2 COMPLETE and committed; C-Obj 3 opened, crew dispatched.
