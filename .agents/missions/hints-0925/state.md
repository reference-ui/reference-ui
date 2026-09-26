Status: LANDED — ARC-1 + ARC-2 verified firsthand and committed (4 exec crews, captain verify, docs)

# Hints 2026-09-25 — captain's board

Follow-on to the seam mission: WARNING_HINTS re-ruled as compiler-owned
display data (generic author fix-actions, zero CLI-specific copy; the
seam ruling's KEEP-in-Neo verdict did not survive reading the table).
Two arcs: move the static table to RS, then graduate emit sites to
instance `help` lines.

## Objectives (in order)

| # | Objective | Crew | Log | Status |
| --- | --- | --- | --- | --- |
| 1 | ARC-1: hints table + warningHintFor to RS js surface, coverage test, Neo rewire, prove both | hints crew | arc1-crew.md | flying |
| 2 | ARC-2 RULE: survey warning emit sites, specify per-site help + Neo render rule, size exec | oracle cell | arc2-rule.md | gated on 1 |
| 3 | LAND ARC-1 firsthand, commit; dispatch ARC-2 exec wave per rule | captain | land.md | ARC-1 landed, wave flying |
| 4 | ARC-2 EXEC: 4 crews implement instance help + Neo render per rule | crews | arc2-exec.md | done, landed |
| 5 | LAND ARC-2 firsthand, commit arcs + mission logs, close | captain | land.md | LANDED |

## Standing rules

- Crews never commit. Captain commits, named files only.
- ARC-1 crew works both trees in order (RS first, verify, then Neo);
  reads agent-rs AND agent-neo skills; rebuilds RS dist before Neo verify.
- Sequential shared-checkout wave. Deadlock test is read-only; never
  ping a working crew.
