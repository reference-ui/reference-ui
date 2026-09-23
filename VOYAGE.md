# VOYAGE — Final Descent

We've arrived at the engine. This voyage closes the last gaps between
reference-core and reference-neo, retires core as legacy, and climbs
the stack to a component set that creates release pressure. The VOYAGE
is the mission; the five units below are objectives.

Prior perf voyage archived at [docs/archive/VOYAGE-PERF-SWARM.md](./docs/archive/VOYAGE-PERF-SWARM.md).

## Destination

`packages/reference-neo` fully on par with `packages/reference-core`,
a lean chain-gate matrix, core retired, then a component release set.
Done means parity proven by cases, sync performance unmoved, one
coverage home per behavior, and components that force a release.

## Ground

This voyage works in three trees only: `packages/reference-rs` (done —
no diets, no refactors, no "while we're here"),
`packages/reference-neo`, and `packages/reference-lib`.
`packages/reference-core` is legacy: nothing new builds on it, and
Objective 2 removes it. The heavy matrix pipeline (test-core) stays
out of the voyage except where an objective orders a proof run — no
verification theater; scoped runs only.

Autonomous objectives: each objective below is crewed and run to its
own done-criteria. Objectives confirm nothing in advance — research
crews determine root causes independently.

## Command (star-captain, fully autonomous)

One star-captain flies the whole voyage, all five objectives, in
order — start to finish, no HQ in the loop overnight. There are no
start-gates: the captain clears one objective, then the next, on
oracle word plus firsthand verification. Captain holds whole-voyage
context; captain never hunts, maps, implements, or fortifies.

Per objective, the bureaucratic shape (per the `star-captain` skill):
cartographers map first (inventory, verdicts, plan — filed in the
objective log), implementers build in strict scopes, reviewers verify
(proofs, and UX sign-off where the objective orders it). Crews write
every step to the objective log; what isn't in the log is lost. Crews
never commit — the captain re-runs the decisive suites firsthand and
commits, named files only. Liveness comes from log writes plus work
products; stuck crews get interrupted, rebriefed, or replaced — moving
crews are never pinged.

## Logs

Each objective keeps its own root log, first line always the status
(`IN PROGRESS` / `COMPLETE`): [LOG-1.md](./LOG-1.md),
[LOG-2.md](./LOG-2.md), [LOG-3.md](./LOG-3.md), [LOG-4.md](./LOG-4.md),
[LOG-5.md](./LOG-5.md). [LOG.md](./LOG.md) is the master index and
scoreboard.

## Landing law

Objectives 1–4 land as exactly one commit each — larger commits, but
nowhere near last week's monsters. Objective 5 lands one commit per
component, each component worked by its own crew. Every landing
commit must be green on its objective's proofs before it lands.
Standing order (HQ 2026-09-22, recorded here as the crews'
authorization): the captain commits landing work without asking;
nothing else commits.

## Objective 1 — reference + tasty bridge into Neo

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

## Objective 2 — matrix: keep the chain gate, retire core

Objective: the matrix becomes a lean hermetic chain gate; everything
else moves to Neo or dies; reference-core is removed as legacy.

Keep in matrix ONLY what needs a shipped package to prove: the chain
contract, build-and-ship-path behavior (pack/publish/install flows),
interpackage dependency behavior, fixtures that consume built
packages, and distro/MCP surfaces that need a real artifact. Things
genuinely hard to prove in one env — the Dagger-emulated stuff. That
is what the matrix was born for; that is all it keeps.

Move or drop everything else. Crews audit every matrix suite (chain,
css, recipe, primitives, distro, mcp, system, tokens, …): covered in
Neo already → drop from matrix. Not covered and not chain/ship →
port to Neo as cases. CSS/recipe/primitive coverage belongs in Neo's
fast loop, not in containers.

Fixtures: shrink and clean. Top-level `fixtures/` (11 entries, incl.
the styletrace library/consumer pair) gets smaller as non-chain suites
leave; update what remains.

Retire reference-core. Remove the package. Migrate its live
dependents, verified 2026-09-22: `reference-icons` (workspace dep,
`defineConfig`, ensure-core-cli build step) and `reference-docs`
(workspace dep, `defineConfig`, `referenceVite`). Nothing ships on
core after this mission.

