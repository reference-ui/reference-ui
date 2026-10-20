# Testing library

Shared test primitives for every compiler harness. Exports the declarative case-suite runner, golden diffing, virtual workspace helpers, CSS assertions, and normalizers through one entrypoint, so harnesses share runner semantics instead of each growing its own case loop.

`runner.ts` discovers cases by raw ID, rejects non-ID folders, validates each case's index entry and README heading, executes semantic specs, runs invariant gauges, and verifies committed output goldens. `caseIndex.ts` owns the folder convention itself (`case.json` id plus the matching `# <ID> — <claim>` heading) as pure, independently testable checks.
