# Mission: Operation Flamegraph — stop flying blind on the Rust side

Status: `active` (captain on conn 2026-09-21, Obj 1 crew dispatched). The voyage's speed crews have been
reasoning about Rust performance from the outside: wall-time deltas,
code reading, and deepsee measuring from the TS side. Twice in Wave 4
a hypothesis died expensively late (R1's chunked handoff, B's
insert-skip) that real tooling would have killed — or confirmed — in
an afternoon. Flamegraph is the enabling mission: land Rust-native
profiling in the repo's own runners, then hand Wave 5 a sighted map.

Non-goal: no speedups ship under this mission. Its deliverable is
instruments plus one recon-quality report. Optimisation remains
Fasthull's cycle; Flamegraph only tells the next crews where to look.

## The gap

What the voyage can measure today: sync wall, peak RSS, bundle bytes
(`pnpm bench:neo`), per-phase TS timings (deepsee), `--trace-gc` on
the JS side. What it cannot: which Rust frames burn the 1.19s, what
allocates vs. what passes through, whether a room is skimmable waste
or a syscall/parse/print floor. The Wave 4 close leaves sync at 1.84×
Panda with the recon's verdict that past ~1.0s is architecture or
out-of-bounds — that verdict deserves data, not debate.

## Instruments to land

1. **Flamegraphs of the real path** — `samply` against the node
   process running enterprise sync. macOS-friendly, no root, profiles
   straight through the N-API boundary: Rust frames and JS frames in
   one picture. Target shape: `pnpm agentrs flame -- enterprise`.
2. **Allocation profiling** — `dhat` (or equivalent) on the Rust side:
   reachable-live vs. transient vs. allocator-resident during
   compile. Settles RSS arguments by measurement; the R1 post-mortem
   (zero mark-compacts, unscored reachable delta) is the worked
   example it must reproduce.
3. **Criterion micro-benches** for the top hot functions (resolve,
   plan build, census, line index, ladder match) so lanes prove a win
   at unit scale before paying for full bench runs.
4. **Hardware counters** — instructions, cache misses, syscalls around
   the scored sync, to answer "are we at a floor?" per room.

All four live behind the repo runners (`pnpm agentrs`, cpu-gate
aware) with evidence written to the standard locations. A wiki page
of ad-hoc invocations will rot; a runner subcommand gets used.

## Deliverables

- [x] `pnpm agentrs flame` (samply harness, pinned procedure, output
      to evidence dir) + one enterprise flamegraph filed as the Wave 5
      baseline. (landed 2026-09-21, verified firsthand, evidence at
      docs/evidence/flamegraph/enterprise-latest/)
- [x] Allocation report on the enterprise compile reproducing the R1
      findings by measurement. (landed 2026-09-21, verified firsthand,
      evidence at docs/evidence/alloc/enterprise-latest/)
- [x] Criterion benches for ≥5 hot functions, green in CI-adjacent
      runs (`pnpm agentrs c` family). (landed 2026-09-21: 8 targets /
      46 cases / 9 functions, verified firsthand, plus `pnpm agentrs
      bench` gated invocation)
- [ ] Counters pass answering floor-vs-waste per top room.
- [ ] Recon-quality report: ranked rooms with numbers, kill-fast
      bars, and an explicit Wave 5 recommendation (skirmish lanes vs.
      architectural bet).

## Rules

- Locked load, always: same frozen scales/seeds as the voyage; the
  instruments observe, they never weaken the bench.
- No `#[allow]`, no repo-wide formatters, no bare stash — standard
  `agent-rs` gates apply to harness code too.
- Profile the `.node` as shipped (release profile through the real
  sync path), never a debug-only microcosm, and say which is which.
- One crew, one tree, captain merges; evidence over vibes, as ever.
