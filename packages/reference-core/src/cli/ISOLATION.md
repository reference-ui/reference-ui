# Isolation — Symlink Corruption & Per-Consumer Outputs

## Problem: Shared State Across Consumers

When multiple packages in a monorepo run `ref sync`, they share physical paths through symlinks. That causes corruption and non-determinism.

### What Gets Shared

| Artefact | Location | Problem |
| -------- | -------- | ------- |
| **src/system/** | `reference-core/src/system/` | Panda writes styles, jsx factory, patterns, recipes, types here. All consumers use the same `@reference-ui/core` (symlinked) → same `src/system/`. Last writer wins. |
| **panda.config.ts** | Was `reference-core/panda.config.ts`, now `consumer/.reference-ui/panda.config.ts` | Previously shared; moved to consumer. Config content is now per-consumer. |
| **eval / .ref/** | `reference-core/.ref/` | Eval fragments, panda-entry, collected JSON. All consumers share this dir when core is symlinked. |
| **.virtual/** | Was `reference-core/.virtual/`, now `consumer/.reference-ui/virtual/` | Virtual file copy — previously shared; moved to consumer. |

### Why Symlinks Cause It

- `reference-docs`, `reference-lib`, `reference-app` depend on `@reference-ui/core` (workspace)
- pnpm symlinks `node_modules/@reference-ui/core` → `packages/reference-core`
- `resolveCorePackageDir(cwd)` returns `packages/reference-core` for all consumers
- Any output under `reference-core/` is shared; concurrent or sequential syncs overwrite each other

### Symptoms

- `styled` / `factory` import errors — `src/system/jsx/factory.js` has no exports because it was overwritten for a different consumer
- Token bleed — one package’s tokens appear in another’s
- Config from wrong consumer — include paths, virtual dir, extends pointing to the wrong project
- Flaky tests — order of `pnpm dev` or test matrix changes which consumer’s output “wins”

---

## Solution: Per-Consumer Isolation Under `.reference-ui/`

Move all mutable, consumer-specific outputs into the consumer project:

```
consumer/.reference-ui/
├── panda.config.ts     # already moved
├── virtual/            # already moved
└── internal/           # NEW: isolate everything else
    ├── system/         # Panda outdir (styles, jsx, patterns, recipes, types)
    ├── .ref/           # Eval temp (panda-entry, fragments, collected JSON)
    └── (any other eval/codegen temp files)
```

### Changes Required

1. **Panda outdir** — `outdir: 'src/system'` → `outdir: '.reference-ui/internal/system'` (relative to consumer cwd). All Panda output goes to consumer, not core.

2. **createPandaConfig** — Already writes to `consumer/.reference-ui/panda.config.ts`. Keep. Optionally move to `.reference-ui/internal/panda.config.ts` for consistency.

3. **Eval / .ref** — Write to `consumer/.reference-ui/internal/.ref/` instead of `coreDir/.ref/`. Entry files, bundled fragments, collected JSON live in consumer.

4. **createBaseSystem** — Reads `coreDir/src/system/styles.css`. After (1), that path becomes `consumer/.reference-ui/internal/system/styles.css`. Pass consumer path.

5. **Packager** — Copies styles from Panda output to install location. Source path changes from `coreDir/src/system/` to `consumer/.reference-ui/internal/system/`.

6. **Virtual** — Already at `consumer/.reference-ui/virtual/`. No change.

7. **Imports in source** — Primitives, entry/react, etc. import from `../system/jsx`, `../system/patterns/box`, etc. Those paths resolve at runtime in the built `@reference-ui/react` package. The packager bundles from… core’s source? Or from the installed output? Need to trace: packager reads styles from core; it also bundles react entry. The react entry imports from system. So system must exist and be correct when the packager runs. If system moves to consumer, the packager needs to read from `consumer/.reference-ui/internal/system/` or from wherever the “canonical” system is. For the React bundle, we probably still build from core’s system (or a copied path). The key is: Panda writes to consumer; we copy from there. The packager’s input could be the consumer’s system output. Full trace needed. See packager flow.

---

## Migration Order

1. **panda.config.ts** — Done (consumer `.reference-ui/`).
2. **virtual** — Done (consumer `.reference-ui/virtual/`).
3. **.ref** — Move eval temp dir to `consumer/.reference-ui/internal/.ref/`.
4. **Panda outdir** — Change to `consumer/.reference-ui/internal/system/`; update all readers (createBaseSystem, packager).
5. **Verification** — `pnpm dev` with lib + docs; both sync; neither corrupts the other.

---

## References

- `createPandaConfig.ts` — writes config; uses `.ref` in core.
- `gen/code.ts` — runs Panda; reads config from consumer; Panda `cwd` and `outdir`.
- `createBaseSystem.ts` — reads `coreDir/src/system/styles.css`.
- `packager/install/packages.ts` — copies `coreDir/src/system/styles.css` to React package.
- `virtual/run.ts`, `virtual/sync.ts` — use `consumer/.reference-ui/virtual/`.
- `TODO.md` — Panda config bleed; isolation is the fuller fix.
