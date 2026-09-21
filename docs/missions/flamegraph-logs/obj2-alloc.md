IN PROGRESS — Obj 2: allocation report on the enterprise compile
==========================================================

Mission: Operation Flamegraph (`docs/missions/operation-flamegraph.md`).
Acceptance: dhat (or equivalent) on the Rust side — reachable-live vs.
transient vs. allocator-resident during compile — reproducing the R1
post-mortem findings (zero mark-compacts, unscored reachable delta) by
measurement. Runner-backed, evidence in standard locations.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- alloc-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (known-dirty: operation-fasthull.md — other session
  actively working it — plus neo benchmark latest/ report).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind Obj 1.
- 2026-09-21 captain: Obj 1 COMPLETE and committed; Obj 2 opened, crew dispatched.
