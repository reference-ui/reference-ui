# Ghost in the Machine

**TL;DR:** If builds fail with "No matching export in ../reference-core/src/system/css/index.js for import css/cva" — remove the generated config (and optionally `.ref/`) and run again. Symlinks + cached generated state can corrupt in ways that only a clean slate fixes.

---

## Symptoms

- **Error:** `No matching export in "../reference-core/src/system/css/index.js" for import "css"` (and similarly for `cva`, `cx`, `sva`)
- **Trace:** Occurs during `pnpm dev` when reference-docs (or another consumer) runs `ref sync --watch`
- **Affected:** Virtual worker, packager, packager-ts — any step that bundles or resolves reference-core source
- **Files:** `reference-core/src/styled/api/runtime/css.ts`, `recipe.ts` import from `../../../system/css/index.js`
- **Root cause:** `system/css/css.js`, `system/css/cva.js`, etc. are **Panda-generated**. If they're empty or stale, imports fail.

---

## Trace (from pnpm dev)

```
[docs] [virtual:worker] Processing 24 files for pattern: src/**/*.{ts,tsx,mdx}
[docs] [packager:ts] Building types for @reference-ui/react...
[docs] ✘ [ERROR] No matching export in "../reference-core/src/system/css/index.js" for import "css"
    ../reference-core/src/styled/api/runtime/css.ts:6:9
[docs] ✘ [ERROR] No matching export in "../reference-core/src/system/css/index.js" for import "cva"
    ../reference-core/src/styled/api/runtime/recipe.ts:7:2
```

The virtual worker transforms user files. Those files (or their transitive imports) pull in reference-core's `styled/api/runtime/*`, which imports from `system/css`. The packager bundles reference-core source. If `system/css/*.js` are empty (Panda hasn't run yet, or output is corrupted), esbuild fails.

---

## Symlinks

The CLI uses symlinks for HMR:

- **Packager:** Writes to `.reference-ui/<pkg>/`, symlinks `node_modules/@reference-ui/<pkg>` → `.reference-ui/<pkg>`
- **reference-core:** Panda outputs to `src/system/` (or `styled-system/` in some setups)
- **Resolution:** Node/Vite follow symlinks. If a symlink points at a stale, empty, or wrong path, resolution breaks silently until a bundler actually reads the file.

Corrupt or inconsistent symlink chains + cached generated files = "ghost" behavior. The state looks fine until something resolves through the wrong link.

---

## Fix

1. **Remove generated config:** Delete `reference-core/panda.config.ts` (the one created by `createPandaConfig`, not `panda.base.ts`)
2. **Optional:** `rm -rf reference-core/.ref`
3. **Optional:** `rm -rf reference-core/src/system` (Panda will regenerate)
4. Run `ref sync` (or `pnpm dev`) again — a fresh run regenerates everything

---

## Why it happens

- **Pipeline order:** Virtual/packager can run before Panda has finished. If `system/` is empty from a previous failed or partial run, the next build reads those empty files.
- **Caching:** Incremental builds reuse `.ref/`, `panda.config.ts`, `system/` across runs. A bad state persists.
- **Symlinks:** Add another layer of indirection. Stale links or wrong targets cause resolution to hit empty or old files.

---

## Mitigation ideas (not implemented)

- Detect empty `system/css/*.js` and fail fast with a clear "run ref sync first" message
- Checksum or validate generated output before trusting it
- Document the clean-slate reset in a troubleshooting section
