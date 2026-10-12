# T16 — hermetic failure: root cause & verdict

**Status: PARTIAL** — root cause pinned and the "native passes" evidence disproved.
The fix is design-level in the in-progress fan-out engine (owned by the atomic/neo
crews) and was **not** applied here; a precise minimal-fix direction is given below.
Instrumentation that surfaces matrix Playwright failures was landed in `pipeline/**`.

---

## 1. Failing test + expected/received

- **Test:** `matrix/tests/chain/T16/tests/e2e/T16-contract.spec.ts:161`
  `T16 — compose a prebuilt aliased-host package › icons rules arrive exactly once (no duplicated layer copy)`.
- **Assertion that fails first:** line 200 `expect(duplicates).toEqual([])` — received
  `[".reference-icons__w_30r", ".reference-icons__w_55r"]`.
- **Underlying counts (measured on the loaded sheet):** `total = 609` distinct-rule
  occurrences (`w_30r` and `w_55r` appear **twice** each) vs
  `expected = publishedIconsRuleCount() = 7`. So the very next line
  (`expect(total).toBe(expected)`, line 201) is also red: **609 ≠ 7**.
- Native `pnpm agent playwright T16` post-fresh-sync: `5 passed | 1 failed` — same failure.
  Hermetic `pnpm agent test --packages=@matrix/chain-t16`: `5 passed | 1 failed` — same failure.

## 2. Root cause

`@reference-ui/lib` publishes its compiled `utilities` stream with the icons layer
copy **appended a second time as a foreign-qualifier group**; the consumer
(`chain-t16`) concatenates that stream verbatim, so every icons rule arrives twice
on the page.

Exact chain:

1. `packages/reference-lib/ui.config.ts` declares `layers: [iconsBaseSystem]` (icons
   travel as lib's compiled CSS) and `include` covers `src/**/*.{ts,tsx}` **plus
   `book/**/*.{ts,tsx}`** — so tests, stories and Book stories are all compiled.
2. The fan-out gate classifies every capitalized non-host JSX tag as **external**:
   `packages/reference-rs/modules/atomic/src/extract/jsx/mod.rs::tag_gate` (uncommitted)
   → `packages/reference-rs/modules/atomic/src/extract/jsx/names.rs:71 is_external_tag`.
   lib's own non-host capital tags (test fixtures such as `<HandoffFixture order={[…]}>`,
   Book compound tags such as `<Popover.Trigger w="30r">`, `<IconComp …>`) take the
   external path.
3. `assembly::qualifiers_for` (`packages/reference-rs/modules/atomic/src/assembly.rs:54`)
   turns lib's single upstream (`reference-icons`, from `layers`) into
   `["reference-ui","reference-icons"]`, and the external wants are emitted once per
   foreign qualifier via `write_utilities_grouped` →
   `packages/reference-rs/modules/atomic/src/stylesheet/emitter/mod.rs:122 append_utilities_layer`
   (guarded at line 130) and `.../emitter/streams.rs:156 utilities_layer` (the **one
   shared `utilities` stream carries the foreign groups** — G0 §H / T04).
4. Result baked into the published base system: `packages/reference-lib/.reference-ui/system/baseSystem.mjs`
   stream `"reference-ui"` = **2167 `.reference-ui__` rules (own) + 602 `.reference-icons__`
   rules (foreign group)**, 2780 lines; stream `"reference-icons"` = the canonical 7 rules.
   Evidence of over-classification: **515 of the 590 distinct foreign classes also appear
   in lib's own group** — the same self call-sites are being qualified twice.
