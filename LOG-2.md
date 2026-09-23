IN PROGRESS

# LOG-2 — Objective 2: matrix chain gate + core retirement

Brief: [VOYAGE.md](./VOYAGE.md) Objective 2. Lands one commit.
Crew shape: voyage captain protocol (cartographers →
implementers → reviewers; captain verifies firsthand and commits).

## Status

Briefed 2026-09-22. Scope: audit every matrix suite (chain, css,
recipe, primitives, distro, mcp, system, tokens, …) — keep only
chain/ship-contract coverage, port the rest to Neo or drop; shrink
top-level `fixtures/` (11 entries); retire reference-core and migrate
live dependents reference-icons + reference-docs (both verified on
`@reference-ui/core`); restructure to `matrix/cases|tests` +
`matrix/fixtures`; `pipeline/` move conditional on verify. test-core
pipeline stays out except objective-ordered proof runs.

## Pending

Suite-by-suite audit: keep (chain/ship) vs port to Neo vs drop.
