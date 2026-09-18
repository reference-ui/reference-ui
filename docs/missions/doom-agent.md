# Mission: Doom Agent

Status: `idea` (HQ, 2026-09-18).

## The idea

A standing adversarial agent that looks at the whole vertical stack and
tries to break it. Mindset: destroy. It writes very adversarial test cases
against any slice it is pointed at — Neo runtime, Rust engine, reference-lib,
the playground — with the full toolset of every other agent.

The destruction is gated by a triage process (the fortification balance):

1. Doom agent produces a failing Doom test.
2. An oracle assesses it: does it fit the architecture? Is it already
   covered (but thinly)? Does it need a new test case?
3. The oracle judges production-likelihood, so Doom can't run riot — every
   finding is weighed before it becomes work.

## Captain's notes (not planned, just recorded)

- This is the landing's oracle loop (fail → infer → reproduce → fix →
  re-run) as a permanent process. The machinery is proven; Doom makes it
  standing.
- Doom needs a budget: N tests per run, time-boxed, auto-filed but never
  auto-fixed. Fixes ride the normal slice process with case proof.
- Layer order, cheapest first: RS units → Neo cases → lib unit →
  browser-level doom last (most expensive per finding).
- First targets when it spins up: wherever the paint is wettest.
- Composes with the [test index](test-index.md): Doom finds gaps, the index
  says whether they're covered, fortification writes the missing tests,
  which feed the index. One system.
