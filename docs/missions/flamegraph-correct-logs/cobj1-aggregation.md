IN PROGRESS — C-Obj 1: flame aggregation fix + republished summaries
===============================================================

Mission: Operation Flamegraph Correct (`docs/missions/operation-flamegraph-correct.md`), issue 1.
Acceptance: `collectSelfHits` (and siblings) merge same-function
addresses and honor sample weights; summaries publish self AND
inclusive costs; enterprise summaries republished from the preserved
raw profile under a versioned procedure (raw bundles never overwritten
in place). Cross-check: reviewer reprocessing gives `resolve_alias` 26
self samples — the fixed summarizer must agree on the filed profile.

Roster:
- captain: holds context, verifies on oracle word, commits. Crews never commit.
- flamefix-crew (lead): dispatched 2026-09-21. Owns this objective. May fan
  nested workers over disjoint pieces. Writes here; never commits; never
  touches another session's files (check `git status` first — Fasthull
  and neo-report dirt belongs to another session).

Entries: (append; newest last)
- 2026-09-21 captain: log opened, crew dispatched.
- 2026-09-21 captain: flamefix-crew lead away (main/flamegraph-correct-cobj1/6); health tick armed (every 25m). Tree note: fasthull + neo latest-report edits are another session's — hands off. Prior-mission repair (filed-brief close-out lines) committed separately as df27984f0.
