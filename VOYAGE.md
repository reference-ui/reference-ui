# VOYAGE — Final Descent

We've arrived at the engine. This voyage closes the last gaps between
reference-core and reference-neo, then climbs the stack to a component
set that creates release pressure.

Prior perf voyage archived at [docs/archive/VOYAGE-PERF-SWARM.md](./docs/archive/VOYAGE-PERF-SWARM.md).

## Destination

`packages/reference-neo` fully on par with `packages/reference-core`,
then a component release set. Done means parity proven by cases, sync
performance unmoved, and components that force a release.

## Ground

This voyage works above the engine: `packages/reference-neo`, the
reference-lib seam, and the reference port. The engine
(`packages/reference-rs`) is done — no diets, no refactors, no "while
we're here."

Autonomous missions: each mission below is crewed and run to its own
done-criteria. Missions confirm nothing in advance — research crews
determine root causes independently.

## Mission One — reference + tasty bridge into Neo

Objective: port the fully end-to-end reference component and its tasty
bridge from `packages/reference-core/src/reference/` (72 files, frozen)
into `packages/reference-neo`, so Neo is on par with core. The frontend
components themselves stay in `packages/reference-lib` — unchanged.
What moves is the bridge, the runtime, and the model; what gets fixed
is the seam between them.

Step 0 — brute-force copy (landed 2026-09-22): the module was copied
verbatim to `packages/reference-neo/src/reference/` (71 files; the
stale PLAN.md was left behind). Nobody hallucinates the shape — the
real code is the starting point, its own module, and all work happens
there. The copy arrives red (core-relative imports, unresolved seam);
green is the implementers' job. Cartographers verify the inventory
against core source first, then the port rules apply.

Source map (now in both trees):

- `browser-component/` — frontend component (copied out of reference-lib)
- `browser/` — runtime entry mirrored to virtual `_reference-component`
- `browser-model/` — document/member/type model
- `bridge/` — tasty build, worker, run, init, paths, events, logging
- `tasty/api.ts`, `api.ts` — API surfaces

Port rules:

1. The stale `src/reference/PLAN.md` stays dead. It said "not building
   a frontend component yet" — the component exists. It was not copied;
   the copy-pasta gets documented properly this time instead.
2. Resolve the `browser/` vs `browser-component/` duplication: verdict
   first (duplicate, layer, or source-vs-mirror), then land one clean
   shape. No weirdness carried over.
3. Dead-code audit: anything in `reference/` core no longer needs dies
   here. Port the living, bury the dead.
4. The lib↔neo seam must be explicit and tidy — no silent copies.

Perf law (hard constraint): ref sync performance must not dip because
of tasty. Tasty is fully deprioritized: cold start pays tasty once,
then ref syncs run on their own. Tasty happens in the background on a
deprioritized loop. Proof is same-box enterprise seed-7 medians
before/after — no regression, or it doesn't land.

Swarm shape (the proven overnight pattern): cartographers map first
(full inventory, duplication verdict, dead-code list, seam design),
implementers port in strict scopes, reviewers verify. Scoped proofs
only (`agentneo` cases + targeted suites); full runs only on explicit
order. Every agent loads its governing skill first.

Done when: Neo cases prove parity with core's reference behavior, no
sync regression, no dead plan or duplication carried over, and the
seam is written down.

## Mission Two — why is lib sync ~650ms

Objective: determine why Neo sync over `@reference-ui/lib` takes
~650ms, and fix it or file the fix. For a component library this
should be significantly smaller. This is an open investigation — the
brief states no cause. The research crew determines the root cause
independently and proves it with numbers.

Scope: Neo's sync scan and its export/barrel tracking (suspected area:
export-tracking handling and its parameters), the sync scan root and
excludes, and the engine path (core vs neo, N-API vs fallback). First
deliverable is a breakdown: what is synced (paths + counts) and where
the milliseconds go. A lib-sync probe crew is already out; its report
feeds this mission's kickoff.

Perf law: same-box before/after medians. The fix must move the number
while keeping sync output identical — speed without behavior change,
as always.

Swarm shape: same as Mission One — research first, then implementers,
then reviewers. Scoped proofs only; every agent loads its governing
skill first.

Done when: root cause proven with a breakdown, sync output identical,
and the number down with same-box medians to show it.

## Later — component release set

Briefed after Missions One and Two land.
