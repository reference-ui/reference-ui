# Mission: Capability Test Index

Status: `idea` (HQ, 2026-09-18).

## The idea

As reference-rs (and the whole stack) accumulates more and more test cases,
no agent can hold them all in context. Build an index over the tests so
agents can search capabilities instead of memorizing them:

- For each test case, infer a set of keywords + a short description: what it
  tests, the exact AST transform involved, which bit of language it targets
  (e.g. the `borderRadius` prop).
- At build time, a small piece of code compiles all keywords into an index.
- The agent CLI exposes it as string search: query in, matching test cases
  plus their locations out.

## Captain's notes (not planned, just recorded)

- Sequence docs-first, inference-second: SPEC rows, station READMEs, case
  READMEs, and the absence census already form a curated corpus. Dumb search
  over that delivers most of the value; inference fills thin spots.
- Generated, never hand-maintained — a stale index misdirects agents worse
  than grep does.
- Index negative knowledge too: the absence census ("we deliberately don't
  do that") is the highest-value answer class.
- Bidirectional: capability → tests, and test → capabilities.
