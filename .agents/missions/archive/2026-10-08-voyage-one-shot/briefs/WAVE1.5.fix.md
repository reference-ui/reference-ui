# Brief — WAVE1.5.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

Wave 1.5 of the one-shot startup voyage: land the Oracle's two P3 fix tasks from
`reports/WAVE1.arc.md` (W1-5, W1-6). Read that report first. Work in
`/Users/ryn/Developer/reference-ui`, branch `reference-system` (base
`5ea3dcdca`). Do **not** commit, push, or `git stash`; do not touch
`packages/reference-rs/**`; disclose any file you did not touch. Stay in
`packages/reference-neo/src/config/**`.

## W1-5 — narrow the upstream-sync hint marker

`packages/reference-neo/src/config/errors.ts` (~:67): `UPSTREAM_MARKER` is
currently `/@reference-ui\/|\.reference-ui\//`. The `@reference-ui\/` arm
overmatches: a genuinely **not-installed** `@reference-ui/*` package reports
`Cannot find package '@reference-ui/...'` and wrongly earns "run sync" instead
of "install". The true unsynced-upstream signature is the **resolved path**
containing `.reference-ui/`. Narrow the marker to `\.reference-ui\/`.

Tests (`errors.test.ts`): fix the wrapped case at ~:28 — it builds from the bare
specifier `'@reference-ui/lib/baseSystem'`, which is not a realistic Node
message. Use the realistic **resolved-path** message
(`.../node_modules/@reference-ui/lib/.reference-ui/system/baseSystem.mjs`), and
add a **negative** case: a not-installed package message stays quiet (no hint).

## W1-6 — broaden the barrel-guard detector

`packages/reference-neo/src/config/base-system-import.test.ts` (~:19) bans only
named `baseSystem` imports from the exact barrel. The 1.5 s cost is the **barrel
import itself**, so any of these must fail the guard: `import { x } from
'@reference-ui/lib'`, `import * as lib`, `export … from '@reference-ui/lib'`,
dynamic `import('@reference-ui/lib')`, `require('@reference-ui/lib')` — in any
`ui.config` file. Ban the exact barrel specifier `'@reference-ui/lib'` in any
import/export/require/dynamic-import position; keep the exact migration pin as
the strong protection and extend the detector self-test to cover the missed
shapes. Do not weaken the anti-vacuous bound or the pruning walk.

## Prove

- `pnpm agent vitest packages/reference-neo/src/config` green (show the new
  cases).
- `pnpm agentneo q` 0 errors.
- No production behavior change beyond the marker narrowing; `git diff` shows
  only `errors.ts` + the two test files.

## Output

Write `.agents/missions/voyage-one-shot/reports/WAVE1.5.fix.md`, append to
`.agents/missions/voyage-one-shot/WAVE1.md`, and reply with a short summary.
