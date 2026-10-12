# NEO-CSS-14 — fix: token-license the harvest palette (case-side)

## 1. Status

**Status: DONE**

The stale case is green again, and the engine is untouched. `NEO-CSS-14`
now declares its palette colors as `colors` tokens so the allowlist
licenses the pooled literals; the spec, case README, and the CSS ledger
all state the 2-floor + no-rows reality. A new Rust seam station
(`ATM-HARVEST-07`) pins the token-license arm end-to-end.

## 2. Files changed + diff

All under `packages/reference-neo/tests/cases/css/` plus the new station
under `packages/reference-rs/modules/atomic/tests/cases/ATM-HARVEST-07/`.
No engine file, no `allowlist.rs`, no `mint/*` change.

**New — `NEO-CSS-14/world/src/tokens.ts`** (fragment form, mirrors
`NEO-TOKEN-09` / `NEO-CSS-05`; the `include` glob picks it up, no import
needed, no static site added):

```ts
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    red: { value: 'red' },
    blue: { value: 'blue' },
  },
})
```

**`git diff` — `NEO-CSS-14/specs/paint.spec.ts`:**

```diff
- // diagnostic, or the bundle that failed to fan the floor out.
+ // diagnostic, or the bundle that leaked a per-atom row.
@@ line 56
-  assert.equal(utilityCount, 3, `sheet carries the palette floor plus the ink floor, got ${utilityCount}`);
+  assert.equal(utilityCount, 2, `sheet carries only the licensed palette floor, got ${utilityCount}`);
@@ line 128
-  assert.equal(infos[0]?.message, 'color under []: 3 harvested values minted');
+  assert.equal(infos[0]?.message, 'color under []: 2 harvested values minted');
```

**`git diff` — `NEO-CSS-14/README.md`:**

```diff
-A dynamic-site color from a palette array no static site reads paints through harvested plans, while an unwritten color paints nothing with exactly one dev console diagnostic — and both published bundles carry the floor.
+A dynamic-site color from a palette array no static site reads paints through harvested plans once its colors are declared as tokens, while an unwritten color paints nothing with exactly one dev console diagnostic — and neither published bundle carries a per-atom row.
```

**`git diff` — `css/TESTS.md` (ledger row 20):** claim/engine/proof text
reworded to "once the palette colors are declared as tokens" +
"neither bundle carries a per-atom row" + "one sink info counting 2";
engine cell gains `07`.

**New — `ATM-HARVEST-07/`** (`input/src/App.tsx`, `input/baseSystem.json`,
`spec.ts`, `README.md`, and committed `output/`):

- `input/baseSystem.json` declares `tokens.colors.red = {value:'red'}` and
  `tokens.colors.blue = {value:'blue'}`.
- `input/src/App.tsx` pools `['red','blue','hotpink']` (no site reads it)
  behind a dynamic `css({ color })` sink.
- Output: `color:red` + `color:blue` mint (2 harvested wants, sheet
  `color: red;` / `color: blue;`), `hotpink` never mints; one
  `ATM-I-HARVEST-SINK` info `"color under []: 2 harvested values minted"`.

The regenerated sheet proves the license mechanism — the atoms paint the
pooled keyword text, not a token var:

```css
@layer utilities {
  .neo-css14__c_blue { color: blue; }
  .neo-css14__c_red { color: red; }
}
```

## 3. Suite logs

**Decisive 1 — `pnpm agentneo run NEO-CSS-14` → PASS:**

```
[NEO-CSS-14] world build: 3 files → dist/
[NEO-CSS-14] sync 218ms
[NEO-CSS-14] PASS paint.spec.ts
[NEO-CSS-14] artifact: .../NEO-CSS-14/screenshot.png
[NEO-CSS-14] artifact: .../NEO-CSS-14/a11y.yml
```

**Decisive 2a — `pnpm agentrs c atomic` → green (822 passed, 0 failed):**

```
test result: ok. 808 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out   (lib.rs)
test result: ok.   1 passed; 0 failed;   (backfill_skip.rs)
test result: ok.   1 passed; 0 failed;   (harvest_pool.rs)
test result: ok.   7 passed; 0 failed;   (scan_retention.rs)
test result: ok.   5 passed; 0 failed;   (serializer_parity.rs)
✔ [agent-rs] Rust tests PASSED!
```

**Decisive 2b — `pnpm agentrs v atomic` → green (15 files, 315 tests):**

```
Test Files  15 passed (15)
     Tests  315 passed (315)
✔ [agent-rs] Vitest tests PASSED!
```

(Was 314 tests / 14 files; the new `ATM-HARVEST-07` station adds the 315th
and its golden was generated with `pnpm agentrs v atomic -t ATM-HARVEST-07
--update-goldens`.)

**Quality gates on touched files:**

```
$ pnpm agentneo q .../NEO-CSS-14/world/src/tokens.ts .../NEO-CSS-14/specs/paint.spec.ts
[neo-quality] 0 errors, 0 warnings, 2 files in 1135ms

$ pnpm agentrs q .../cases/ATM-HARVEST-07
✔ ALL 2 FILES PASSED QUALITY CHECKS!
```

(The full-directory `agentneo q` invocation also scans the generated
`world/.reference-ui/**` artifacts and reports their pre-existing warnings;
the gate is clean over every file this crew authored/edited.)

## 4. 10-line handoff note

1. Root cause confirmed: commit `5f9348cd6` gates dynamic color harvesting
   to declared `colors` tokens, so NEO-CSS-14's tokenless world minted 0.
2. Fix is entirely case-side; no engine behavior changed (no allowlist,
   mint, or validity edit).
3. `world/src/tokens.ts` declares `colors.red`/`colors.blue`; the include
   glob collects it, so no import and no static site is added.
4. `token_category("red"/"blue") → "colors"` makes `is_allowlisted_color`
   pass; the two pooled keywords dedupe against the palette literals, so
   the pool gains nothing.
5. The minted atoms paint the pooled keyword text (`color: red;`), which
   is why the `rgb(255,0,0)` / `rgb(0,0,255)` computed asserts still hold.
6. `'#111111'` (global ink) stays unrecoverable — a hex is never a token
   path — so the floor drops 3→2 and the miss element still rests on the
   static `@layer global` ink; spec lines 56/128 updated to match.
7. README + `css/TESTS.md` reworded from the stale "3-floor / bundles
   carry the floor" to 2-floor + no-rows.
8. **Seam station landed:** `ATM-HARVEST-07` pins the token-license arm
   end-to-end (token-named palette + declared `colors` tokens → mints;
   undeclared word still never does) — the license arm previously had only
   unit coverage (`color_allowlist_licenses_declared_color_tokens`).
9. Nothing committed; all changes left in the working tree.
10. Decisive verification: `NEO-CSS-14` PASS; `agentrs c atomic` 822/0;
    `agentrs v atomic` 315/315; gates clean on touched files.
