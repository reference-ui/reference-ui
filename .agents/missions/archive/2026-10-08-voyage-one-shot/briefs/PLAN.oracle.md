# Oracle consult — one-shot startup voyage (PLAN.oracle)

STEP: PLAN.oracle
PIN: `7c4847f01` on branch `reference-system`.
Read `docs/bugs/ONE_SHOT_STARTUP.md` fully at the pin; it carries the measured
phase split and root cause.

## The question

One-shot `ref sync` on the docs app is ~1.9 s and has ~1.6 s of headroom in a
single place: **config load** (`loadUserConfig`). We are standing up a serious
performance voyage to attack it. Give us:

1. **Verification** — independently confirm or falsify the finding from the
   bodies: `packages/reference-neo/src/config/{load,bundle,evaluate}.ts`,
   `packages/reference-lib/src/index.ts` and its `package.json` `exports`,
   `packages/reference-docs/ui.config.ts`. Is the ~1.5 s really the lib-barrel
   ESM graph, or is some of it hidden elsewhere (native addon load, React
   copy, esbuild service, module resolution)?
2. **Ranked routes forward**, including any we missed. For each: exact entry
   points, expected saving, risk, effort, the falsification bar, and whether it
   is byte-identical. Consider at least: a light `baseSystem` export subpath;
   bundling (not externalizing) `@reference-ui/lib` in the config bundle so it
   tree-shakes; serializing `baseSystem` as data; caching the evaluated config
   across one-shot processes; a cheaper evaluation mechanism.
3. **The correct first land** — highest value, lowest risk, and why. Name the
   single best wave-1 target and a second, in case the first is a CUT.
4. **Voyage structure** — how to fence and sequence crews so their proofs do
   not confound each other (one working tree, one shared native `.node`), which
   work can run in parallel, where Oracle reviews should sit, and the
   falsification/identity bars each wave must clear. This feeds the
   `agent-perf` skill's wave model.
5. **Frozen-contract risks** — anything in `reference-rs/contracts/`, the
   `EvaluatedSystemSpec` shape, or `defineConfig` authoring that a route could
   disturb.

## Context you should know

- The tasty external-resolution hotspot was already eliminated (`7a83e9fa7`):
  8,067 → 19 resolutions, one-shot 20.5 s → ~1.9 s. This voyage is the next
  axis, not a reopen.
- `pnpm agentperf search startup` → 0 hits; `config` → 2 unrelated. No prior
  verdicts to respect, but file the axis.
- One working tree, one shared native build; implementers serialize, Oracle
  reviews overlap. Assert-driven diets with a counts-first falsification bar
  (agent-perf doctrine).
- Byte-identity of the emitted system (manifest + CSS) is the standing bar for
  any route.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Then: verification findings
with file:line evidence; the ranked route table; the recommended first land;
the proposed voyage structure; and contract risks. Mark non-repair
observations P4. Where a claim is not verifiable at the pin, say so.
