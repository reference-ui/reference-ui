# Jettison READY ask 3 — miss-warning consumers

Challenge to `docs/missions/operation-jettison.md` §6 (miss contract, D2).
Brief claims: `NEO-MERGE-06` asserts both the `''` return and the node-side
warning. True — and incomplete. The full consumer set is 7 code files, all
inside `packages/reference-neo`. Lib CT has zero consumers.

## Method

- `console.warn` sweep over `packages/reference-neo/{src,tests}` (all spies
  and page-diagnostic recorders).
- `, ''` sweep over all neo case specs; `toBe('')`/`equal(..., '')` sweep
  over all neo src.
- Audited all 20 specs importing `registerRuntimeData` (`createStylePlanIndex`
  analogue: node-side `css()` callers) for hidden misses inside non-empty
  assertions — all 17 non-miss specs mirror world-compiled hit values.
- `no compiled class` + `registerRuntimeData` over lib/core/matrix: zero.
- `console.warn` over `packages/reference-lib/src` (tests + CT included):
  one hit, `toastRuntime.ts` (own warning, unrelated); no lib test spies
  on `console.warn` at all.
- `toBe('')` over lib src: DOM-attribute/inline-style assertions only, no
  `css()` call; no `getAttribute('class')` assertion anywhere in lib.
- Matrix `toBe('')`: CSS-variable polls (`watch-contract.spec.ts`) and a
  typecheck-output assertion — unrelated.

## Consumers (code assertions)

| # | File | Side | `''` assertion | Warning assertion |
|---|---|---|---|---|
| 1 | `packages/reference-neo/tests/cases/merge/NEO-MERGE-06/specs/miss.spec.ts` | page + node | L53 page class `''`; L74 node `css({color:'rust-500'})` `''` (L78 holes `''` — not a miss) | L59–62 page `__mergeDiagnostics` ×1; L82–85 node `console.warn` ×1 |
| 2 | `packages/reference-neo/tests/cases/static/NEO-STATIC-03/specs/outside.spec.ts` | page + node | L57 page `''`; L78 node `''` | L63–66 page ×1; L84–87 node ×1 |
| 3 | `packages/reference-neo/tests/cases/css/NEO-CSS-14/specs/paint.spec.ts` | page only | L77 `__cssProbe('hotpink')` `''` | L85–87 page `__css14Diagnostics` ×1; no node-side block |
| 4 | `packages/reference-neo/tests/cases/sync/NEO-SYNC-13/specs/data-only.spec.ts` | node (generated `react.mjs`) | L49 `mod.css({color:'missing'})` `''` | none |
| 5 | `packages/reference-neo/src/runtime/css/css.test.ts` | node (vitest) | L255, L300, L321, L331, L341, L359 (L248/L349 are holes, not misses) | L301–302, L323–327, L333–336, L344, L353, L360 (incl. zero-silence pins L269/L353 and production-silence L356–361) |
| 6 | `packages/reference-neo/src/sync/sync.test.ts` | node (generated `react.mjs`) | L272 `mod.css({color:'missing'})` `''` | none |
| 7 | `packages/reference-neo/src/runtime/css/plans.test.ts` | node (unit, below `css()`) | L86–95 omission from `resolveStyleDeclarations` | n/a — pins `findStylePlanMisses` (L303–318), the function Slice 3 deletes |

## D2 decision: A (CSSOM probe, browser dev only)

Node-side warning is load-bearing for **neo's own suite only**
(consumer 5's four warn tests + consumers 1, 2 node blocks) — all
mechanical re-pins, no design constraint. The brief's stated condition
for B ("if lib CT needs node-side warnings") fails: **zero lib CT /
lib-test / matrix consumers** (see Method). So B buys nothing its
~30 B/class dev manifest would pay for.

Re-pin list under A (mechanical, 6 files + prose): consumers 1–6 above;
`''` assertions become miss-class assertions, node-side warn assertions
are deleted (no `document` in Node), page-side assertions move to the
CSSOM-probe diagnostic. Consumer 7 goes with `plans.ts` in Slice 3.

Note: consumers 4 and 6 assert on the **generated bundle** node-side —
under A the bundle's node-side `css()` returns the miss class silently,
so both must be re-pinned to miss-class expectations, not just de-warned.

## Checked and out of scope (not consumers)

- `NEO-CSS-05` (`holes.spec.ts:41`): pure holes (`null`/`false`/`undefined`,
  world `app.ts:13–24`) — `collect` drops them before lookup; jettison keeps
  that. No warning asserted.
- `NEO-LAYER-02` (`packages.spec.ts:103`): CSS-var resolution, not `css()`.
- `recipe.test.ts:97` unknown-recipe → `''`: recipe tables stay in the v2
  artifact; untouched.
- `eviction.test.ts`: all hits, no miss assertion.
- `NEO-SYNC-16`, `sync/index.ts` warn paths: compiler-channel diagnostics
  (`ATM-W-DYNAMIC-*`), not `css()` miss warnings.
- `packages/reference-rs/modules/atomic/js/*`: no `toBe('')`, no warn, no
  `findStylePlanMisses` outside `plans.ts` itself.

## Prose pins that move (not tests)

- `docs/ATOMIC.md:16` ("warns once, naming the value and the prop"),
  `:323` (`miss → "" + dev warn`). (`:72` is the site-dynamic channel —
  different warning, unaffected.)
- `packages/reference-neo/tests/cases/merge/SPEC.md:37–38` ("miss → nothing").
- `packages/reference-neo/tests/cases/css/TESTS.md:20` (NEO-CSS-14 row).
- `packages/reference-neo/src/runtime/css/css.ts:3–4` header;
  `packages/reference-neo/src/README.md:21`.
