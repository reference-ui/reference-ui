/** Shared constants for Reference UI output layout and tooling. */

/**
 * Unscoped names of generated packages (`@reference-ui/<name>`). Each matches the
 * folder under the sync out dir and the entry under `node_modules/@reference-ui/`
 * (see packager `installPackages`).
 */
export const GENERATED_PACKAGE_NAMES = [
  'react',
  'system',
  'styled',
  'types',
] as const

/**
 * Generated output directories under `.reference-ui/` whose raw file writes
 * should not trigger immediate bundler refresh handling.
 *
 * Includes {@link GENERATED_PACKAGE_NAMES} plus non-package roots written under
 * the same out dir (e.g. `mcp`, `virtual`).
 */
export const GENERATED_OUTPUT_ROOTS = [
  ...GENERATED_PACKAGE_NAMES,
  'mcp',
  'virtual',
] as const

export const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Explicit React DTS roots that we seed into the synthetic tsconfig.
 *
 * These keep packaged consumer declaration output stable when type-only imports
 * are not discovered transitively by `tsgo`.
 */
export const REACT_DTS_INCLUDE = [
  'src/system/primitives/index.tsx',
  'src/system/primitives/types.ts',
  'src/system/runtime/index.ts',
  'src/types/index.ts',
  'src/types/public/index.ts',
  'src/types/public/BaseSystem.ts',
  'src/types/public/colors.ts',
  'src/types/public/conditions.ts',
  'src/types/public/css.ts',
  'src/types/public/fontRegistry.ts',
  'src/types/public/fonts.ts',
  'src/types/public/primitives.ts',
  'src/types/public/props.ts',
  'src/types/public/radii.ts',
  'src/types/public/recipe.ts',
  'src/types/public/strict-colors.ts',
  'src/types/public/strict-radii.ts',
  'src/types/public/style-prop.ts',
  'src/types/public/style-props.ts',
  'src/types/public/system-style-object.ts',
] as const

/**
 * Explicit system DTS roots that we seed into the synthetic tsconfig.
 *
 * The system package re-exports the authored style types via its entry, and the
 * strict-token rewrite owns files under `types/`. Keeping this list explicit
 * avoids depending on whatever transitive declaration graph `tsgo` happens to
 * preserve for type-only star re-exports.
 */
export const SYSTEM_DTS_INCLUDE = [
  'src/types/index.ts',
  'src/types/public/index.ts',
  'src/types/public/BaseSystem.ts',
  'src/types/public/colors.ts',
  'src/types/public/conditions.ts',
  'src/types/public/css.ts',
  'src/types/public/fontRegistry.ts',
  'src/types/public/fonts.ts',
  'src/types/public/primitives.ts',
  'src/types/public/props.ts',
  'src/types/public/radii.ts',
  'src/types/public/recipe.ts',
  'src/types/public/strict-colors.ts',
  'src/types/public/strict-radii.ts',
  'src/types/public/style-prop.ts',
  'src/types/public/style-props.ts',
  'src/types/public/system-style-object.ts',
] as const

/**
 * Picomatch-style glob for the sync output directory under any ancestor (watchers,
 * virtual copy, Panda fragment scan excludes).
 */
export const SYNC_OUTPUT_DIR_GLOB = `**/${DEFAULT_OUT_DIR}/**`
