Status: LANDED — both tracks verified firsthand and committed separately

# Cleanup 2026-09-25 — captain's board

HQ orders: kill the harvest-census red; retire virtualrs entirely
(dead engine, zero callers, 10 pre-existing golden reds).

## Tracks

| Track | Crew | Stage | Status |
| --- | --- | --- | --- |
| harvest-census red | diagnose+fix | ruled test-bug, fixed, 302/302 | 3e05512b8 ✓ |
| retire virtualrs | audit→plan→execute | executed, 638/638, zero live refs | df4d87b76 ✓ |

## Landing rule

Captain verifies firsthand (suites + gates + zero-ref grep for the
retirement) and commits each track separately on green. No crew
commits.

## Landing notes

- Three untracked files left deliberately: pipeline/src/registry/lock.ts,
  pipeline/src/registry/lock.test.ts, pipeline/src/testing/matrix/runner/paths.test.ts.
  Orphaned, unrelated to the retirement — a peer session's in-flight
  matrix-parallelism work. Untouched.
- Release note: the .node filename inside published optionals changes
  (virtual-native.* → reference-native.*). Old cached optionals fail
  closed ("missing binary," never silent), but release must publish
  fresh optionals for all triples. Package names unchanged, no registry
  migration.
