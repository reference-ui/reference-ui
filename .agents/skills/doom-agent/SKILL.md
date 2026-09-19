---
name: doom-agent
description: Adversarial red-team workflow for the reference-ui style engine. Breaks the compiler within its stated physics across repeated cycles, reproduces every break independently, and fortifies each confirmed find with a station or a written deferral.
---

# Doom Agent

Red-team the style engine. Doom follows Forge: the shape is fixed,
the verdicts are signed — Doom attacks *within* them. It finds real
breaks, proves them, and hardens the system. It never invents
architecture and never grades its own finds.

Mission record: `docs/missions/doom-agent.md`,
`docs/missions/doom-agent-protocol.md` (seeds, cycle history, the
satisfaction pin). This skill is the operable loop every cycle crew
loads before touching anything.

## 1. The fine line (HQ)

Doom crews walk a fine line: creative enough to find real breaks,
disciplined enough to never file physics violations as wins. The
will-never-work list below is a **floor, not a ceiling** — it names
what cannot be filed as a break. Everything else is fair game.

## 2. The physics (out of bounds, not wins)

A break that requires violating these is rejected at triage — no
station, no credit, no argument:

- **Language**: styles live in TS/TSX/JS/JSX compile inputs. JSON
  theme blobs, CMS payloads, and fetched config are external sources,
  not compiler food.
- **Wholesale values**: complete static literals only. Computed
  strings, interpolation with holes, arithmetic, and generated loops
  are not extractable — by design, not by gap.
- **The seam**: measured, animated, and computed values belong on the
  native `style` prop (or GSAP). Demanding the compiler eat them is
  demanding it violate its own contract.
- **Style surface**: style props, `css()`, `recipe()` semantics as
  pinned. Feeding runtime-shaped data through them and crying break
  is out of bounds.
- **One-namer / one-map**: build reads source, runtime looks up a map.
  Nothing fills template holes or runs user code at runtime.

Sources of truth: `docs/missions/operation-forge.md` Part I (the
information layer, "not wholesale" refusals) and
`docs/missions/operation-error-correct.md` (failure modes, language
rule). This skill points at them; it never restates them. If they
disagree with this file, they win.

## 3. Will never work (triage floor)

Do not file breaks in these shapes — the compiler is correct to
refuse them (silently or with a diagnostic, per the warning policy):

- Interpolated / computed values in style positions (`` `${n}px` ``,
  string concat with params, built `rgb()` strings).
- Values that exist only at runtime (API data, user input, generated
  loops over unminted values) with no authored counterpart.
- Styles authored outside compile inputs (JSON, remote config).
- Rest-spreads and runtime identifiers staying dynamic (warned, kept,
  by design).
- Namespace / default *value* imports (named imports are the dialect;
  Forge §6 struck S13 permanently).

A finding that *looks* like one of these but behaves differently
(wrong diagnostic, silence where a diagnostic is owed, partial mint)
is in bounds — misdiagnosis is a real break. The refusal must be
right, not just present.

## 4. The cycle

Crews are disjoint by role within a cycle: the doom agent that finds
never reviews, reproduces, fixes, or fortifies in that cycle. Finders
find; other crews do everything else. The doom agent is always
*called* with a brief — it never orchestrates, spawns reviewers, or
runs the cycle. The cycle is linear: one agent hunts, hands off its
repro plus its log report, done.

Scheduling briefs modules round-robin so every top-level module gets
hunted over a run (atomic, canon, tasty, styletrace, module-graph,
reference-core sync, named lib components).

Every cycle runs the full loop, in order:

1. **Break** — one doom agent, one rough brief: a module or a
   direction, nothing more ("probe harvest sinks", "attack the
   ladder's alias arm"). The agent takes the worker shape of its
   target (§5 runners as appropriate) and hunts until it holds ONE
   candidate break, pursuing up to **3 theories** to get there.
   Research is free: reading code, tracing flows, probing avenues,
   and searching the doom log cost no theories. A theory is spent
   only on an unexplored gap: name the gap, write the red test —
   if it passes, the theory dies spent; if it fails, that is the
   candidate break. The candidate ships a minimal repro runnable
   blind. No repro, no break; three theories spent with nothing
   found is a clean hunt, reported as such.
2. **Reproduce** — a separate crew, never the finder, replays the
   repro independently. Unreproducible finds die here.
3. **Review** — severity honesty: user-facing break vs. curiosity,
   labeled as such. No theater, no findings farming.
4. **Consult** — anything needing shape changes (not just fixes) goes
   to architect consult. Doom crews do not redesign.
5. **Fortify** — an engineer crew, never the finder, closes every
   confirmed break with a station/test pinning the fixed behavior,
   or a written architect deferral with reasons. Doom hardens; it
   never lists-and-leaves.
6. **Cycle review** — what broke, what held, what the next cycle should
   probe. Written to the protocol's cycle log.

## 5. Verification

Breaks and fortifications prove through the same runners as the code
they touch: `agent-rs` (`pnpm agentrs`) for `packages/reference-rs`,
`agent-neo` (`pnpm agentneo`) for `packages/reference-neo` cases,
**test-core** (`pnpm agent`) for `packages/reference-core`/matrix.
Repro scripts live in `/tmp`, never in the tree. No golden sweeps;
every repin attested per pair.

## 6. Doom log (compounding memory)

Every hunt ends in `.agents/doom/logs/` as one markdown report
(filename `YYYY-MM-DD-<slug>.md`, start from
`.agents/doom/TEMPLATE.md`). Reports stay atomic — one Hypothesis
(gap pursued, red test written) and one Verdict (clean-hunt or
break-found with repro path and violated contract). No consult
logs, no research diaries: the index already holds past hunts,
and the report holds this one. Detail compounds: future agents
inherit your map.

Consult before hunting — the CLI re-indexes from `logs/` on every
call, so it is never stale:

```sh
node .agents/doom/cli.mjs search "<module, behavior, or gap>" --limit 5
```

If a gap was already explored, its red test and verdict are in the
log — do not spend a theory re-proving it. Thin log on your
module is itself signal: say so in your report for scheduling.

## 7. Satisfaction

A Doom run is a minimum of **6 full cycles** before the satisfaction
conversation. Six clean cycles with every real break fortified or
architect-deferred earns the pin discussion — and only HQ's explicit
"satisfied" writes the marker. The pin informs the signal; it never
replaces it.
