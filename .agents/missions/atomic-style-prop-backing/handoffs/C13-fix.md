# C13-fix — transitive upstream qualifiers (landed)

## 1. Status

**Status: DONE** — the ratified C13 correction is in the working tree
(`packages/reference-neo/src/sync/index.ts`), native **T17 14/14** and **T16 6/6
with the fix**, and both hermetic gates are green **after the full re-sync
chain**. No commit. No Rust/test change.

## 2. Diff

One file: `packages/reference-neo/src/sync/index.ts` (`evaluateAndCompile`),
the C13 hunk only (the surrounding `deduped` helper + `upstreamSystems` wiring
are T06's uncommitted work; `git diff HEAD` shows the whole fan-out, so the
C13 delta is isolated below):

```diff
-    // Self excluded: the wire list never carries the consumer's own name; the
-    // engine constructs own-first itself (G0 §E/§F).
+    // Self excluded: the wire list never carries the consumer's own name; the
+    // engine constructs own-first itself (G0 §E/§F). Each upstream contributes
+    // its transitively-expanded `streams` names (own entry last, per the
+    // published shape), so a system reached only through a nested stream —
+    // icons under lib — still becomes a qualifier; `.name` is the fallback
+    // for hand-authored baseSystems that never carried `streams`. Mirrors the
+    // existing transitive readers (mergeStreams, hasUpstreamContainerRoot).
     const upstreamSystems = deduped(
       [...(config.extends ?? []), ...(config.layers ?? [])]
-        .map((system) => system.name)
+        .flatMap((system) =>
+          system.streams && system.streams.length > 0
+            ? system.streams.map((stream) => stream.name)
+            : [system.name]
+        )
         .filter((name) => name !== spec.name)
     )
```

Either/or form exactly as ratified (G1c ask 1). No `contract.ts`/`request.ts`
change (length-gated key already exists); no Rust change.

## 3. Evidence

### 3a. Quality gate

```
$ pnpm agentneo q packages/reference-neo/src/sync/index.ts
[neo-quality] 0 errors, 0 warnings, 1 files in 1095ms
```

### 3b. Neo decisive suite (no-upstream byte-identity), green unmodified

```
$ pnpm agentneo run NEO-SYNC-04
[NEO-SYNC-04] PASS compile-request.spec.ts        # exact six keys + exact bytes
$ pnpm agentneo run NEO-SYNC-06
[NEO-SYNC-06] PASS deterministic.spec.ts          # two-sync folder sha identical
```

Direct read of the no-upstream world after the fix:

```
SYNC-04 keys: schemaVersion,spec,jsxHosts,sourceRoot,declarationRoot,include
has upstreamSystems: false
```

→ the `.name` fallback keeps no-upstream worlds byte-identical; key stays absent.

### 3c. T16 native 6/6 WITH the fix (fresh `ref sync`, frozen test untouched)

```
$ (cd matrix/tests/chain/T16 && pnpm exec ref sync)   → CSS: 279.2 KB
$ pnpm agent playwright T16                            → 6 passed (0 failed) 22.2s
```

```
T16 upstreamSystems: ["reference-icons","reference-ui","aliased-host-library"]   # C13: icons now present
T16 reference-icons__ rules: 7      T16 foreign markers: 0
git status --porcelain matrix/tests/chain/T16/  → (empty; frozen)
```

T16 is external-free, so the engine's empty-external short-circuit keeps the
**sheet** byte-identical (7 canonical rules, no foreign group) even though the
request now carries the transitive name. (P4 precision: upstream **request**
bytes change by design; no test pins them.)

### 3d. T17 native 14/14 WITH the fix (fresh `ref sync`)

```
$ (cd matrix/tests/chain/T17 && pnpm exec ref sync)   → CSS: 280.5 KB
$ pnpm agent playwright T17                            → 14 passed (0 failed) 48.5s

T17 upstreamSystems: ["reference-icons","reference-ui","aliased-host-library"]
```

Accounting on the loaded sheet — canonical **7** ∪ consumer-own probe stems
**5**, each selector exactly once, `duplicates == []`:

