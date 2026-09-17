# Neo Domain Language

Living doc. The names that build up the runtime — not every
identifier, just the load-bearing ones. When a name changes, update
this file in the same pass.

## Current

- **case** — one leaf folder under `tests/cases/`: an id, a
  description, a world, specs asserting an outcome. The unit of Neo
  verification.
- **world** — a case's little source tree, served over local HTTP
  during a run.
- **spec** — a Playwright assertion file against a world: static
  checks plus computed styles plus settled snapshots.
- **server** — the per-case static HTTP server (`tests/shared/`).
  (Renamed from "bubble" in r5.)
- **artifact** — run output kept under
  `tests/.artifacts/<case-id>/`: screenshot, accessibility snapshot,
  trace/video on failure.
- **gate** — the structural quality check (`agentneo q`). It fails.
- **run / list / search / q / report** — the `agentneo` verbs: list
  the catalog, find cases, execute, gate, show tuning data.
- **above / below the cut** — Neo is TypeScript above (fragments,
  publish, runtime); reference-rs is Rust below (atomic, typegen,
  styletrace).
- **fragments** — author call sites (`tokens()`, `font()`, …)
  evaluated once in Node.
- **EvaluatedSystemSpec** — the frozen wire format crossing the cut.
  Owned by `reference-rs/contracts`, never redefined.
- **publish** — writing `.reference-ui/{system,styled,react}` from
  Rust's output.
- **Neo** — the code word for this runtime rebuild. Retires if
  promoted to core.

## Retired (do not revive)

- **station** — the compiler-loop word (rs-shaped). Neo tests cases,
  not stations.
- **goldens / --update-goldens** — rs proves compilers with goldens;
  Neo proves CSS with cases and human-gated snapshots.
- **bubble** — cute and confusing. The thing is a server.
