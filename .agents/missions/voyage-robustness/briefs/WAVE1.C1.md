# Brief — WAVE1.C1 (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 1 of the robustness voyage: **C1 — unify documented build paths on the
shipped dist mode + a neo-dist freshness gate.** This is the voyage's core land
(Oracle `DESIGN.oracle` ruling: strategy (C); B2 output-normalization CUT).
Read `.agents/missions/voyage-robustness/reports/DESIGN.oracle.md` and
`reports/PLAN.oracle.md` first.

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do not
commit, push, or `git stash`; do not touch `packages/reference-rs/**` or the
pre-existing untracked `pipeline/` files. Disclose any file you did not touch.
Bench-lock timed blocks (`/tmp/swarm-bench-lock`).

## What to implement

Only **lib** runs source mode today (`packages/reference-lib/package.json`):
`sync` = `node ../reference-neo/bin/ref.ts sync` (inherited by `typecheck`,
`build`; `dev` calls `bin/ref.ts` twice). docs and icons already resolve the
dist bin (`ref` → `neo/package.json` `bin: ./dist/bin/ref.js`).

1. **New neo-owned freshness gate** at `packages/reference-neo/tools/ensure-dist.mjs`:
   - if `dist/bin/ref.js` is missing **or older than the neo `src`/tool inputs`,
     run `node tools/build-bin.mjs` (from the neo package dir);
   - otherwise exit ~silently; steady-state cost must be ~nil (mtime check);
   - honor the existing skip env (`REF_PIPELINE_SKIP_DEPENDENCY_BUILDS`) like
     `pipeline/scripts/run-if-env-absent.mjs` does, so CI can opt out;
   - a real 2–6 sentence header; no suppressions (`agentneo`-style file rules
     apply to mission/neo tooling the same way).
2. **Point lib's scripts at the dist CLI**, gated:
   - `sync`: `<gate> && node ../reference-neo/dist/bin/ref.js sync`
   - `dev`: gate once, then dist `sync --quiet` and dist `sync --watch`
   - Do **not** change `bin/ref.ts`; the neo source inner loop (`agentneo`,
   `tests/**` importing `src/sync/index.ts`) stays source-mode deliberately.
3. **Audit and, if needed, reuse/patch** docs/icons/root bootstrap so every
   documented `ref` invocation is dist-mode with a dist edge. docs uses
   `ref sync`; icons `node scripts/build.mjs` → `pnpm exec ref sync` (line ~27);
   root has no `prepare`/`postinstall`. Reuse an existing edge if one exists;
   otherwise add the gate narrowly and note it. Do not expand scope beyond the
   documented paths.
4. **Residual paragraph** appended to `docs/bugs/NEO_EMIT_MODE_DRIFT.md`: under
   strategy (C), source mode is the neo inner loop only, never a documented
   build path; the content-class graph drift (`types.mjs`, `react.mjs`,
   `react.mjs.map` mappings) is an accepted mode-scoped residual; any future
   cross-mode byte gate must scope to dist mode.

## Prove (the bar)

- **Zero byte churn:** run the **documented** lib `sync` (the new script) from
  the current state; all four lib artifacts (`system/baseSystem.mjs`,
  `react/react.mjs`, `react/react.mjs.map`, `types/types.mjs`) stay at their
  pinned dist hashes; `node .agents/missions/voyage-one-shot/scripts/verify-pins.mjs`
  → **PASS**, and `git diff` on `pins/baseline.sha256` is **empty**.
- **Fresh-clone path:** with `packages/reference-neo/dist` removed (back it up /
  rebuild after — it is gitignored), `node ../reference-neo/tools/ensure-dist.mjs`
  rebuilds it, then lib `sync` succeeds. Report the rebuild time and the
  steady-state (dist present) gate time (must be ~nil).
- **Suites:** `pnpm agentneo q` 0 errors; neo vitest for touched tooling/tests
  green; lib `check:dist` and consumer smoke as available.
- No pin baseline edit is expected; if any byte changes, stop and report why
  (C1 is supposed to change zero emitted bytes).

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE1.C1.md` (the gate
design, script diffs, zero-churn + fresh-clone proofs, suite results), append
to `.agents/missions/voyage-robustness/WAVE1.md`, and reply with a short
summary + VERDICT.