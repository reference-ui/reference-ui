IN PROGRESS — C-Obj 4: independent RSS sampler, versioned procedure
=============================================================

Mission: Operation Flamegraph Correct (`docs/missions/operation-flamegraph-correct.md`), issue 4.
Acceptance: RSS measured independently of the blocked event loop;
fix lands behind a versioned bench procedure so history (incl. active
Fasthull numbers) stays comparable. CROSS-MISSION: `worker.ts` is the
voyage's shared scorer — minimal diff, dual-report or version pin,
no silent rescoring of other missions' numbers.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- rss-crew (lead): dispatched 2026-09-21. Owns this objective. May fan nested
  workers over disjoint pieces. Writes here; never commits; never touches
  another session's files (check `git status` first — Fasthull and
  neo-report dirt belongs to another session).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, queued behind C-Obj 3.
- 2026-09-21 captain: C-Obj 3 COMPLETE and committed; C-Obj 4 opened, crew dispatched.
