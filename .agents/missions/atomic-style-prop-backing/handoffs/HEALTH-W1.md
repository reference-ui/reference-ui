# HEALTH — W1 interference triage (`NEO-CSS-14`)

**Verdict: pre-existing red on `public-release` HEAD. Not caused by W1. Closed.**

## Symptom
During W1, `pnpm agentneo run NEO-CSS-14` failed:
`FAIL paint.spec.ts: sheet carries the harvested red floor` (`.neo-css14__c_red`
absent from the freshly-synced `styled/styles.css`; the sheet was preamble-only —
no utilities at all). T07's crew first attributed it to "in-flight sibling engine
edits"; T01's crew attributed the *other* red (`harvest-census` react.mjs bytes)
to T07. Both attributions were partially wrong.

## Decisive isolation (captain, firsthand)
```
git stash push -- packages/reference-rs packages/reference-neo/src   # all W1 src
pnpm agentrs b                                                       # engine from HEAD
pnpm agentneo run NEO-CSS-14    → FAIL (identical: harvested red floor)
git stash pop ; pnpm agentrs b                                       # restore W1
```
With **all W1 changes removed and the engine rebuilt from HEAD**, `NEO-CSS-14`
fails with the **identical** assertion. Therefore the failure is **pre-existing on
the branch**, independent of T01/T06/T07.

Corroborating analysis:
- **T01** harvest diff is neutral at `external:false`: `TwinKey` 5-tuple = the old
  4-tuple plus a constant `false`; `push_harvested` copies `sink.external=false`.
  Atomic cargo + seam green, zero golden drift.
- **T06** is a no-op for a no-upstream world (NEO-CSS-14's `ui.config.ts` has no
  `extends`/`layers`): the key drops, Rust defaults `[]`.
- **T07** is runtime-diagnostic only; it cannot affect the compiled sheet.

## The one real W1 red (resolved)
`packages/reference-rs/modules/atomic/tests/harvest-census.test.ts` pins the
**exact byte length of `react.mjs`**, which bundles the live neo `css.ts`. T07's
message change (`+12/+3`) legitimately moved it: `153457 → 153469` / `37735 →
37738`. The census comment explicitly says *"Re-verify if acceptance moves bytes."*
Re-pinned by crew **T07b**; seam now **314/314**.

## Consequence for the mission
- `NEO-CSS-14` is **out of scope** and must **not** block G1 (it is not in the
  mission's decisive set). Recorded so it is not mis-attributed again.
- **Lesson (captain):** in a shared worktree, cross-crew *test* interference is
  real and attributions made mid-flight are unreliable. The captain resolves reds
  by **isolation on a quiescent tree**, not by crew testimony.
