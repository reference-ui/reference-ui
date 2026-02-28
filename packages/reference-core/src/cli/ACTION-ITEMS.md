# Complexity Report – Action Items

Generated from `pnpm run complexity`. Focus on high-impact refactors to reduce cognitive load and improve maintainability.

---

## 🔴 Critical Priority (Highest Cognitive Load)

### [DONE] 1. `src/cli/lib/resolve-core.ts` – **HIGHEST COMPLEXITY**

- **Cyclomatic complexity:** 11 (module), 8 (`resolveCorePackageDir`)
- **Halstead effort:** 22,339 (`resolveCorePackageDir`) + 5,405 (`resolveCorePackageDirForBuild`)
- **Maintainability:** 92
- **Issue:** Duplicate `while` loop pattern for walking directory trees. High cognitive effort to understand resolution logic.
- **Actionable Steps:**
  1. Extract `walkUpToPackageJson(startDir, packageName)` helper
  2. Extract `findMonorepoRoot(startDir)` helper (checks for pnpm-workspace.yaml, nx.json)
  3. Extract `resolveFromWorkspace(rootDir, packagePath)` helper
  4. Use early returns to flatten nesting in try-catch blocks
  5. Add JSDoc examples for each resolution strategy

### [DONE] 2. `src/cli/config/load-config.ts` – **HIGH COGNITIVE LOAD**

- **Cyclomatic complexity:** 8 (anonymous callback at line 80)
- **Halstead effort:** 8,414 (callback), 1,955 (loadConfigFile callback)
- **Physical LOC:** 126
- **Maintainability:** 111
- **Issue:** `loadUserConfig` callback has 8 branches and handles multiple concerns (file discovery, loading, merging, validation).
- **Actionable Steps:**
  1. Extract `findConfigFile(cwd)` → returns path or null
  2. Extract `validateConfig(config)` → throws on invalid config
  3. Extract `mergeWithDefaults(userConfig)` → returns merged config
  4. Reduce nesting by using early returns for error cases
  5. Consider using Result type pattern instead of throwing

### [ ] 3. `src/cli/packager/packages.ts` – **LOWEST MAINTAINABILITY**

- **Maintainability:** 80 (lowest in codebase)
- **Logical LOC:** 42 in 57 physical lines (very dense: 73%)
- **Issue:** Dense export definitions with nested objects. Difficult to scan and modify.
- **Actionable Steps:**
  1. Extract package export patterns into reusable templates
  2. Create `createPackageDefinition()` builder function
  3. Add inline comments explaining export configuration patterns
  4. Consider moving to a data file (JSON/YAML) if appropriate
  5. Add schema validation for package definitions

### [ ] 4. `src/cli/packager/bundler.ts` – **LARGE MODULE**

- **Cyclomatic complexity:** 15
- **Physical LOC:** 261
- **Halstead effort:** High across multiple functions
- **Issue:** Too many responsibilities (bundling, copying, transforming, writing).
- **Actionable Steps:**
  1. Split into `bundler/esbuild.ts` (bundling logic)
  2. Split into `bundler/files.ts` (file operations: copy, write)
  3. Split into `bundler/transform.ts` (TypeScript transformation)
  4. Split into `bundler/package.ts` (package.json creation)
  5. Keep orchestration logic in main `bundler/index.ts`
  6. Target: each file < 100 LOC

---

## 🟡 High Priority (Refactor for Clarity)

### [ ] 5. `src/cli/lib/child-process.ts` – **OVERSIZED FUNCTIONS**
- **Physical LOC:** 219
- **Halstead effort:** 3,314 (`spawnMonitored`), 784 (`spawnMonitoredAsync` callback)
- **Issue:** `spawnMonitoredAsync` is 82 LOC with nested promise/event handling.
- **Actionable Steps:**
  1. Extract `setupProcessMonitoring(childProcess, pid)` → returns cleanup function
  2. Extract `captureProcessOutput(childProcess)` → returns { stdout, stderr }
  3. Extract `handleProcessExit(code, signal)` → returns result object
  4. Reduce promise nesting by using async/await more consistently
  5. Consider using an EventEmitter-based API for better composability

### [ ] 6. `src/cli/system/config/panda/createPandaConfig.ts` – **LOW MAINTAINABILITY**
- **Maintainability:** 87.77 (below threshold)
- **Halstead effort:** High across async operations
- **Dependency count:** 7
- **Issue:** Orchestrates multiple concerns (scanning, bundling, emitting events).
- **Actionable Steps:**
  1. Extract `collectConfigFiles(coreDir, userDirs)` → returns paths[]
  2. Extract `bundleConfigFiles(entryPath, configFiles)` → returns bundled code
  3. Extract `emitConfigEvents(config)` → side effect function
  4. Move template generation to separate module
  5. Document each step with clear intent comments

