---
name: agent-perf
description: Self-contained workflow for Reference serial sync() performance (diets, alloc kills, lookup restructure in packages/reference-rs): rolling star-captain swarm with verdict bars (LAND/BANK/CUT/HOLD), integrator sum-confirms, bench-lock protocol, and the perf-index (`pnpm agentperf`) carrying every verdict ever filed.
---

# agent-perf — Reference serial-perf swarm skill

Self-contained workflow for cutting enterprise `sync()` milliseconds with
disconnected implementor crews, short-lived integrators, and a captain who
lands verified arcs. This skill runs serial diets; parallel implementation
follows CORES.md (unbanned 2026-09-22, stable-and-proven only).

## 1. Activate when

- The task is `sync()` / compile speed in `packages/reference-rs`
  (diets, alloc kills, lookup restructure, emitter work).
- A perf mission (VOYAGE.md) is running or being planned.
- Someone asks what was tried before on perf ground — answer from the
  index (section 7), never from memory.

Do NOT activate for component look/feel (`tweak-component`), component
tests (`test-component`), Neo runtime (`agent-neo`), or benchmark
reporting (`benchmark` — that skill *reads* numbers, this one *moves* them).

## 2. Mission shape (wave after wave, full complement)

1. **Fresh flames first.** Every wave opens with a repro crew on the
   current tip (2+ reconciled captures, filed under
   `docs/evidence/flamegraph/enterprise-repro*/`). No wave starts on
   stale flames — landed diets move every room.
2. **Ranked backlog from the burndown.** Topics carry: exact functions,
   flame weight, fantasy ceiling + realistic capture, fences vs
   landed/worked ground, and a falsification bar (counts-first; fast CUT
   is first-class). Dry rooms named, never re-seeded. Each topic names
   its ground fence (sync() vs named off-scope surface); a sync voyage
   never briefs off-scope levers unless HQ widened scope — drift
   without a ruling is a protocol violation.
3. **Full-complement rolling swarm.** Captain keeps all 7 worker slots
   (8 agents incl. captain) filled whenever the backlog is non-empty
   — a thin 1–2 crew while topics wait is the failure mode. One
   hypothesis per crew, isolated worktree, REPORT.md verdict. A freed
   slot respawns on the next backlog topic in the same tick. Slots
   held ONLY on proven empty backlog (a thin crew costs lock
   rotations that landing-confirms need).
4. **Integrate banked sets.** 3–7 banks → one integrator (own worktree,
   INTEGRATE.md). Solo LAND claims → single-hypothesis integrator.
   BANKs file patches under `docs/perf/waves/<wave>/*.patch` while
   unlanded; landed patches are deleted, file lists snapshotted.
5. **Captain lands, reports, re-profiles — per commit.** Firsthand
   suites + quality on the exact tree, then one verified arc per
   commit to `reference-system` (named files only), its pinned
   bench:neo report committed with it. After EVERY
   landing commit, same tick: enterprise re-profile report (seed-7
   medians, vs Panda, sha) appended as a LOG.md scoreboard row —
   the voyage timeline, never batched or skipped — plus a flame
   refresh on the new tip. Next dispatch seeds from fresh flames.
   Then the next wave, immediately, until HQ parks.

## 3. Bars and doctrine (load-bearing)

| Rule | Statement |
|---|---|
| Solo LAND bar | ≥15 ms **and** ≥1.5% whole-sync (8-pair, warmups unscored, stands ex-run-1). A jitter filter, not a quality bar. |
| Per-phase floor | 5 ms. BANK-track diets prove mechanism + identity below it. |
| Per-phase bank (keys2 precedent) | ≥5 ms phase **and** ≥25% phase share **and** differential proof **and** flame-reproducing method. Joins sums; whole-sync resolves in the sum-confirm. |
| BANK | Implemented + 8-pair + 4-scale byte-identity vs sealed pins + determinism + suites green + `agentrs q` 0 violations. |
| CUT | Counted ceiling bars both prongs (file exact filler + bank conditions), or built diet measures ~0 honestly. |
| HOLD | Merge needs design not present in either patch (scalarjson precedent) — with a precise re-proof spec. Never rewrite to force. |
| Reserve precedent | Sub-noise/straddle members land inside a sum that clears with headroom (wave-1 reserve soloed +16.5). Requires the 3-part justification: artifact includes them, sum clears, each provably removes counted work. |
| Subset-confirm rule | A **replicated** directional contra (failed its own banked replication, differs in kind from straddles) earns a subset-confirm, not a free ride (recipepath: FULL −14.1 → subset −19.3). |
| Race rule | First sound LAND wins. Overlap is adjudicated hunk-by-hunk with a count probe — the weaker YIELDs on evidence, never on assertion (authcss⊂cloneplasma). |
| Sortshape bar | Zero emission-order changes, always. Byte-identity 4/4 is necessary, order argument explicit. |

## 4. Bench lock (refined)

One box, one stopwatch. `mkdir /tmp/swarm-bench-lock` to grab (atomic);
write the owner file. Hold only for timed blocks; release in two steps
(`rm -f owner && rmdir`). While held by another: edit/read only.
Never delete the lock dir except in your own two-step release; if it
vanishes mid-hold, discard the whole set and disclose — never time
against a ghost lock.

