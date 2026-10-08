# READY ask 5 — Naming pass vs DOMAIN.md + styletrace README

Verdict: **keep all four proposals**. No collisions (none of the four
identifiers occurs anywhere in `modules/` or `reference-neo/src`). Each
fits the existing vocabulary; notes below are polish, not objections.

Checked against `packages/reference-neo/docs/DOMAIN.md` (load-bearing
words + retired list) and
`packages/reference-rs/modules/styletrace/README.md` (+ `analysis/`,
`resolver/` READMEs by reference).

## The four proposals

| Proposal | Fit | Verdict |
|---|---|---|
| `StyleSurface` (`style_props` + `primitives`, `from_declaration_root` / `from_engine`) | "Surface" is the README's own word for exactly these sets ("primitive declaration surface", "type surface", "generated primitive surface"). `from_*` constructors match Rust convention in the codebase (`from_spec`, `from_json`, `from_profile_and_authored`) | **KEEP**. Minor: DOMAIN.md has "author surface" (the `@reference-ui/neo` entry) — different concept, different qualifier; no action, just don't shorten to bare "surface" in prose |
| `TraceOutcome { bindings, diagnostics }` | `bindings` matches the established family (`trace_style_bindings`, `TracedBinding`). `Outcome` correctly avoids `std::Result` collision while reading as "the trace question, answered" | **KEEP**. Alternative `TraceReport` exists in the analyzer's own doc comment ("diagnostic report") but `report` is taken by `agentneo report` (tuning data) — `Outcome` is the better neighbor |
| `ResolvedHosts { traced, configured }` | Sits in the `resolveJsxElements` family (resolve = the jsxElements-pipeline word both sides of the cut). Carries the split the gate unions and the publish needs | **KEEP (weak)**. `resolve` is mildly overloaded (style lowering also "resolves"); if it chafes in review, `HostSets` is the precise-but-bland fallback. Not worth churning before code |
| `tracedJsxHosts?: string[]` (contract + result field) | Joins the `jsxHosts` / `jsx-elements.json` / `jsxElements` family with the new `traced` DOMAIN word as prefix. More precise than `discoveredJsxHosts` (discovery is the mission claim; tracing is the mechanism producing this field) | **KEEP** |

## Supporting names (already in the plan, checked)

- `trace_style_bindings_with_surface` — fits the
  `trace_style_bindings[_with_hint]` family exactly. KEEP.
- `analysis/surface.rs` placement — beside `primitive_metadata.rs` and
  the analyzer; correct home. KEEP.
- DOMAIN.md additions (`host` = a JSX name whose style props extract;
  `traced` = discovered by StyleTrace; `configured` = from
  `jsxElements`) — endorsed verbatim. None collide with Current or
  Retired entries. One wording nit: "discovered by StyleTrace" is the
  right precision (the engine owns StyleTrace post-#3; "by the engine"
  would blur into extractor binding resolution, which is Overmatch's).

## Anything missing

- The plan's "surface in, hosts out" section header would make a good
  one-line module doc for `surface.rs` — suggested, not required.
- No new verb needed: `trace` (engine side) vs `resolve` (publish side)
  already divide the labor along the cut, matching "above / below the
  cut".
