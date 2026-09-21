IN PROGRESS — Obj 4: hardware counters pass (floor-vs-waste per room)
===============================================================

Mission: Operation Flamegraph (`docs/missions/operation-flamegraph.md`).
Acceptance: instructions, cache misses, syscalls around the scored sync,
answering "are we at a floor?" per top room.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- counters-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (known-dirty: operation-fasthull.md — other session
  actively working it — plus neo benchmark latest/ report).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind Obj 3.
- 2026-09-21 captain: Obj 3 COMPLETE and committed; Obj 4 opened, crew dispatched.
