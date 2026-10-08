# Oracle arc review — WAVE1.arc (R1 land or HOLD)

STEP: WAVE1.arc
PIN: the R1 working tree (uncommitted) on `reference-system`; read
`reports/WAVE1.R1.md` in full. The captain has independently verified the
mechanism (below) and confirms the identity delta scope.

## Arc

R1 adds `@reference-ui/lib` `exports["./baseSystem"]` and migrates the three
configs (`reference-docs`, `matrix/tests/mcp`, `matrix/tests/chain/T16`) to it,
plus a `LoadConfigError` upstream-sync hint, a barrel-import guard test, and a
packed-tarball consumer smoke. Files are listed in `WAVE1.R1.md §1`.

## Captain verification (independent, this session)

- Census: config-import loads **7,728 → 2**.
- Timing (bench-locked, 16 fresh processes): config p50 **~19–20 ms** (from
  1,548 ms); `syncTotal` **141–166 ms** (from 1,673 ms).
- `verify-pins`: **1 missing/changed, 0 unexpected** — only
  `docs/.reference-ui/system/baseSystem.mjs` (`b7fece…` → `3cf839…`).
- Suites per the crew: `agentneo q` 0 errors; T16 4/4; lib `check:dist` OK;
  consumer smoke PASS; mcp 8 failures proven pre-existing (identical with and
  without R1).

## The HOLD question

The crew returned HOLD because byte-identity fails on that one file. Their
mechanism: `baseSystem.fragment` embeds esbuild `// path` banner comments for
the bundled neo modules; the Wave-0 docs pin was captured pre-R1 **through the
lib barrel** (which tslined a **source**-mode `baseSystem`), while R1 makes docs
read lib's canonical `.reference-ui/system/baseSystem.mjs`, which under the
mission harness (dist-mode) carries **dist** banners. They prove:
- the two payloads are **normalized-equal** (strip banners + whitespace), with
  `streams`, `jsxElements`, name, manifest and CSS byte-identical;
- the pin set is **mode-dependent** (an all-source ordering instead fails lib's
  `system/baseSystem.mjs`, `types/types.mjs`, `react/react.mjs`, `.map`);
- **no single sync mode passes all three pins** — docs and lib pins are mutually
  exclusive under the subpath.

## Ask

1. **Is the HOLD correct**, and is R1 **mergeable with a captain-owned pin
   re-baseline** (docs → `3cf839…`), or must the underlying emit-mode
   nondeterminism be fixed before R1 lands?
2. **Is the pre-existing sync-mode nondeterminism** (source- vs dist-invoked neo
   changes emitted bytes) a blocker for R1 or a **separate topic**? If separate,
   name the exact scope and the file it belongs in (it is a Neo emit-stability
   issue, not a lib issue).
3. **Canonical mode**: which invocation does the *product* actually use for
   `.reference-ui` emission — `bin/ref.ts` (source) or `dist/bin/ref.js`
   (dist)? Does the mission harness measuring `dist/src` (W0-3) measure the
   same mode the product ships? If not, what must the captain re-pin, in which
   mode, and does that invalidate Wave 0's baseline?
4. **Does normalized-equality hide any semantic risk** — anything downstream
   that consumes the fragment preamble bytes (source maps, tasty hashing of
   fragment source, `evaluateConfig` cache keys, the manifest identity)?
5. **R4 ruling**: with the residual config phase now ~20 ms (from 1.6 s), is R4
   (cross-process evaluated-config cache) **CUT by evaporation**, or does it
   still clear the written gate (≥15 ms and ≥1.5% of whole sync)? The plan
   required an Oracle design consult before any R4 implementation — fold the
   ruling in here if you can.
6. Review the R1 code itself for correctness/seams: the `errors.ts` cause-walk
   hint, the guard test's detector, the consumer-smoke types probe, and the
   `exports` entry shape.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line evidence, recommendation, validation gap; P4 for non-repair
observations. End with a verdict: LAND (with the exact re-baseline protocol) or
HOLD (with the exact blocker that must clear first), plus the R4 ruling.