### [ ] 7. `src/cli/system/config/fontFace/generateFontSystem.ts` – **COMPLEX LOGIC**
- **Cyclomatic complexity:** 6
- **Physical LOC:** 176
- **Issue:** Large file with complex string building and transformations.
- **Actionable Steps:**
  1. Extract `parseFontFamily(path)` → returns family name
  2. Extract `buildFontFaceDeclaration(family, definitions)` → returns CSS string
  3. Extract `buildTransformMap(definitions)` → returns transform config
  4. Consider using a template engine instead of string concatenation
  5. Add unit tests for each transformation function

---

## 🟢 Medium Priority (Improve Structure)

### [ ] 8. `src/cli/sync/index.ts` – **HIGH COUPLING**
- **Maintainability:** 94
- **Dependency count:** 8
- **Issue:** Too many dependencies, mixing orchestration with implementation.
- **Actionable Steps:**
  1. Review each import: is it needed at this level?
  2. Extract worker coordination into `sync/coordinator.ts`
  3. Keep `sync/index.ts` as a thin facade (< 30 LOC)
  4. Consider dependency injection for testability

### [ ] 9. `src/cli/lib/index.ts` – **BARREL FILE AUDIT**
- **Maintainability:** 96
- **Dependency count:** 5
- **Action:** Audit unused exports. Consider explicit exports over barrel pattern to improve tree-shaking.

### [ ] 10. `src/cli/system/collectors/runCollectScript.ts`
- **Physical LOC:** 81, Logical LOC: 46
- **Maintainability:** 96.8
- **Action:** Extract `invokeMicrobundle(args)` helper function. Simplify error handling.

---

## 📊 Monitor (Acceptable, but watch for growth)

- `src/cli/event-bus/index.ts` – CC 6, maintainability 123 ✅
- `src/cli/virtual/native/loader.ts` – CC 6, 64 LOC ✅
- `src/cli/thread-pool/index.ts` – CC 6, maintainability 128 ✅
- `src/cli/packager/index.ts` – CC 4, maintainability 120 ✅

---

## 📈 Metrics Reference

| Metric                      | Good      | Concern   | Critical  |
| --------------------------- | --------- | --------- | --------- |
| Cyclomatic complexity       | < 5       | 5-10      | ≥ 10      |
| Maintainability index       | > 100     | 90-100    | < 90      |
| Logical LOC per function    | < 15      | 15-30     | > 30      |
| Physical LOC per module     | < 150     | 150-250   | > 250     |
| Halstead effort             | < 1,000   | 1,000-5K  | > 5,000   |
| Function parameter count    | < 3       | 3-4       | > 4       |
| Dependency count (module)   | < 5       | 5-8       | > 8       |

**Key insights from current codebase:**
- Mean per-function logical LOC: **7.87** ✅ (Good)
- Mean parameter count: **0.82** ✅ (Excellent)
- Mean cyclomatic complexity: **1.43** ✅ (Excellent)
- Mean maintainability index: **121.9** ✅ (Good)
- First-order density: **1.47%** (modules calling other modules)
- Core size: **29.17%** (critical modules)

---

## 🎯 General Refactoring Guidelines

### When to extract a function:
1. Code block does one clear thing and can be named meaningfully
2. Logic is repeated in multiple places
3. Function exceeds 20 logical LOC
4. Nesting depth > 3 levels
5. Complex conditional logic that can be named

### When to split a module:
1. File exceeds 150 physical LOC
2. Module has > 5 external dependencies
3. Module mixes multiple concerns (orchestration + implementation)
4. More than 5 exported functions

### Code quality targets:
- **Functions:** Single responsibility, < 15 logical LOC, < 3 parameters
- **Modules:** Single concern, < 150 physical LOC, < 5 dependencies
- **Complexity:** CC < 5 per function, use early returns to flatten
- **Naming:** Intent-revealing function names that describe the outcome
- **Testing:** Complex logic (CC > 3) should have unit tests

### Refactoring order:
1. Start with highest Halstead effort (cognitive load)
2. Extract pure functions first (easier to test)
3. Reduce cyclomatic complexity through early returns
4. Split large modules into focused single-purpose files
5. Add tests before and after refactoring

---

## 🚀 Performance Considerations

Files with native Rust implementations available:
- `src/cli/virtual/native/` – Consider migrating transforms to Rust for 10-50x speedup
- See `RUST_MIGRATION_GUIDE.md` for migration strategy

---

## 📝 Notes

- This report is generated automatically from `pnpm run complexity`
- Rerun after each refactoring to validate improvements
- Track metrics over time to ensure code quality is maintained
- Review this file monthly and update priorities

**Last updated:** 2026-02-28
