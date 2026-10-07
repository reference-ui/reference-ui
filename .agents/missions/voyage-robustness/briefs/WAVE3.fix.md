# Brief — WAVE3.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

Follow-up line for the Oracle `WAVE3.B3-depth.arc` review (LAND + follow-ups).
**Serialize:** dispatch only after the Wave 4 micro-batch lands (same tree).
Read `reports/WAVE3.B3-depth.arc.md` in full. Work in
`/Users/ryn/Developer/reference-ui`, branch `reference-system` at the then-HEAD.
Do not commit, push, or `git stash`; do not touch `packages/reference-rs/**` or
the pre-existing untracked `pipeline/` files; do not edit the pin baseline.
Disclose any file you did not touch. A docs dev server may run on :5174 — do not
stop it, do not touch docs project files.

All four changes are in `packages/reference-neo/src/packager/react.ts` (plus its
test). Keep it small; the shipped `react.mjs` bytes and the emitted map
`sources` must **not** change (no pin change).

## B3D-P3-1 — `onResolve` must honor `resolveDir`

`liveMapPathPlugin`'s `onResolve` (`react.ts:93-94`) tests only the raw
`args.path`, so a *relative* specifier into the stage is not re-homed (it would
emit `../sync.stage/…`). Join relative `args.path` against `args.resolveDir`
(normalized) before the stage-prefix test, so every staged input reports at its
live twin regardless of specifier form.

Bar: a fixture (or unit case) with a staged **relative** import re-homes to the
live twin and its source resolves; no live case exists today, so a targeted
unit test is the proof.

## B3D-P3-2 — separator-insensitive stage-prefix test

`react.ts:87` compares with a `sep`-joined prefix; on Win32 a `/`-presented
plugin path would never match (silent orphan on one platform). Normalize both
sides to one separator before comparing, and unit-test the predicate with both
separator forms.

## B3D-P4-1 — explicit unknown-loader throw

`react.ts:104` `STAGED_LOADERS[…] ?? 'js'` silently mis-loads an unknown staged
extension. Throw a clear error instead (or keep the map but fail loud). Live
inputs are `.mts`/`.mjs` only, so this is defensive.

## B3D-P4-3 — generic map guard (recommended next task)

Add a small guard that absolutizes **every** non-synthetic `source` of **every**
`.map` under a synced `.reference-ui` and asserts it resolves — either extend
the `react.test.ts` falsifier pattern or fold it into the NEO-SYNC-02 folder
inventory. Keep it generic so a future map-emitting leg is covered.

## Bar

- `react.mjs` ×3 **byte-identical**; emitted map `sources` **unchanged** ⇒
  `verify-pins` **PASS** with **no** re-baseline.
- New/updated unit tests for P3-1 (relative re-home), P3-2 (both separators),
  P4-1 (unknown loader), P4-3 (generic guard) green.
- `pnpm agentneo q` 0 errors; neo packager/sync suites green.

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE3.fix.md`, append to
`.agents/missions/voyage-robustness/WAVE3.md`, reply with a short summary +
VERDICT.
