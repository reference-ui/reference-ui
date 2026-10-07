# Oracle arc review — WAVE4.micros.arc (B4/B5/B6 + one filed gap)

STEP: WAVE4.micros.arc
PIN: HEAD `5b421e4ec` on `reference-system`. Arc: `5b421e4ec` (B4/B5/B6 code) —
read `reports/WAVE4.micros.md` and `GATES.md` at the pin.

## Captain verification (independent)

- `pnpm agentneo q` **0 errors**; neo `src/config` vitest **31/31**;
  `check:dist` **OK**; `verify-pins` **PASS (1258, no pin change)**.
- B5 fixture (`ui.config → a → b(barrel) → c`, with a `b↔c` cycle) FAILS the
  guard at `b.ts`; all in-repo configs pass.
- B6 Win32-shaped `ERR_MODULE_NOT_FOUND` gets the hint; 4 pre-existing marker
  tests green.

## Review

1. **B4 honesty.** The partitioned freshness comparison (six `dist/` outputs vs
   all inputs; `.reference-ui/system/baseSystem.mjs` vs sync inputs;
   `.d.mts` existence-only) — is it *complete* (every dist-affecting input
   still gates some output) and *not* merely vacuously green? The `commit.ts`
   mtime-preservation reasoning — sound, and does it leave any stale-dist path
   uncaught? Any input added to the sync later that would silently drop out of
   the compare set?
2. **B4 smoke shape.** Does the step-3b `requireFragment` mirror match
   `system/base/validate.ts` exactly (fragment-or-streams-or-jsxElements), and
   is the dataless fixture a real falsifier (not a vacuous pass)?
3. **B5 guard.** Is the transitive relative-import walk sound (extensionless /
   `index.*` / cycle guard), and does it fail loud on an unreadable helper
   rather than silently skip? Any way a barrel reach could hide (re-export
   star, dynamic import, tsconfig path alias)?
4. **B6 marker.** `/[\\/]\.reference-ui[\\/]/` — correct and not over-broad?
   The noted `normalizeConfigDependencyPaths` Win32 gap (`config/bundle.ts:30`)
   — leave as a filed note, or is it the same fix?
5. **The filed gap (`LIB_TASTY_RUNTIME_404`).** Is the diagnosis correct
   (`dist/index.mjs` lazy-imports `./tasty/runtime.js`; `materialize-runtime`
   copies only react/styled)? Is it genuinely pre-existing and out of the
   voyage's emit-determinism scope, or should it be a robustness arc now? Which
   of the three fix options (materialize the tasty runtime / guard the lazy
   import / relax the smoke probe) is correct, and what is the minimal bar?
   Is there a **second** lazy edge of the same class in the packaged lib or
   reference-types output?

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with stable IDs,
severity, file:line, evidence, recommendation, validation gap; P4 for
non-repair observations. End with a verdict: LAND or HOLD for the B4/B5/B6 arc,
and a separate ruling for `LIB_TASTY_RUNTIME_404` (fix-now / file / which
option).