5. The consumer copies both streams verbatim (lib's `utilities` is a byte-substring of
   the generated page CSS), so the page = 7 canonical + 602 foreign = **609**, with
   `w_30r`/`w_55r` duplicated (they occur twice *inside* lib's own foreign group).

`matrix/tests/chain/T16` and its assertions were **not touched**.

## 3. Pre-existing vs infra-induced — verdict

**Independent of the sibling infra change; it is a regression from the in-progress
fan-out work.**

- The failure is **not hermetic-specific**: it reproduces **natively** the moment
  `ref sync` is re-run in `matrix/tests/chain/T16`
  (`pnpm exec ref sync` → `CSS: 317.8 KB`, 609 icons rules, dup `w_30r`/`w_55r`), then
  `pnpm agent playwright T16` fails `1/6`.
- The captain's **native 6/6 was a stale-artifact false pass.** `pnpm agent playwright T16`
  does **not** run `ref sync`; it serves the cached
  `matrix/tests/chain/T16/.reference-ui/{react,styled}/styles.css`, which was dated
  **Oct 7 14:38** (284 500 B, 7 icons rules) — generated **before** the Oct 10 fan-out
  edits. The hermetic path always runs `ref sync --watch` fresh in-container, so it
  truthfully reports the current tree RED. That, not the engine fan-out output, is why
  "native green, hermetic red" diverged.
- The staging/cargo change (`pipeline/src/registry/package-prep.ts`, `targets.ts`,
  `.cargo/config.toml`) only filters build scratch from `.pipeline/registry/staging`;
  it does not touch composition and cannot produce this. The hermetic Linux native is
  also stale (Oct 7) but is irrelevant here: the **fresh native darwin engine produces
  the identical 609-rule output**.

## 4. Fix

**Landed (instrumentation only, keeps T16's contract intact):**

- `pipeline/src/testing/matrix/runner/playwright-reporter.ts` — the injected summary
  reporter now prints each failing test's `titlePath` and assertion messages in
  `onEnd()`, so a red matrix names the break instead of only `N passed | M failed`.
- `pipeline/src/testing/matrix/runner/package-runner.ts` — on a failed exec, the
  captured `stdout`/`stderr` (the reporter output) are now persisted into
  `…-test.log` alongside the exit line, so the detail survives the container.

```diff
// playwright-reporter.ts
+    this.failures = [];
...
   onTestEnd(test, result) {
     if (result.status === 'passed') { this.passed++; return; }
-    this.failed++;
+    this.failed++;
+    const title = (typeof test.titlePath === 'function' ? test.titlePath() : []).filter(Boolean).join(' › ');
+    const errors = Array.isArray(result.errors) && result.errors.length ? result.errors : (result.error ? [result.error] : []);
+    this.failures.push({ title: title || test.title, messages: errors.map(e => String(e?.message ?? e)).filter(m => m.trim()) });
...
   onEnd() {
...
+    if (this.failures.length > 0) {
+      console.log(boldRed('  Failed tests:'));
+      for (const failure of this.failures) {
+        console.log('    ' + boldRed('✘') + ' ' + failure.title);
+        for (const message of failure.messages) for (const line of message.split('\n')) console.log('        ' + line);
+      }
+    }
   }
```

```diff
// package-runner.ts (catch)
-    await writeMatrixPackageStageLog(packageRunContext, phase, errorMessage)
+    const errorStdout = readErrorOutput((error as { stdout?: unknown })?.stdout).trim()
+    const errorStderr = readErrorOutput((error as { stderr?: unknown })?.stderr).trim()
+    const stageLogOutput = [errorMessage, errorStdout, errorStderr].filter(p => p.length > 0).join('\n')
+    await writeMatrixPackageStageLog(packageRunContext, phase, stageLogOutput)
```

**Minimal correctness fix (NOT applied — requires a fan-out design ruling):**

- Either (a) make a published base system's `baseSystem.streams.utilities` **own-only** —
  keep foreign-qualifier groups in the rendered `stylesheet`/`portable_stylesheet` but
  not in the stream a downstream compose copies verbatim
  (`packages/reference-rs/modules/atomic/src/stylesheet/emitter/streams.rs`, and the
  portable path); this is the change T16's frozen contract requires and keeps the
  consumer free to re-derive foreign rules from the upstream's own stream; **or**
- (b) stop qualifying a **self-compiling package's own** non-host capital tags as
  external when they are not owned by a declared upstream system — the 515/590
  own↔foreign overlap shows lib's own call-sites are the source; and exclude test/book
  files from `packages/reference-lib/ui.config.ts`'s `include`.

Whichever is chosen, the test-infra gap must also close: the **native** T16 path must
run `ref sync` (or the matrix packages must not ship a committed `.reference-ui`), or
else native can never be evidence for the gate.

## 5. Evidence

```
# Native, fresh sync — REPRODUCES the hermetic failure:
$ (cd matrix/tests/chain/T16 && pnpm exec ref sync)          # → CSS: 317.8 KB
$ grep -oE '\.reference-icons__[^ {]*' .reference-ui/react/styles.css | wc -l   # → 609
$ grep -cE '\.reference-icons__w_30r ' .reference-ui/react/styles.css          # → 2
$ pnpm agent playwright T16
  → 1 failed | 5 passed (26.9s); duplicates = [".reference-icons__w_30r", ".reference-icons__w_55r"]

# Hermetic — same failure (now with detail surfaced by the landed reporter):
$ pnpm agent test --packages=@matrix/chain-t16
  → 🎭 Playwright 5 passed | 1 failed (6)
    ✘ vite7 › T16-contract.spec.ts › … › icons rules arrive exactly once (no duplicated layer copy)
      expect(received).toEqual(expected)
      - Array []
      + Array [ ".reference-icons__w_30r", ".reference-icons__w_55r", ]

# Pre-fix stale artifact that produced the false native pass:
$ ls -laT matrix/tests/chain/T16/.reference-ui/styled/styles.css   # Oct  7 14:38 (284500 B, 7 icons rules)
```

## 6. Ten-line note

1. T16 test 6 is red on the **current tree**; `native 6/6` was the stale Oct 7
   `.reference-ui`, because `pnpm agent playwright T16` never runs `ref sync`.
2. The hermetic runner always re-syncs, so hermetic is the honest signal.
3. lib publishes its `utilities` stream **with a 602-rule `reference-icons__` foreign
   group appended** after its 2167 own rules (`baseSystem.mjs` stream `reference-ui`).
4. The consumer copies that stream verbatim, so icons rules = 7 canonical + 602 = 609.
5. `w_30r`/`w_55r` duplicate because they occur twice *inside* lib's own foreign group.
6. The foreign group exists because the fan-out gate externalizes lib's own non-host
   capital tags (Book compound tags, test fixtures); 515/590 foreign classes are also own.
7. lib has one upstream qualifier (`reference-icons` from `layers`), so all those wants
   are mis-qualified `reference-icons__` (`assembly.rs:54`, `emitter/mod.rs:122`).
8. Independent of the package-prep/cargo staging change; reproduces natively and with
   the fresh darwin engine, so it is a fan-out regression, not infra.
9. Fix is design-level: keep foreign groups out of published `streams`, or stop
   externalizing a self-compiling package's own capital tags; plus exclude test/book
   from lib's `include`.
10. Landed here: Playwright failure detail now prints and persists to the stage log
    (`playwright-reporter.ts`, `package-runner.ts`). T16 assertions untouched.