```
total 12 · unique 12
canonical (also in published icons) 7 : ai_center, c_currentColor, c_inherit,
  d_inline-flex, jc_center, leading_0, shrink_0
consumer-own probes (not in published icons) 5 : c_t17ProbeInk, c_#b70233,
  c_#00b7ab, hover:c_#00b7ab, p_t17ProbeGap
```

Matches T08 §4f / G1c §1 exactly.

### 3e. Full re-sync chain, then hermetic gates

Chain run from the monorepo root:

```
0. Rust binding: no `.rs` newer than dist/native/reference-native.darwin-x64.node
   (host fresh; `pnpm agentrs b` not needed). The matrix **Linux** target was
   stale (Oct 7, 12887464 B) — see caveat — and was force-rebuilt via the
   pipeline's Dagger linux target build (fresh 12940112 B).
1. `ref sync` icons                                       → CSS: 12.1 KB
2. `ref sync` lib                                          → CSS: 287.5 KB
3. materialize-runtime.mjs (icons, lib)                    → OK
4. republish base systems: `pnpm pipeline build`           → neo/icons/lib/fixtures/rust loaded
5. `pnpm agent setup --packages=@matrix/chain-t16,@matrix/chain-t17 --sync`
   → T16 279.2 KB · T17 280.5 KB
6. Dagger engine cache reset (stale node_modules volume)   → see caveat
```

Hermetic gates:

```
$ pnpm agent test --packages=@matrix/chain-t17
  ✓ tests/unit/runtime.test.ts (4 tests)
  🎭 Playwright 14 passed (14)
  [pipeline] All 1 matrix package tests PASSED
  ✔ [agent] Matrix test suite PASSED successfully.

$ pnpm agent test --packages=@matrix/chain-t16
  ✓ tests/unit/runtime.test.ts (4 tests)
  🎭 Playwright 6 passed (6)
  [pipeline] All 1 matrix package tests PASSED
  ✔ [agent] Matrix test suite PASSED successfully.
```

## 4. Ten-line note

1. **DONE** — ratified either/or C13 landed in `sync/index.ts`; T17 native
   14/14, T16 native 6/6, and **both hermetic gates green**; never committed.
2. Derivation: `deduped(upstreams.flatMap(s => s.streams?.length ? s.streams.map(x=>x.name) : [s.name]).filter(n => n !== spec.name))`.
3. No-upstream worlds stay key-absent: SYNC-04 exact six keys + exact bytes,
   SYNC-06 two-sync folder sha, both green unmodified.
4. T16 frozen: no `matrix/tests/chain/T16/**` change; 6/6 native and 6/6
   hermetic with the fix; sheet identity held (7 canonical, 0 foreign markers).
5. T17: `upstreamSystems` now includes `reference-icons`; accounting = canonical
   7 ∪ consumer-own probes 5, each once, `duplicates == []`.
6. **Byte-identity precision (P4, not a regression):** upstream worlds' request
   bytes change by design (T16/T17 requests gain the transitive names); what is
   invariant is the **sheet** bytes (empty-external short-circuit) and the
   no-upstream request bytes — no test pins upstream request bytes.
7. **Hermetic caveat (infra, not C13):** the container's cached `node_modules`
   volume is keyed on the direct workspace deps' artifact hashes and does **not**
   include the transitive `@reference-ui/rust` target, so after republish the
   container still ran the stale Oct 7 Linux engine (signature: *no* foreign
   qualifiers at all — `reference-ui__`/`aliased-host-library__` probes unbacked
   too, exactly T08 §4e-bis). Republish alone is insufficient.
8. Fix applied: force a fresh Linux Rust target (cleared the stale staged
   `dist/native`/`dist/npm/linux-x64-gnu` binary + rust build state, Dagger
   target build → 12940112 B) **and** reset the Dagger engine cache volume
   (`docker rm --force --volumes dagger-engine-v0.21.9`) to force a clean
   reinstall. After that, hermetic T17 14/14 and T16 6/6 pass.
9. Host Rust binding required no rebuild (no `.rs` newer than the darwin-x64
   `.node`); the change is TS-only, so no `reference-rs` source was touched.
10. Scope held: only `packages/reference-neo/src/sync/index.ts` (+ comment) is
    changed by this crew; nothing committed.
