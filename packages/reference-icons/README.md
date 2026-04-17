# @reference-ui/icons

Material Symbols as Reference UI icon components (outline / filled, weight 500). The package entry is only `export * from './generated/index'`; implementation files under `src/` are not part of the public API. **`src/generated/` is gitignored**—run `pnpm run icons:generate` (or `pnpm run build`, which generates first) after clone or when upgrading `@material-symbols-svg/react`. Build output goes to `dist/` (gitignored); run `pnpm run build` before `pnpm pack` / publish. `build` skips `tsup` when a content fingerprint of `src/` plus `tsup.config.ts` / `tsconfig.json` / `package.json` matches the last successful build (see `scripts/tsup-if-needed.mjs`). Set `FORCE_REFERENCE_ICONS_TSUP=1` to always run `tsup`.

## Sync & benchmarks

`ui.config.ts` drives `pnpm run sync` (`ref sync`) so you can benchmark the Reference pipeline on this package. That emits `.reference-ui/` here (gitignored at repo root). `tsconfig` resolves styled types from `./.reference-ui` first, then falls back to `reference-lib`’s output if you have not synced in this package yet.