Restructure: `matrix/cases` (or `matrix/tests` — crew picks the name)
+ `matrix/fixtures`. The top-level `fixtures/` folder goes away;
matrix is one subsystem among others now, not the only test rig.
`pipeline/` → `matrix/pipeline` ONLY if the crew verifies pipeline is
purely about matrix (it has its own package, src, and setup — verify,
don't assume).

Done when: matrix runs only chain/ship-contract suites, green in
hermetic runs; every kept behavior is covered exactly once (matrix or
Neo, never both); fixtures minimal and current; core removed with
icons/docs migrated; restructure landed.

## Objective 3 — why is lib sync ~650ms

Objective: determine why Neo sync over `@reference-ui/lib` takes
~650ms, and fix it or file the fix. For a component library this
should be significantly smaller. This is an open investigation — the
brief states no cause. The research crew determines the root cause
independently and proves it with numbers.

Scope: Neo's sync scan and its export/barrel tracking (suspected area:
export-tracking handling and its parameters), the sync scan root and
excludes, and the engine path (core vs neo, N-API vs fallback). First
deliverable is a breakdown: what is synced (paths + counts) and where
the milliseconds go. A lib-sync probe crew reported; its findings are
filed in LOG-3.md and feed this objective's kickoff.

Perf law: same-box before/after medians. The fix must move the number
while keeping sync output identical — speed without behavior change,
as always.

Swarm shape: same as Objective 1 — research first, then implementers,
then reviewers. Scoped proofs only; every agent loads its governing
skill first.

Done when: root cause proven with a breakdown, sync output identical,
and the number down with same-box medians to show it.

## Objective 4 — component baselines + interaction contracts

Objective: go component by component through `@reference-ui/lib` and
freeze what each one looks like, feels like, and does — BEFORE any
productionization touches it. This is the objective the quarantine branch
never had: snapshots first, look/feel/interaction captured, and only
then is the component eligible for productionization.

Per component, in order:

1. Snapshot-first: update and verify visual snapshots, CT cases, and
   interaction captures (video where motion matters) against the
   CURRENT tree. The baseline is the truth; nothing here changes the
   component.
2. Interaction contracts: land known conformance fixes, starting with
   the tooltip focus preset
   ([doc](./docs/missions/tooltip-focus-preset.md)): gate Tooltip
   focus-open on focus-visible, migrate the 4 CT tests to real Tab,
   add the TT-FOCUS-03 regression test. Executable blind per the
   doc's checklist.
3. Record the frozen baseline (snapshots + CT + contract fixes) in the
   log before the component is released to Objective 5.

Swarm shape: one bureaucratic crew per component — baseline capturers,
contract fixers, reviewers who verify zero drift. Scoped proofs via
`test-component` (`pnpm agentct`); snapshot updates only on genuine
change with human verification per skill rules.

Done when: every lib component has a frozen, reviewed baseline and the
known contract fixes are landed. Objective 5 may not start on a
component whose baseline isn't frozen.

## Objective 5 — reference lib productization (final)

Objective: ship the productionized reference lib — every component
tested, hardened, and landed as clean, engine-grade source. The
quarantine corpus (`components-quarantine`, recon filed) is the
primary raw material: tests and hardening patterns to re-target, not
to copy. The Objective 4 baselines are the oracle, but the two gates
differ:

- **Visuals: frozen.** Components must match the frozen snapshot
  baselines. Any paint/motion/chrome drift fails — no exceptions.
- **Interactions: reviewable.** Productionization may have enhanced
  interactions (especially accessibility). Each change goes to the
  `ux-designer` skill, which weighs it: genuine enhancement →
  approved with rationale; behavior loss → fail.

The `ux-designer` skill is the sign-off authority, briefed per
component with this objective's frozen-visuals constraint. It spins
components up through `view-story`, watches CT videos, reads snapshot
diffs, plays with the component, and rules per component. A component
lands only on UX sign-off plus green tests. Snapshot re-pins still
need the human yes per `test-component` rules — UX recommends, the
human confirms.

Shape bar: the output must read like an engine. Files stay small
(150 LOC max, aim 80), concerns separated, big container components
composing neatly abstracted parts. No automated lib quality CLI exists
(verified 2026-09-22 — RS and Neo have gates, lib has typecheck +
tests only), so reviewer crews enforce the bar by hand; standing up a
lib gate is flagged follow-up, not tonight's machinery.

Depends on: quarantine recon report (filed at
[docs/missions/quarantine-recon.md](./docs/missions/quarantine-recon.md))
+ Objective 4 baselines. Per component: apply, run the frozen
baseline suite, diff snapshots/videos/interactions, pass UX review,
then land.

Execution: one shared tree, no worktrees. Each crew owns its
component's files strictly and lands **one commit per component**.
Order root-first: Overlay first (everything builds on it), then widen
parallelism wave by wave as components become independent. The captain
sequences the waves.

Done when: quarantine productionization applied across lib, every
component UX-signed, baselines green, one commit each.
