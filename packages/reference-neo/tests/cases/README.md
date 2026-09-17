# `tests/cases/` — one leaf folder per case

Cases are grouped in folders, not one big bucket. A leaf folder is a
little world: a small source tree the harness serves over local HTTP
from an isolated per-case server, plus specs asserting an outcome
against it.
Worlds are static until the host exists; `ref sync` and `ui.config`
are later legs, not today's contract.

Leaf shape:

- `case.json` — THE discriminator. A folder with one is a case. An
  assigned ID plus a name, so `agentneo` list/search/run is cheap.
- `README.md` — the standard case description. `list` and `search`
  pick up its first line. Missing or long is never a failure:
  convention, not gate.
- `world/` — the case's little source tree.
- `specs/` — Playwright tests: static checks (parses, expected rules,
  no ghosts) plus live computed-style assertions plus settled
  snapshots where rendering matters.

IDs are assigned, lib-style (`OV-POS-10` → `NEO-<group>-<nn>`).
Deliberately general-purpose: no rigid inputs/outputs contract like a
compiler station. The case defines its world; the test asserts its
outcome.
