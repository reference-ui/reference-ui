# MCP release readiness

## Verdict

Release-ready for internal use, with one high-value hardening rule:

- keep MCP isolated from sync worker-slot contention

The core MCP product is now in the right shape to ship inside Reference UI.
What remains is mostly targeted hardening and smoke coverage, not a large
architecture rewrite.

## What is already solid

The important product semantics are now in place:

- Atlas drives component discovery, usage, examples, and component-to-interface
  mapping
- generated type artifacts enrich Atlas output instead of MCP inventing its own
  type path
- components with no props annotation now emit `interface: null` instead of a
  fake `UnknownProps`
- unresolved named props types stay distinguishable from the no-interface case
- MCP tool output is centered on authored component props, not full DOM/React
  prop surfaces
- the public `component-model` resource no longer leaks internal artifact
  metadata like workspace root, manifest path, or diagnostics
- package-backed includes now respect public root-barrel exports instead of
  leaking private helpers
- examples are trimmed to mount signatures instead of storing full nested JSX

That means the current server is already answering the practical product
question well:

- what components exist here?
- what can I pass to them?

## High-value hardening that is done

The highest-leverage hardening work already completed is meaningful:

- focused MCP unit coverage exists for joining, queries, and command transport
- integration coverage exists in `reference-unit` for HTTP startup and tool/
  resource output
- explicit cold-sync smoke coverage now proves `ref sync` recreates
  `.reference-ui/mcp/model.json` for a realistic fixture and includes known
  components
- VS Code integration guidance now avoids `pnpm`-spawn assumptions and uses a
  `node` + CLI-path launch shape that survives editor hosts with a minimal
  `PATH`
- sync now waits for MCP completion in one-shot mode, while watch readiness is
  gated on `packager:complete` so MCP does not stall normal edit feedback
- CLI transport selection is corrected so stdio remains the default but
  explicit `--port` / `--host` still imply HTTP
- MCP now runs on a dedicated worker pool slot instead of competing with the
  shared long-lived sync worker set

That last point matters because sync starts many long-lived workers that stay
alive for the full session. MCP should not be able to sit behind unrelated
worker occupancy when the build graph reaches `run:mcp:build`.

## Build-hang judgment

The recent long `ref sync` gap does not look like a permanent deadlock in the
event graph.

What the current evidence suggests is:

- sync ordering is correct: MCP only runs after `reference:complete` and
  `packager-ts:complete`
- watch readiness is not blocked on MCP
- the suspicious area is worker execution latency and MCP build time, not the
  event dependency shape itself

The dedicated MCP worker isolation removes the most credible queueing failure
mode:

- a long-lived shared worker set consuming pool capacity before MCP can start

If more slowdowns appear after this change, the next likely issue is MCP build
duration itself rather than sync orchestration.

## Remaining release blockers vs non-blockers

### Blockers before calling this externally polished

- add one failure-path test where generated type enrichment is missing or
  malformed and MCP returns a clear failure instead of an ambiguous stall
- add one timing/debug log around MCP build start and end so future slowdowns
  can be attributed quickly without reading raw bus traces

### Important but not release-blocking

- broader stdio-only integration coverage
- more varied Atlas fixtures for odd wrapper/re-export patterns as they appear
- richer public resource views if we later want lighter-weight inventory-only
  resources for assistants

## Highest-value next tests

If more confidence is needed, these are the best next Atlas/MCP tests to add.

### Atlas-side

- no-props component fixture with actual observed usage so `interface: null`
  is covered outside the zero-usage case too
- unresolved named props type fixture proving diagnostics stay attached while
  the interface identity is preserved
- wrapper/re-export fixture where local and package components share the same
  props type name but differ by source, ensuring disambiguation stays silent and
  correct
- package include fixture with multiple nested barrels confirming only the root
  public surface is indexed

### MCP-side

- stdio integration test that exercises `ref mcp` without HTTP flags
- failure-path test for missing generated manifest / broken type artifact
- timing/assertion test that MCP completion happens after `packager-ts:complete`
  for the current pass, not from stale prior artifacts

## What not to do

Before release, avoid:

- teaching Atlas to fully own rich type metadata
- adding a second MCP-specific type generation path
- broad refactors of the sync event graph without a concrete failing case
- adding large speculative tool surfaces before the core inventory/props path
  is exhausted

## Practical judgment

The MCP subsystem is substantial now, but the highest-value work is no longer
"invent more architecture".

It is:

- keep worker execution predictable
- keep Atlas semantics truthful
- keep the public MCP shape lean
- add a small number of smoke and failure-path tests that pin the real product
  contract

That is the right release-readiness bar for this system.