- Never kill foreign PIDs, never touch foreign processes — disclose
  noise (name the process), discard whole sets, never cherry-pick pairs.
- Never ping working crews for vitals. Liveness comes from roster
  states + claims lines + worktree inspection (read-only).
- Starvation is real at 7 crews: stage everything lock-free (census
  patches, diet drafts, scripts) so a hold is pure execution. A crew
  silent 60+ min that is queued — not self-stuck — is starved, not
  deadlocked: verify via worktree mtimes/REPORT skeleton, then leave it.
- Verdict-gated sequencing (wantctx pattern): census + design now, diet
  only after the gating verdict posts. Watch the claims file, not the crew.

## 5. Brief skeletons

Implementor = base-pin (`git rev-parse HEAD` or stop) + hypothesis with
entry files + grounding list (index search first) + fences (others'
ground by function, never by directory) + falsification bar + lock
protocol + REPORT.md format (counts, 8-pair table, identity pins,
suites, quality, verdict + mechanism proof, DX appendix: broke
command + workaround + minutes lost + fix proposal). No pivot to a
second hypothesis. No commits, no pushes, never write LOG.md.
Before filing, `git status` shows ONLY own files (a dirty file you
didn't touch is a fence collision — disclose it, don't absorb it).
Provision the toolchain first (`pnpm install` in the worktree);
"no node_modules" never substitutes for a named suite.

Integrator = base-pin + member patches + the filed rebase record to
reproduce + collision analysis with file:line evidence + what-was-NOT-
done + suites stash-compared (delta = exactly the carried-over tests,
enumerated by name) + q 0 violations + 8-pair sum + per-member LOO
bisect + identity + determinism + INTEGRATE.md (final line
authoritative). Integrators judge and prove — no new work.

## 6. Proof and gates

- Binaries asided + sha256-verified before AND after every timed run;
  harness aborts on mismatch. Pin stream always (no `--seed` on verdict
  runs). Binaries never rebuilt mid-set.
- Suites: `pnpm agentrs c <crate>` (stash-compared vs clean tip).
- Quality: `pnpm agentrs q` on touched files — 0 violations, zero NEW
  warnings vs banked counts (pre-existing/banked reproduced at tip).
- NEVER `git stash` in worktrees — stash refs are global across
  worktrees and one crew's pop drops another's entry (intset4 incident).
  File asides (`/tmp/*.diff`, `/tmp/*.node`) only.
- Captain re-runs decisive suites + quality firsthand on the exact
  landing tree before every commit. Byte-compare every file.
- Off-scope proof (levers outside Rust sync(), e.g. MCP/TS import or
  search latency): accepted harness is bench-locked fresh-process
  timing of esbuild-bundled real modules (before/after arms, warmups
  unscored, medians + agreement count), a sha-identical equivalence
  battery mirroring every touched test, and a census grounding the
  mechanism. Extension-safety: prove the win touches only the named
  surface (importer graph + zero sync-path references, or measured
  0). File as BANK with the surface in the topic; solo LAND applies
  the section 3 bar to the surface's own denominator, captain
  sign-off required.

## 7. Perf index (institutional memory)

```bash
pnpm agentperf list [--wave wave-2] [--verdict BANK] [--limit n]
pnpm agentperf search <query...> [--limit n|--all]  # substring-AND over topic/id/verdict/summary/log
pnpm agentperf show <PERF-W2-..>  # full entry: files, numbers, LOG text
pnpm agentperf stats              # counts by wave/verdict
pnpm agentperf rebuild            # regenerate from filings + LOG.md (never takes args)
pnpm agentperf --help [<command>] # help; unknown flags/args are rejected, never swallowed
```

Every diet, recon, CUT, integration, memo, and dead end is one entry:
verdict, effect, files, report path (+ patch path while unlanded —
landed patches are deleted, their file lists snapshotted in the
builder), summary, the captain's LOG.md entry, filler flag. Always
`search` before scoping new work —
re-litigating a closed topic without new filed evidence is a protocol
violation. Overrules are flagged on the entry (`show INT-W2-SET4`).
Wave `log` holds DEAD-* dead ends mined from LOG.md (verdict CUT,
report LOG.md) — check them before re-opening a closed topic. On
ground with zero index coverage (no hits across topic synonyms —
the CLI reports counts, so one search proves it), file one line
(`index: 0/N, built <date>`) and proceed; grinding queries to prove
a negative is busywork. File off-scope BANKs so the index grows
onto new ground instead of staying sync()-only.

## 8. Closeout (per commit + per wave, non-optional)

Per commit: committed bench:neo report + scoreboard row + flame refresh, same tick (§2.5).
Per wave:

1. Land or HOLD every open member; integrators file INTEGRATE.md.
2. `pnpm agentperf rebuild` — the index absorbs the wave.
3. Archive the wave log to `docs/perf/waves/<wave>/` and clear the live
   LOG.md wave section to a stub (scoreboard + pointers). Nothing is
   lost: index entries carry the LOG text, the archive carries the rest.
   Scoreboard rows are never cleared — they are the voyage timeline.
4. Next wave starts at section 2 step 1 — fresh flames, never stale —
   immediately, unless HQ ordered a park. Parking with a non-empty
   backlog, or after a single thin wave, is a protocol violation.
